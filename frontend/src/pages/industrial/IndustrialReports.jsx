import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { useToast } from '../../contexts/ToastContext';
import { industrialService } from '../../services/industrialService';
import { FileText, Download, CheckCircle2, ShieldCheck, Printer } from 'lucide-react';

export const IndustrialReports = () => {
  const [reportType, setReportType] = useState('Monthly Energy Audit');
  const [period, setPeriod] = useState('October 2026');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(null);

  const toast = useToast();

  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await industrialService.generateReport({ reportType, period });
      setGeneratedReport(res);
      toast.success('Report successfully compiled and ready for download.');
    } catch (err) {
      toast.error('Failed to compile report');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-black text-midnight-900 tracking-tight">Industrial Intelligence Reports</h2>
        <p className="text-xs text-midnight-600 mt-0.5">
          Generate audit-ready ISO 50001 energy reports, plant compliance filings, and executive financial summaries.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-6">
          <Card title="Compile Executive Energy Report" subtitle="Configure reporting criteria">
            <form onSubmit={handleGenerate} className="space-y-4">
              <Select
                label="Report Type"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                options={[
                  'Monthly Energy Audit',
                  'ISO 50001 Energy Management Verification',
                  'Peak Shaving & Tariff Variance Report',
                  'Carbon Footprint & Scope 2 Emissions Statement'
                ]}
              />

              <Select
                label="Reporting Period"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                options={['October 2026', 'Q3 2026 Consolidated', 'Year-to-Date 2026']}
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                isLoading={isGenerating}
                leftIcon={FileText}
              >
                Compile Report
              </Button>
            </form>
          </Card>
        </div>

        <div className="md:col-span-6">
          {generatedReport ? (
            <Card title="Ready for Export" subtitle={generatedReport.fileName}>
              <div className="p-6 bg-ivory-100 rounded-2xl border border-ivory-200 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-midnight-900">{generatedReport.fileName}</h4>
                  <p className="text-[11px] font-mono text-midnight-500 mt-1">
                    Document ID: {generatedReport.reportId} • PDF Document
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  leftIcon={Download}
                  onClick={() => toast.info('Demo export generated. File download simulated.')}
                >
                  Download PDF Report
                </Button>
              </div>
            </Card>
          ) : (
            <div className="h-full border border-dashed border-ivory-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center text-midnight-500">
              <FileText className="w-10 h-10 text-midnight-400 mb-2" />
              <p className="text-xs font-semibold text-midnight-800">No active compiled report</p>
              <p className="text-[11px] text-midnight-500 max-w-xs mt-1">
                Select your parameters on the left and click "Compile Report" to generate an audit-ready artifact.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IndustrialReports;

