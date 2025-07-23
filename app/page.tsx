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
    <div className="px-4 sm:px-6 lg:px-8 py-4 max-w-7xl mx-auto font-inter">
      <div className="flex justify-between items-center">
        <div className="text-xl font-bold text-white">
          MakerThrive
        </div>

      </div>

      <div className="text-center pt-12 pb-16 max-w-5xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 mb-8 opacity-0 animate-fade-up [animation-duration:500ms] [animation-delay:100ms] [animation-fill-mode:forwards]">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 animate-pulse"></div>
          <span className="text-sm font-medium text-purple-300">Powered by AI • Trusted by 10,000+ users</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-[3rem] lg:text-[4.5rem] xl:text-[5rem] text-white font-bold tracking-tight leading-[0.9] mb-6 opacity-0 animate-fade-up [animation-duration:600ms] [animation-delay:200ms] [animation-fill-mode:forwards]">
          <span className="block">Turn</span>
          <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-[length:200%_100%] animate-gradient-x">
            Email Lists
          </span>
          <span className="block">Into Gold Mines</span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl lg:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed opacity-0 animate-fade-up [animation-duration:600ms] [animation-delay:400ms] [animation-fill-mode:forwards]">
          Stop wasting time on cold outreach. <span className="text-white font-semibold">Enrich any CSV</span> with AI-powered contact intelligence in seconds. Get phone numbers, social profiles, company data, and more.
        </p>

        {/* Value Props */}
        <div className="flex flex-wrap justify-center gap-6 mb-12 opacity-0 animate-fade-up [animation-duration:600ms] [animation-delay:600ms] [animation-fill-mode:forwards]">
          <div className="flex items-center gap-2 text-gray-300">
            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-medium">90%+ Match Rate</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-medium">Lightning Fast</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <span className="font-medium">100% Secure</span>
          </div>
        </div>

        {/* CTA Button */}
        <div className="opacity-0 animate-fade-up [animation-duration:600ms] [animation-delay:800ms] [animation-fill-mode:forwards]">
          <Button 
            size="lg" 
            className="text-lg px-8 py-4 h-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105"
            onClick={() => {
              const uploadSection = document.querySelector('.bg-card');
              uploadSection?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Enrich My Contacts Now
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Button>
          <p className="text-sm text-gray-400 mt-3">
            {FIRE_ENRICH_CONFIG.FEATURES.IS_UNLIMITED ? 
              '✨ Unlimited enrichment • No credit card required' : 
              `✨ ${FIRE_ENRICH_CONFIG.CSV_LIMITS.MAX_ROWS} rows free • No signup required`
            }
          </p>
        </div>

        {/* Social Proof Numbers */}
        <div className="grid grid-cols-3 gap-8 mt-16 pt-12 border-t border-gray-800 opacity-0 animate-fade-up [animation-duration:600ms] [animation-delay:1000ms] [animation-fill-mode:forwards]">
          <div className="text-center">
            <div className="text-3xl lg:text-4xl font-bold text-white mb-2">50M+</div>
            <div className="text-sm text-gray-400">Contacts Enriched</div>
          </div>
          <div className="text-center">
            <div className="text-3xl lg:text-4xl font-bold text-white mb-2">10K+</div>
            <div className="text-sm text-gray-400">Happy Users</div>
          </div>
          <div className="text-center">
            <div className="text-3xl lg:text-4xl font-bold text-white mb-2">95%</div>
            <div className="text-sm text-gray-400">Accuracy Rate</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
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



      {/* API Key Modal removed */}
    </div>
  );
}