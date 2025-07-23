'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CSVRow, EnrichmentField, RowEnrichmentResult } from '@/lib/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SourceContextTooltip } from './source-context-tooltip';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Download, 
  X, 
  Copy, 
  ExternalLink, 
  Globe, 
  Mail, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Star, 
  Send, 
  Zap,
  Search,
  Filter,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FilterX
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

interface EnrichmentTableProps {
  rows: CSVRow[];
  fields: EnrichmentField[];
  emailColumn?: string;
  onReset?: () => void;
}

export function EnrichmentTable({ rows, fields, emailColumn, onReset }: EnrichmentTableProps) {
  const [results, setResults] = useState<Map<number, RowEnrichmentResult>>(new Map());
  const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'cancelled'>('idle');
  const [currentRow, setCurrentRow] = useState(-1);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [useAgents] = useState(true); // Default to using agents
  const [selectedRow, setSelectedRow] = useState<{
    isOpen: boolean;
    row: CSVRow | null;
    result: RowEnrichmentResult | undefined;
    index: number;
  }>({ isOpen: false, row: null, result: undefined, index: -1 });
  const [copiedRow, setCopiedRow] = useState<number | null>(null);
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const [showSkipped, setShowSkipped] = useState(false);
  const [agentMessages, setAgentMessages] = useState<Array<{
    message: string;
    type: 'info' | 'success' | 'warning' | 'agent';
    timestamp: number;
    rowIndex?: number;
  }>>([]);
  const agentMessagesEndRef = useRef<HTMLDivElement>(null);
  const activityScrollRef = useRef<HTMLDivElement>(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Sorting and filtering states
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // Source modal state
  const [sourceModal, setSourceModal] = useState<{
    isOpen: boolean;
    url: string;
    domain: string;
    snippet?: string;
    sources?: Array<{ url: string; snippet?: string }>;
    count?: number;
    legacySource?: string;
  }>({ isOpen: false, url: '', domain: '' });

  // Track when each row's data arrives
  const [rowDataArrivalTime, setRowDataArrivalTime] = useState<Map<number, number>>(new Map());
  const [cellsShown, setCellsShown] = useState<Set<string>>(new Set());
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup animation timer on unmount
  useEffect(() => {
    const timer = animationTimerRef.current;
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, []);
  
  // Auto-scroll to bottom when new agent messages arrive
  useEffect(() => {
    if (activityScrollRef.current) {
      activityScrollRef.current.scrollTop = activityScrollRef.current.scrollHeight;
    }
  }, [agentMessages]);

  // Calculate animation delay for each cell
  const getCellAnimationDelay = useCallback((rowIndex: number, fieldIndex: number) => {
    const arrivalTime = rowDataArrivalTime.get(rowIndex);
    if (!arrivalTime) return 0; // No delay if no arrival time
    
    // Reduced animation time for better UX
    const totalRowAnimationTime = 2000; // 2 seconds
    const delayPerCell = Math.min(300, totalRowAnimationTime / fields.length); // Max 300ms per cell
    
    // Add delay based on field position
    return fieldIndex * delayPerCell;
  }, [rowDataArrivalTime, fields.length]);

  // Enhanced filtering and sorting logic
  const filteredAndSortedRows = React.useMemo(() => {
    // First filter rows
    let filtered = rows.map((row, index) => ({ row, originalIndex: index })).filter(({ row, originalIndex }) => {
      const result = results.get(originalIndex);
      const email = emailColumn ? row[emailColumn] : Object.values(row)[0];
      
      // Search filter
      const matchesSearch = searchTerm === '' || 
        email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        Object.values(row).some(value => 
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        fields.some(field => {
          const enrichment = result?.enrichments[field.name];
          const value = enrichment?.value;
          return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
        });
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'completed' && result?.status === 'completed') ||
        (statusFilter === 'processing' && (currentRow === originalIndex || !result)) ||
        (statusFilter === 'failed' && result?.status === 'error') ||
        (statusFilter === 'skipped' && result?.status === 'skipped');
      
      // Column-specific filters
      const matchesColumnFilters = Object.entries(columnFilters).every(([fieldName, filterValue]) => {
        if (!filterValue) return true;
        
        if (fieldName === 'email') {
          return email?.toLowerCase().includes(filterValue.toLowerCase());
        }
        
        const result = results.get(originalIndex);
        const enrichment = result?.enrichments[fieldName];
        const value = enrichment?.value;
        
        if (value === null || value === undefined) return false;
        return value.toString().toLowerCase().includes(filterValue.toLowerCase());
      });
      
      return matchesSearch && matchesStatus && matchesColumnFilters;
    });

    // Then sort
    if (sortField) {
      filtered.sort((a, b) => {
        let aValue, bValue;
        
        if (sortField === 'email') {
          aValue = emailColumn ? a.row[emailColumn] : Object.values(a.row)[0];
          bValue = emailColumn ? b.row[emailColumn] : Object.values(b.row)[0];
        } else if (sortField === 'status') {
          const aResult = results.get(a.originalIndex);
          const bResult = results.get(b.originalIndex);
          aValue = aResult?.status || 'pending';
          bValue = bResult?.status || 'pending';
        } else {
          const aResult = results.get(a.originalIndex);
          const bResult = results.get(b.originalIndex);
          aValue = aResult?.enrichments[sortField]?.value;
          bValue = bResult?.enrichments[sortField]?.value;
        }
        
        // Handle null/undefined values
        if (aValue === null || aValue === undefined) aValue = '';
        if (bValue === null || bValue === undefined) bValue = '';
        
        // Convert to strings for comparison
        const aStr = aValue.toString().toLowerCase();
        const bStr = bValue.toString().toLowerCase();
        
        const comparison = aStr.localeCompare(bStr);
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    
    return filtered;
  }, [rows, results, searchTerm, statusFilter, columnFilters, sortField, sortDirection, emailColumn, fields, currentRow]);

  const filteredRows = filteredAndSortedRows.map(item => item.row);

  const startEnrichment = useCallback(async () => {
    setStatus('processing');
    setAgentMessages([]); // Clear previous messages
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(useAgents && { 'x-use-agents': 'true' }),
      };
      
      const response = await fetch('/api/enrich', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          rows,
          fields,
          emailColumn,
          useAgents,
          useV2Architecture: true, // Use new agent architecture when agents are enabled
        }),
      });

      if (!response.ok) {
        if (response.status === 500) {
          const errorData = await response.json().catch(() => ({}));
          if (errorData.code === 'MISSING_API_KEYS') {
            toast.error('Service temporarily unavailable. Please try again later.');
            setStatus('completed');
            return;
          }
        }
        throw new Error('Failed to start enrichment');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));

              switch (data.type) {
                case 'session':
                  setSessionId(data.sessionId);
                  break;
                
                case 'processing':
                  setCurrentRow(data.rowIndex);
                  break;
                
                case 'result':
                  setResults(prev => {
                    const newMap = new Map(prev);
                    newMap.set(data.result.rowIndex, data.result);
                    return newMap;
                  });
                  // Track when this row's data arrived
                  setRowDataArrivalTime(prevTime => {
                    const newMap = new Map(prevTime);
                    newMap.set(data.result.rowIndex, Date.now());
                    return newMap;
                  });
                  
                  // Mark all cells as shown after animation completes
                  setTimeout(() => {
                    const rowCells = fields.map(f => `${data.result.rowIndex}-${f.name}`);
                    setCellsShown(prev => {
                      const newSet = new Set(prev);
                      rowCells.forEach(cell => newSet.add(cell));
                      return newSet;
                    });
                  }, 2500); // Slightly after all animations complete
                  break;
                
                case 'complete':
                  setStatus('completed');
                  // Add a final success message
                  setAgentMessages(prev => [...prev, {
                    message: 'All enrichment tasks completed successfully',
                    type: 'success',
                    timestamp: Date.now()
                  }]);
                  break;
                
                case 'cancelled':
                  setStatus('cancelled');
                  break;
                
                case 'error':
                  console.error('Enrichment error:', data.error);
                  setStatus('completed');
                  break;
                
                case 'agent_progress':
                  setAgentMessages(prev => [...prev, {
                    message: data.message,
                    type: data.messageType,
                    timestamp: Date.now(),
                    rowIndex: data.rowIndex
                  }]);
                  // Keep only last 50 messages
                  setAgentMessages(prev => prev.slice(-50));
                  break;
              }
            } catch {
              // Ignore parsing errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to start enrichment:', error);
      toast.error('Service temporarily unavailable. Please try again later.');
      setStatus('completed');
    }
  }, [fields, rows, emailColumn, useAgents]);

  useEffect(() => {
    if (status === 'idle') {
      startEnrichment();
    }
  }, [startEnrichment, status]); // Add proper dependencies

  const cancelEnrichment = async () => {
    if (sessionId) {
      try {
        await fetch(`/api/enrich?sessionId=${sessionId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Failed to cancel enrichment:', error);
      }
      setStatus('cancelled');
      setCurrentRow(-1);
    }
  };

  const downloadCSV = () => {
    // Build headers
    const headers = [
      emailColumn || 'email',
      ...fields.map(f => f.displayName),
      ...fields.map(f => `${f.displayName}_confidence`),
      ...fields.map(f => `${f.displayName}_source`)
    ];
    
    const csvRows = [headers.map(h => `"${h}"`).join(',')];

    rows.forEach((row, index) => {
      const result = results.get(index);
      const values: string[] = [];
      
      // Add email
      const email = emailColumn ? row[emailColumn] : Object.values(row)[0];
      values.push(`"${email || ''}"`);
      
      // Add field values
      fields.forEach(field => {
        const enrichment = result?.enrichments[field.name];
        const value = enrichment?.value;
        if (value === undefined || value === null) {
          values.push('');
        } else if (Array.isArray(value)) {
          values.push(`"${value.join('; ')}"`);
        } else if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          values.push(`"${value.replace(/"/g, '""')}"`);
        } else {
          values.push(String(value));
        }
      });
      
      // Add confidence scores
      fields.forEach(field => {
        const enrichment = result?.enrichments[field.name];
        values.push(enrichment?.confidence ? enrichment.confidence.toFixed(2) : '');
      });
      
      // Add sources
      fields.forEach(field => {
        const enrichment = result?.enrichments[field.name];
        if (enrichment?.sourceContext && enrichment.sourceContext.length > 0) {
          const urls = enrichment.sourceContext.map(s => s.url).join('; ');
          values.push(`"${urls}"`);
        } else if (enrichment?.source) {
          values.push(`"${enrichment.source}"`);
        } else {
          values.push('');
        }
      });

      csvRows.push(values.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enriched_data_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyRowData = (rowIndex: number) => {
    const result = results.get(rowIndex);
    const row = rows[rowIndex];
    if (!result || !row) return;
    
    // Format data nicely for Google Docs
    const emailValue = emailColumn ? row[emailColumn] : '';
    let formattedData = `Email: ${emailValue}\n\n`;
    
    fields.forEach(field => {
      const enrichment = result.enrichments[field.name];
      const value = enrichment?.value;
      
      // Format the field name and value
      formattedData += `${field.displayName}: `;
      
      if (value === undefined || value === null || value === '') {
        formattedData += 'Not found';
      } else if (Array.isArray(value)) {
        formattedData += value.join(', ');
      } else if (typeof value === 'boolean') {
        formattedData += value ? 'Yes' : 'No';
      } else {
        formattedData += String(value);
      }
      
      formattedData += '\n\n';
    });
    
    navigator.clipboard.writeText(formattedData.trim());
    
    // Show copied feedback
    setCopiedRow(rowIndex);
    toast.success('Row data copied to clipboard!');
    setTimeout(() => setCopiedRow(null), 2000);
  };

  const openDetailSidebar = (rowIndex: number) => {
    const row = rows[rowIndex];
    const result = results.get(rowIndex);
    setSelectedRow({ isOpen: true, row, result, index: rowIndex });
  };

  const openSourceModal = (url: string, domain: string, snippet?: string) => {
    setSourceModal({ isOpen: true, url, domain, snippet });
  };

  // Sorting and filtering helper functions
  const handleSort = (fieldName: string) => {
    if (sortField === fieldName) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(fieldName);
      setSortDirection('asc');
    }
  };

  const handleColumnFilter = (fieldName: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const toggleRowSelection = (index: number) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const selectAllRows = () => {
    if (selectedRows.size === filteredAndSortedRows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredAndSortedRows.map(item => item.originalIndex)));
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* App Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Fire Enrich
          </div>
          <div className="text-sm text-gray-400">
            Enrichment Results
          </div>
        </div>
        <div className="flex items-center gap-3">
          {onReset && (
            <Button
              onClick={onReset}
              variant="outline"
              size="sm"
              className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
            >
              Start New Enrichment
            </Button>
          )}
        </div>
      </div>

      {/* Main App Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar - Agent Activity */}
      <div className={`${sidebarCollapsed ? 'w-12' : 'w-80'} bg-gray-900 border-r border-gray-800 transition-all duration-300 flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-white">Agent Activity</h3>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-gray-400 hover:text-white hover:bg-gray-800"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        {/* Progress Status */}
        {!sidebarCollapsed && (
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-3 h-3 rounded-full ${
                status === 'processing' ? 'bg-blue-500 animate-pulse' : 
                status === 'completed' ? 'bg-green-500' : 
                'bg-red-500'
              }`} />
              <div>
                <div className="text-sm font-medium text-white">
                  {status === 'processing' ? 'Processing' : 
                   status === 'completed' ? 'Complete' : 
                   'Cancelled'}
                </div>
                <div className="text-xs text-gray-400">
                  {results.size} of {rows.length} processed
                </div>
              </div>
            </div>
            
            {status === 'processing' && (
              <Button
                onClick={cancelEnrichment}
                variant="outline"
                size="sm"
                className="w-full text-red-400 border-red-800 hover:bg-red-900/20"
              >
                Cancel Processing
              </Button>
            )}
          </div>
        )}

        {/* Agent Messages */}
        {!sidebarCollapsed && (
          <div className="flex-1 overflow-hidden">
            <div ref={activityScrollRef} className="h-full overflow-y-auto p-3 space-y-1 bg-black/20 font-mono">
              {agentMessages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-xs font-mono">~ waiting for agent activity ~</div>
                </div>
              ) : (
                agentMessages.slice().reverse().map((msg, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs leading-tight">
                    <div className={`w-1 h-1 rounded-full flex-shrink-0 ${
                      msg.type === 'agent' ? 'bg-blue-400 animate-pulse' :
                      msg.type === 'success' ? 'bg-green-400' :
                      msg.type === 'warning' ? 'bg-amber-400' :
                      'bg-gray-400'
                    }`} />
                    <span className="text-gray-500 flex-shrink-0">
                      {new Date(msg.timestamp).toLocaleTimeString('en-US', { 
                        hour12: false, 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        second: '2-digit' 
                      })}
                    </span>
                    {msg.rowIndex !== undefined && (
                      <span className="text-gray-400 flex-shrink-0">
                        [row:{msg.rowIndex + 1}]
                      </span>
                    )}
                    <span className="text-gray-300 truncate">
                      {msg.message}
                    </span>
                  </div>
                ))
              )}
              <div ref={agentMessagesEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Bulk Actions Toolbar */}
        {selectedRows.size > 0 && (
          <div className="bg-blue-900/20 border-b border-blue-700/50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm font-medium text-blue-300">
                  {selectedRows.size} row{selectedRows.size !== 1 ? 's' : ''} selected
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Copy all selected rows
                      const selectedData = Array.from(selectedRows).map(index => {
                        const row = rows[index];
                        const result = results.get(index);
                        const email = emailColumn ? row[emailColumn] : Object.values(row)[0];
                        
                        let formattedData = `Email: ${email}\n`;
                        fields.forEach(field => {
                          const enrichment = result?.enrichments[field.name];
                          const value = enrichment?.value;
                          formattedData += `${field.displayName}: ${value || 'Not found'}\n`;
                        });
                        return formattedData;
                      }).join('\n---\n');
                      
                      navigator.clipboard.writeText(selectedData);
                      toast.success(`Copied ${selectedRows.size} rows to clipboard!`);
                    }}
                    className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Selected
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedRows(new Set())}
                    className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Toolbar */}
        <div className="bg-gray-900 border-b border-gray-800 p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-1">
              <div className="flex items-center gap-3">
                <button
                  onClick={selectAllRows}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    selectedRows.size === filteredAndSortedRows.length && filteredAndSortedRows.length > 0
                      ? 'bg-blue-500 border-blue-500' 
                      : selectedRows.size > 0
                      ? 'bg-blue-500/50 border-blue-500'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                  title={selectedRows.size === filteredAndSortedRows.length ? "Deselect all" : "Select all"}
                >
                  {selectedRows.size === filteredAndSortedRows.length && filteredAndSortedRows.length > 0 ? (
                    <Check className="w-3 h-3 text-white" />
                  ) : selectedRows.size > 0 ? (
                    <div className="w-2 h-2 bg-white rounded-sm" />
                  ) : null}
                </button>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                  />
                </div>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
                <option value="skipped">Skipped</option>
              </select>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={downloadCSV} className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Dark Table */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto pr-6">
            <table className="w-full">
              {/* Header */}
              <thead className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
                <tr>
                  {/* Contact Column Header */}
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wide sticky left-0 bg-gray-800 z-20 min-w-[180px] max-w-[200px] border-r border-gray-700/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-blue-400" />
                        <span className="text-gray-200 text-xs">Contact</span>
                      </div>
                      <button
                        onClick={() => handleSort('email')}
                        className="p-0.5 hover:bg-gray-700 rounded transition-colors"
                      >
                        {sortField === 'email' ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3 h-3 text-blue-400" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-blue-400" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-gray-500 hover:text-gray-300" />
                        )}
                      </button>
                    </div>
                  </th>
                  
                  {/* Field Column Headers */}
                  {fields.map((field) => (
                    <th key={field.name} className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wide min-w-[120px] border-r border-gray-700/30">
                      <div className="flex items-center justify-between">
                        <span className="break-words text-xs leading-tight text-gray-200 truncate">{field.displayName}</span>
                        <button
                          onClick={() => handleSort(field.name)}
                          className="p-0.5 hover:bg-gray-700 rounded transition-colors ml-1 flex-shrink-0"
                        >
                          {sortField === field.name ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3 h-3 text-blue-400" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-blue-400" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-gray-500 hover:text-gray-300" />
                          )}
                        </button>
                      </div>
                    </th>
                  ))}
                  
                  {/* Actions Column Header */}
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wide w-16">
                    <span className="text-gray-200 text-xs">Actions</span>
                  </th>
                </tr>
              </thead>

              {/* Body */}
              <tbody className="bg-gray-950 divide-y divide-gray-800/30">
                {filteredRows.map((row, filteredIndex) => {
                  const originalIndex = rows.indexOf(row);
                  const result = results.get(originalIndex);
                  const isProcessing = currentRow === originalIndex && status === 'processing';
                  const email = emailColumn ? row[emailColumn] : Object.values(row)[0];
                  const isSelected = selectedRows.has(originalIndex);
                  
                  return (
                    <tr 
                      key={originalIndex} 
                      className={`group transition-all duration-150 hover:bg-gray-800/30 border-l ${
                        isSelected ? 'border-l-blue-500 bg-blue-950/10' :
                        isProcessing ? 'border-l-orange-500 bg-blue-900/10' : 
                        result?.status === 'completed' ? 'border-l-green-500/50' :
                        result?.status === 'error' ? 'border-l-red-500/50' :
                        'border-l-transparent hover:border-l-gray-600'
                      } ${
                        isProcessing ? 'bg-blue-900/10' : 
                        isSelected ? 'bg-blue-950/10' :
                        filteredIndex % 2 === 0 ? 'bg-gray-950' : 'bg-gray-900/50'
                      }`}
                      onClick={() => toggleRowSelection(originalIndex)}
                    >
                      {/* Contact Column - Sticky */}
                      <td className={`px-3 py-2 sticky left-0 z-10 border-r border-gray-700/30 transition-colors ${
                        isProcessing ? 'bg-blue-900/10' : 
                        isSelected ? 'bg-blue-950/10' :
                        filteredIndex % 2 === 0 ? 'bg-gray-950' : 'bg-gray-900/50'
                      }`}>
                        <div className="flex items-center gap-2">
                          {/* Row Selection Checkbox */}
                          <div className="flex-shrink-0">
                            <div className={`w-3 h-3 rounded border flex items-center justify-center transition-all ${
                              isSelected 
                                ? 'bg-blue-500 border-blue-500' 
                                : 'border-gray-600 group-hover:border-gray-500'
                            }`}>
                              {isSelected && <Check className="w-2 h-2 text-white" />}
                            </div>
                          </div>
                          
                          {/* Status Icon */}
                          <div className="flex-shrink-0">
                            {isProcessing ? (
                              <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                            ) : result?.status === 'completed' ? (
                              <CheckCircle className="w-3 h-3 text-green-400" />
                            ) : result?.status === 'error' ? (
                              <AlertCircle className="w-3 h-3 text-red-400" />
                            ) : result?.status === 'skipped' ? (
                              <Info className="w-3 h-3 text-amber-400" />
                            ) : (
                              <div className="w-3 h-3 border border-gray-600 rounded-full" />
                            )}
                          </div>
                          
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                            {email?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-white break-words leading-tight">
                              {email}
                            </div>
                            <div className="text-xs text-gray-500 leading-tight">
                              #{originalIndex + 1}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Field Columns */}
                      {result?.status === 'skipped' ? (
                        <td colSpan={fields.length} className="px-3 py-2 text-xs text-amber-400 italic border-r border-gray-700/30 bg-amber-900/5">
                          <div className="flex items-center gap-1.5">
                            <Info className="w-3 h-3" />
                            <span>{result.error || 'Personal email provider'}</span>
                          </div>
                        </td>
                      ) : (
                        fields.map((field, fieldIndex) => {
                          const enrichment = result?.enrichments[field.name];
                          const hasValue = enrichment && enrichment.value !== null && enrichment.value !== undefined && enrichment.value !== '';
                          
                          return (
                            <td key={field.name} className="px-3 py-2 border-r border-gray-700/20 transition-colors">
                              <div className="space-y-1">
                                {!result ? (
                                  <div className="space-y-1">
                                    <div className="h-3 bg-gray-800 rounded animate-pulse" />
                                    <div className="h-2 bg-gray-800/70 rounded animate-pulse w-2/3" />
                                  </div>
                                ) : hasValue ? (
                                  <>
                                    <div className="text-xs text-white break-words leading-tight">
                                      {field.type === 'boolean' ? (
                                        <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-xs font-medium ${
                                          enrichment.value 
                                            ? 'bg-green-500 text-white' 
                                            : 'bg-red-500 text-white'
                                        }`}>
                                          {enrichment.value ? '✓' : '✗'}
                                        </span>
                                      ) : field.type === 'array' && Array.isArray(enrichment.value) ? (
                                        <div className="flex flex-wrap gap-1">
                                          {enrichment.value.slice(0, 2).map((item, i) => (
                                            <span key={i} className="inline-block px-1.5 py-0.5 bg-blue-600 text-white rounded text-xs font-medium">
                                              {item}
                                            </span>
                                          ))}
                                          {enrichment.value.length > 2 && (
                                            <span className="inline-block px-1.5 py-0.5 bg-gray-600 text-gray-300 rounded text-xs font-medium">
                                              +{enrichment.value.length - 2}
                                            </span>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="break-words">{String(enrichment.value)}</div>
                                      )}
                                    </div>
                                    {/* Minimal Source Citation */}
                                    {(enrichment.sourceContext || enrichment.source) && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const sources = enrichment.sourceContext || [];
                                          const sourceCount = sources.length || (enrichment.source ? 1 : 0);
                                          setSourceModal({
                                            isOpen: true,
                                            url: '',
                                            domain: '',
                                            sources: sources,
                                            count: sourceCount,
                                            legacySource: enrichment.source
                                          });
                                        }}
                                        className="inline-flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity duration-200 cursor-pointer group/source"
                                        title={`View ${enrichment.sourceContext?.length || 1} source${(enrichment.sourceContext?.length || 1) > 1 ? 's' : ''}`}
                                      >
                                        <div className="w-1 h-1 bg-blue-400 rounded-full group-hover/source:bg-blue-300" />
                                        <span className="text-xs text-gray-500 group-hover/source:text-gray-400">
                                          {enrichment.sourceContext?.length || 1}
                                        </span>
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  <div className="text-xs text-gray-500 italic">
                                    <span>—</span>
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })
                      )}

                      {/* Actions */}
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <button 
                            className="w-6 h-6 p-0 text-gray-500 hover:text-white hover:bg-gray-700 rounded transition-all duration-150 flex items-center justify-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetailSidebar(originalIndex);
                            }}
                            title="View details"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          <button 
                            className="w-6 h-6 p-0 text-gray-500 hover:text-white hover:bg-gray-700 rounded transition-all duration-150 flex items-center justify-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyRowData(originalIndex);
                            }}
                            title={copiedRow === originalIndex ? "Copied!" : "Copy data"}
                          >
                            {copiedRow === originalIndex ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredRows.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
                    <Search className="w-8 h-8 text-gray-600" />
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-gray-300 mb-2">No results found</div>
                    <div className="text-sm text-gray-500">Try adjusting your search or filter criteria</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Summary */}
        <div className="bg-gray-900 border-t border-gray-800 p-4">
          <div className="flex justify-between items-center text-sm text-gray-400">
            <div>
              Showing {filteredRows.length} of {rows.length} contacts
            </div>
            <div className="flex gap-6">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                Completed: {Array.from(results.values()).filter(r => r.status === 'completed').length}
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                Processing: {status === 'processing' ? 1 : 0}
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                Failed: {Array.from(results.values()).filter(r => r.status === 'error').length}
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                Skipped: {Array.from(results.values()).filter(r => r.status === 'skipped').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Sidebar */}
      <Sheet 
        open={selectedRow.isOpen} 
        onOpenChange={(open) => setSelectedRow({ ...selectedRow, isOpen: open })}
      >
        <SheetContent className="w-[550px] sm:max-w-[550px] overflow-y-auto bg-gray-950 border-l border-gray-800">
          {selectedRow.row && (
            <>
              <SheetHeader className="pb-4 border-b border-gray-800">
                <SheetTitle className="text-xl font-bold text-white">
                  {emailColumn ? selectedRow.row[emailColumn] : Object.values(selectedRow.row)[0]}
                </SheetTitle>
              </SheetHeader>
              
              <div className="mt-6 space-y-6">
                {/* Enriched Fields */}
                {selectedRow.result && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                      Enriched Data
                    </h3>
                    
                    <div className="space-y-3">
                      {fields.map((field) => {
                        const enrichment = selectedRow.result?.enrichments[field.name];
                        
                        return (
                          <Card key={field.name} className="p-4 bg-gray-900 border-gray-800">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <Label className="text-sm font-semibold text-white">
                                {field.displayName}
                              </Label>
                            </div>
                            
                            <div>
                              {!enrichment || enrichment.value === null || enrichment.value === undefined || enrichment.value === '' ? (
                                <div className="flex items-center gap-2 text-gray-500 py-2">
                                  <X size={16} />
                                  <span className="text-sm italic">No information found</span>
                                </div>
                              ) : field.type === 'array' && Array.isArray(enrichment.value) ? (
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  {enrichment.value.map((item, i) => (
                                    <Badge key={i} variant="secondary" className="bg-gray-800 text-gray-300">
                                      {item}
                                    </Badge>
                                  ))}
                                </div>
                              ) : field.type === 'boolean' ? (
                                <Badge 
                                  variant={enrichment.value === true || enrichment.value === 'true' || enrichment.value === 'Yes' ? "default" : "secondary"}
                                  className={enrichment.value === true || enrichment.value === 'true' || enrichment.value === 'Yes' 
                                    ? "bg-green-900/30 text-green-400" 
                                    : "bg-red-900/30 text-red-400"
                                  }
                                >
                                  {enrichment.value === true || enrichment.value === 'true' || enrichment.value === 'Yes' ? 'Yes' : 'No'}
                                </Badge>
                              ) : (typeof enrichment.value === 'string' && (enrichment.value.startsWith('http://') || enrichment.value.startsWith('https://'))) ? (
                                <a 
                                  href={String(enrichment.value)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-400 hover:text-blue-300 underline break-all inline-flex items-center gap-1"
                                >
                                  {enrichment.value}
                                  <ExternalLink size={12} />
                                </a>
                              ) : (
                                <p className="text-sm leading-relaxed text-gray-300">
                                  {enrichment.value}
                                </p>
                              )}
                            </div>
                            
                            {/* Source Links */}
                            {enrichment && (enrichment.source || enrichment.sourceContext) && (
                              <div className="mt-3 pt-3 border-t border-gray-800">
                                <div className="mb-2">
                                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Sources</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {enrichment.sourceContext && enrichment.sourceContext.length > 0 ? (
                                    enrichment.sourceContext.map((source, i) => {
                                      try {
                                        const domain = new URL(source.url).hostname.replace('www.', '');
                                        return (
                                          <button
                                            key={i}
                                            onClick={() => openSourceModal(source.url, domain, source.snippet)}
                                            className="inline-flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-sm text-gray-300 hover:text-white rounded-lg border border-gray-700 hover:border-gray-600 transition-all duration-200 cursor-pointer"
                                            title={source.snippet || `Click to preview source: ${domain}`}
                                          >
                                            <Globe className="w-4 h-4" />
                                            <span>{domain}</span>
                                            <Eye className="w-3 h-3 opacity-60" />
                                          </button>
                                        );
                                      } catch {
                                        return null;
                                      }
                                    })
                                  ) : enrichment.source ? (
                                    <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-800 text-sm text-gray-300 rounded-lg border border-gray-700">
                                      <Globe className="w-4 h-4" />
                                      <span>Source Available</span>
                                    </div>
                                  ) : null}
                                </div>
                                {enrichment.confidence && (
                                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                                    <span>Confidence:</span>
                                    <span className={`font-medium ${
                                      enrichment.confidence >= 0.8 ? 'text-green-400' :
                                      enrichment.confidence >= 0.6 ? 'text-yellow-400' :
                                      'text-red-400'
                                    }`}>
                                      {Math.round(enrichment.confidence * 100)}%
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Original Data */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                    Original Data
                  </h3>
                  
                  <Card className="p-4 bg-gray-900 border-gray-800">
                    <div className="space-y-3">
                      {Object.entries(selectedRow.row).map(([key, value]) => (
                        <div key={key} className="flex items-start justify-between gap-4">
                          <Label className="text-sm font-medium text-gray-400 min-w-[120px]">
                            {key}
                          </Label>
                          <span className="text-sm text-right break-all text-gray-300">
                            {value || <span className="italic text-gray-500">Empty</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Action Buttons */}
                <div className="pt-6 pb-4 border-t border-gray-800">
                  <Button
                    variant="outline"
                    className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                    onClick={() => {
                      copyRowData(selectedRow.index);
                      toast.success('Row data copied to clipboard!');
                    }}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Row Data
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

            {/* Sources List Modal */}
      <Sheet 
        open={sourceModal.isOpen} 
        onOpenChange={(open) => setSourceModal(prev => ({ ...prev, isOpen: open }))}
      >
        <SheetContent className="w-[500px] sm:max-w-[500px] bg-gray-950 border-l border-gray-800">
          <SheetHeader className="pb-4 border-b border-gray-800">
            <SheetTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-400" />
              Sources ({sourceModal.count || 0})
            </SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-3">
            {sourceModal.sources && sourceModal.sources.length > 0 ? (
              sourceModal.sources.map((source, i) => {
                try {
                  const domain = new URL(source.url).hostname.replace('www.', '');
                  return (
                    <div key={i} className="p-4 bg-gray-900 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white mb-1">{domain}</div>
                          <div className="text-xs text-gray-400 font-mono break-all">{source.url}</div>
                        </div>
                        <Button
                          onClick={() => window.open(source.url, '_blank')}
                          variant="outline"
                          size="sm"
                          className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 flex-shrink-0"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                      {source.snippet && (
                        <div className="text-xs text-gray-300 leading-relaxed mt-2 p-2 bg-gray-800/50 rounded border-l-2 border-blue-500/30">
                          &ldquo;{source.snippet}&rdquo;
                        </div>
                      )}
                    </div>
                  );
                } catch {
                  return null;
                }
              })
            ) : sourceModal.legacySource ? (
              <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">Source Available</span>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-1">{sourceModal.legacySource}</div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No sources available</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
      </div>
    </div>
  );
}