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
      setReportResult(res.data);
      toast.success('CSV policy export compiled from the current dataset.');
    } catch (err) {
      setReportResult(null);
      toast.error(err.message || 'Failed to compile policy report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!reportResult?.csvContent) return;

    const blob = new Blob(['\uFEFF', reportResult.csvContent], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = reportResult.fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success('CSV policy export downloaded.');
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-midnight-900">Public Policy Energy Reports</h2>
        <p className="mt-0.5 text-xs text-midnight-600">
          Compile CSV extracts of regional, sectoral, and tariff datasets. No simulated documents are generated.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
        <div className="md:col-span-6">
          <Card title="Compile Policy Data Export" subtitle="Select parameters">
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
                Compile CSV Export
              </Button>
            </form>
          </Card>
        </div>

        <div className="md:col-span-6">
          {reportResult ? (
            <Card title="CSV Export Ready" subtitle={reportResult.fileName}>
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-midnight-900">{reportResult.fileName}</h4>
                  <p className="mt-1 font-mono text-[11px] text-midnight-500">
                    Filing Ref: {reportResult.reportId} • {reportResult.rowCount ?? 0} rows • CSV
                  </p>
                </div>
                <div className="border border-slate-200 bg-slate-50 p-3 text-left">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Dataset scope</p>
                  <p className="mt-1 text-xs text-midnight-800">
                    Regional grid, sector consumption, and active tariff policy records for {year}.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  leftIcon={Download}
                  onClick={handleDownload}
                >
                  Download CSV
                </Button>
              </div>
            </Card>
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-md border border-dashed border-slate-300 p-8 text-center text-midnight-500">
              <FileSpreadsheet className="mb-2 h-10 w-10 text-slate-400" />
              <p className="text-xs font-semibold text-midnight-800">No compiled export</p>
              <p className="mt-1 max-w-xs text-[11px] text-midnight-500">
                Configure filing options to compile a CSV of the current policy dataset.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GovernmentReports;

