"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CSVUploader } from "./csv-uploader";
import { UnifiedEnrichmentView } from "./unified-enrichment-view";
import { EnrichmentTable } from "./enrichment-table";
import { CSVRow, EnrichmentField } from "@/lib/types";

export default function CSVEnrichmentPage() {
  const [step, setStep] = useState<'upload' | 'setup' | 'enrichment'>('upload');
  const [csvData, setCsvData] = useState<{
    rows: CSVRow[];
    columns: string[];
  } | null>(null);
  const [emailColumn, setEmailColumn] = useState<string>('');
  const [selectedFields, setSelectedFields] = useState<EnrichmentField[]>([]);

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

  // Full-screen enrichment view
  if (step === 'enrichment' && csvData) {
    return (
      <div className="fixed inset-0 bg-gray-950">
        <EnrichmentTable
          rows={csvData.rows}
          fields={selectedFields}
          emailColumn={emailColumn}
          onReset={resetProcess}
        />
      </div>
    );
  }

  // Regular page layout for upload and setup
  return (
    <div className="w-full px-0 py-4 font-inter">
      <div className="flex justify-between items-center">
        <div className="text-xl font-bold text-white">
          MakerThrive
        </div>
      </div>

      <div className="text-center pt-8 pb-6">
        <h1 className="text-[2.5rem] lg:text-[3.8rem] text-white font-semibold tracking-tight leading-[0.9] opacity-0 animate-fade-up [animation-duration:500ms] [animation-delay:200ms] [animation-fill-mode:forwards]">
          <span className="relative px-1 text-transparent bg-clip-text bg-gradient-to-tr from-purple-400 to-pink-400 inline-flex justify-center items-center">
            Fire Enrich
          </span>
          <span className="block leading-[1.1] opacity-0 animate-fade-up [animation-duration:500ms] [animation-delay:400ms] [animation-fill-mode:forwards]">
            Enrich your contacts.
          </span>
        </h1>
      </div>

      {/* Main Content */}
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
      </div>
    </div>
  );
}