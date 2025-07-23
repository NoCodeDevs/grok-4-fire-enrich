"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { CSVUploader } from "./fire-enrich/csv-uploader";
import { UnifiedEnrichmentView } from "./fire-enrich/unified-enrichment-view";
import { EnrichmentTable } from "./fire-enrich/enrichment-table";
import { CSVRow, EnrichmentField } from "@/lib/types";
import { FIRE_ENRICH_CONFIG } from "./fire-enrich/config";

export default function HomePage() {
  const [step, setStep] = useState<'upload' | 'setup' | 'enrichment'>('upload');
  const [csvData, setCsvData] = useState<{
    rows: CSVRow[];
    columns: string[];
  } | null>(null);
  const [emailColumn, setEmailColumn] = useState<string>('');
  const [selectedFields, setSelectedFields] = useState<EnrichmentField[]>([]);
  const [isCheckingEnv, setIsCheckingEnv] = useState(false); // Changed to false since we don't need to check env anymore

  const handleCSVUpload = async (rows: CSVRow[], columns: string[]) => {
    // Directly set CSV data and proceed to setup
    setCsvData({ rows, columns });
    setStep('setup');
  };

  const handleStartEnrichment = (email: string, fields: EnrichmentField[]) => {
    setEmailColumn(email);
    setSelectedFields(fields);
    setStep('enrichment');
  };

  const handleBack = () => {
    if (step === 'setup') {
      setStep('upload');
    } else if (step === 'enrichment') {
      setStep('setup');
    }
  };

  const resetProcess = () => {
    setStep('upload');
    setCsvData(null);
    setEmailColumn('');
    setSelectedFields([]);
  };

  // API key related functions removed

  return (
    <div className="pt-16 px-4 sm:px-6 lg:px-8 py-4 max-w-7xl mx-auto font-inter">{/* pt-16 for fixed navbar */}

      {/* Hero Section - Only show when on upload step */}
      {step === 'upload' && (
        <div className="relative text-center pt-16 pb-20 max-w-6xl mx-auto animate-fade-up">
        {/* Animated Data Enrichment Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          {/* Data rows being enriched */}
          <div className="absolute top-16 left-8 bg-gray-800/80 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50 animate-fade-in-up [animation-delay:1s]">
            <div className="text-xs text-gray-400 mb-1">Contact #1</div>
            <div className="text-sm text-white">john@company.com</div>
            <div className="text-xs text-green-400 mt-1 animate-pulse">✓ Phone: +1 (555) 123-4567</div>
          </div>
          
          <div className="absolute top-32 right-12 bg-gray-800/80 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50 animate-fade-in-up [animation-delay:2s]">
            <div className="text-xs text-gray-400 mb-1">Contact #2</div>
            <div className="text-sm text-white">sarah@startup.io</div>
            <div className="text-xs text-blue-400 mt-1 animate-pulse">✓ LinkedIn: /in/sarah-johnson</div>
          </div>
          
          <div className="absolute top-48 left-16 bg-gray-800/80 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50 animate-fade-in-up [animation-delay:3s]">
            <div className="text-xs text-gray-400 mb-1">Contact #3</div>
            <div className="text-sm text-white">mike@techcorp.com</div>
            <div className="text-xs text-purple-400 mt-1 animate-pulse">✓ Company: TechCorp Inc.</div>
          </div>
          
          <div className="absolute bottom-32 right-8 bg-gray-800/80 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50 animate-fade-in-up [animation-delay:4s]">
            <div className="text-xs text-gray-400 mb-1">Contact #4</div>
            <div className="text-sm text-white">alex@design.co</div>
            <div className="text-xs text-pink-400 mt-1 animate-pulse">✓ Twitter: @alexdesigner</div>
          </div>
          
          <div className="absolute bottom-16 left-24 bg-gray-800/80 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50 animate-fade-in-up [animation-delay:5s]">
            <div className="text-xs text-gray-400 mb-1">Contact #5</div>
            <div className="text-sm text-white">emma@marketing.com</div>
            <div className="text-xs text-cyan-400 mt-1 animate-pulse">✓ Title: Marketing Director</div>
          </div>
          
          {/* API call indicators */}
          <div className="absolute top-24 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center gap-2 bg-gray-900/90 backdrop-blur-sm rounded-full px-4 py-2 border border-purple-500/30 animate-pulse">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-ping"></div>
              <span className="text-xs text-purple-300 font-mono">API Enriching...</span>
            </div>
          </div>
          
          {/* Data flow lines */}
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="flow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="50%" stopColor="rgb(168, 85, 247)" stopOpacity="0.6" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <path
              d="M100,150 Q300,100 500,200 T900,150"
              stroke="url(#flow-gradient)"
              strokeWidth="2"
              fill="none"
              className="animate-draw-line"
            />
            <path
              d="M150,300 Q400,250 650,350 T950,300"
              stroke="url(#flow-gradient)"
              strokeWidth="2"
              fill="none"
              className="animate-draw-line [animation-delay:2s]"
            />
          </svg>
          
          {/* Floating data particles */}
          <div className="absolute top-20 left-1/4 w-32 h-32 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute top-40 right-1/4 w-24 h-24 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-2xl animate-float [animation-delay:1s]"></div>
          <div className="absolute bottom-20 left-1/3 w-28 h-28 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-full blur-3xl animate-float [animation-delay:2s]"></div>
        </div>

        {/* Main Headline */}
        <h1 className="relative text-[3.5rem] lg:text-[5rem] xl:text-[6rem] text-white font-bold tracking-tight leading-[0.85] mb-8 opacity-0 animate-fade-up [animation-duration:700ms] [animation-delay:200ms] [animation-fill-mode:forwards]">
          <span className="block">Transform</span>
          <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-[length:200%_100%] animate-gradient-x">
            Contact Data
          </span>
          <span className="block">Into Intelligence</span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl lg:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed opacity-0 animate-fade-up [animation-duration:700ms] [animation-delay:400ms] [animation-fill-mode:forwards]">
          Upload your CSV and watch as AI enriches every contact with <span className="text-white font-semibold">phone numbers</span>, <span className="text-white font-semibold">social profiles</span>, and <span className="text-white font-semibold">company intelligence</span> in seconds.
        </p>

        {/* Beautiful feature cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16 max-w-4xl mx-auto opacity-0 animate-fade-up [animation-duration:700ms] [animation-delay:600ms] [animation-fill-mode:forwards]">
          <div className="group relative p-6 rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-700/50 backdrop-blur-sm hover:border-purple-500/30 transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">High Accuracy</h3>
              <p className="text-gray-400 text-sm">Advanced AI algorithms ensure precise contact enrichment with reliable data sources.</p>
            </div>
          </div>

          <div className="group relative p-6 rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-700/50 backdrop-blur-sm hover:border-blue-500/30 transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Lightning Speed</h3>
              <p className="text-gray-400 text-sm">Process thousands of contacts in seconds with our optimized enrichment pipeline.</p>
            </div>
          </div>

          <div className="group relative p-6 rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-700/50 backdrop-blur-sm hover:border-purple-500/30 transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Privacy First</h3>
              <p className="text-gray-400 text-sm">Your data stays secure with enterprise-grade encryption and privacy protection.</p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="opacity-0 animate-fade-up [animation-duration:700ms] [animation-delay:800ms] [animation-fill-mode:forwards]">
          <Button 
            size="lg" 
            className="text-xl px-12 py-6 h-auto bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 text-white border-0 shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-500 hover:scale-110 rounded-2xl font-semibold relative overflow-hidden group"
            onClick={() => {
              const uploadSection = document.querySelector('.bg-card');
              uploadSection?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative flex items-center gap-3">
              Start Enriching
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </Button>
          <p className="text-base text-gray-300 mt-6 font-medium">
            {FIRE_ENRICH_CONFIG.FEATURES.IS_UNLIMITED ? 
              '✨ No limits • No signup required' : 
              `✨ Up to ${FIRE_ENRICH_CONFIG.CSV_LIMITS.MAX_ROWS} contacts free • No signup required`
            }
          </p>
        </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`transition-all duration-500 ${step !== 'upload' ? 'animate-fade-up' : ''}`}>
        {step !== 'upload' && (
          <div className="text-center mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              {step === 'setup' ? 'Configure Your Enrichment' : 'Enrichment Results'}
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              {step === 'setup' 
                ? 'Select your email column and choose the data fields you want to enrich.'
                : 'Your contacts have been successfully enriched with AI-powered data.'
              }
            </p>
          </div>
        )}
        
        {isCheckingEnv ? (
          <div className="text-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Initializing...</p>
          </div>
        ) : (
          <div className="bg-card p-4 sm:p-6 rounded-lg shadow-lg border border-border">
        {step === 'setup' && (
          <Button
            variant="code"
            size="sm"
            onClick={handleBack}
            className="mb-4 flex items-center gap-1.5"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
        )}

        {step === 'upload' && (
          <CSVUploader onUpload={handleCSVUpload} />
        )}

        {step === 'setup' && csvData && (
          <UnifiedEnrichmentView
            rows={csvData.rows}
            columns={csvData.columns}
            onStartEnrichment={handleStartEnrichment}
          />
        )}

        {step === 'enrichment' && csvData && (
          <>
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-1">Enrichment Results</h2>
              <p className="text-sm text-muted-foreground">
                Click on any row to view detailed information
              </p>
            </div>
            <EnrichmentTable
              rows={csvData.rows}
              fields={selectedFields}
              emailColumn={emailColumn}
            />
            <div className="mt-6 text-center">
              <Button
                variant="orange"
                onClick={resetProcess}
              >
                Start New Enrichment
              </Button>
            </div>
          </>
        )}
        </div>
      )}
      </div>

      {/* API Key Modal removed */}
    </div>
  );
}