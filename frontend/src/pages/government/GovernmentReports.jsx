import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { useToast } from '../../contexts/ToastContext';
import { governmentService } from '../../services/governmentService';
import { FileSpreadsheet, Download, CheckCircle2 } from 'lucide-react';

export const GovernmentReports = () => {
  const [reportCategory, setReportCategory] = useState('National Grid Energy Census');
  const [year, setYear] = useState('2026');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportResult, setReportResult] = useState(null);

  const toast = useToast();

  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await governmentService.generateGovernmentReport({ reportCategory, year });
      setReportResult(res);
      toast.success('Official synthesis document generated.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-black text-midnight-900 tracking-tight">Public Policy Energy Reports</h2>
        <p className="text-xs text-midnight-600 mt-0.5">
          Generate statutory regulatory filings, national transmission evaluations, and greenhouse gas inventories.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-6">
          <Card title="Generate Official Report" subtitle="Select parameters">
            <form onSubmit={handleGenerate} className="space-y-4">
              <Select
                label="Report Publication"
                value={reportCategory}
                onChange={(e) => setReportCategory(e.target.value)}
                options={[
                  'National Grid Energy Census',
                  'Quarterly Tariff Revenue & Cross-Subsidization Audit',
                  'State & Regional Grid Compliance Ranking',
                  'UNFCCC Paris Agreement Sector Emissions Filing'
                ]}
              />

              <Select
                label="Reporting Year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                options={['2026', '2025', '2024']}
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                isLoading={isGenerating}
                leftIcon={FileSpreadsheet}
              >
                Compile Policy Report
              </Button>
            </form>
          </Card>
        </div>

        <div className="md:col-span-6">
          {reportResult ? (
            <Card title="Document Compiled" subtitle={reportResult.fileName}>
              <div className="p-6 bg-ivory-100 rounded-2xl border border-ivory-200 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-midnight-900">{reportResult.fileName}</h4>
                  <p className="text-[11px] font-mono text-midnight-500 mt-1">
                    Filing Reference: {reportResult.reportId}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  leftIcon={Download}
                  onClick={() => toast.info('Demo export generated. File download simulated.')}
                >
                  Download Formal PDF
                </Button>
              </div>
            </Card>
          ) : (
            <div className="h-full border border-dashed border-ivory-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center text-midnight-500">
              <FileSpreadsheet className="w-10 h-10 text-midnight-400 mb-2" />
              <p className="text-xs font-semibold text-midnight-800">No report ready</p>
              <p className="text-[11px] text-midnight-500 max-w-xs mt-1">
                Configure filing options to compile a downloadable regulatory brief.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GovernmentReports;

