import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { useToast } from '../../contexts/ToastContext';
import { industrialService } from '../../services/industrialService';
import { FileText, Download, CheckCircle2 } from 'lucide-react';

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
      setGeneratedReport(res.data);
      toast.success('CSV report compiled from the current dataset.');
    } catch (err) {
      setGeneratedReport(null);
      toast.error(err.message || 'Failed to compile report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedReport?.csvContent) return;

    const blob = new Blob(['\uFEFF', generatedReport.csvContent], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = generatedReport.fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success('CSV report downloaded.');
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-midnight-900">Industrial Intelligence Reports</h2>
        <p className="mt-0.5 text-xs text-midnight-600">
          Compile audit-ready CSV extracts from the current facility dataset. No simulated files are generated.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
        <div className="md:col-span-6">
          <Card title="Compile Energy Data Export" subtitle="Configure reporting criteria">
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
                Compile CSV Export
              </Button>
            </form>
          </Card>
        </div>

        <div className="md:col-span-6">
          {generatedReport ? (
            <Card title="CSV Export Ready" subtitle={generatedReport.fileName}>
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-midnight-900">{generatedReport.fileName}</h4>
                  <p className="mt-1 font-mono text-[11px] text-midnight-500">
                    ID: {generatedReport.reportId} • {generatedReport.rowCount ?? 0} rows • CSV
                  </p>
                </div>

                <div className="border border-slate-200 bg-slate-50 p-3 text-left">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Data source</p>
                  <p className="mt-1 text-xs text-midnight-800">
                    {generatedReport.dataSource?.label || 'Current facility dataset'}
                  </p>
                  {generatedReport.isBenchmark && (
                    <p className="mt-2 border-l-2 border-amber-400 pl-2 text-[11px] text-amber-800">
                      Benchmark mode: this export contains Karnataka generation benchmark data, not verified facility
                      meter readings.
                    </p>
                  )}
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
              <FileText className="mb-2 h-10 w-10 text-slate-400" />
              <p className="text-xs font-semibold text-midnight-800">No compiled export</p>
              <p className="mt-1 max-w-xs text-[11px] text-midnight-500">
                Select your parameters and compile to generate a CSV from the live dataset.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IndustrialReports;

