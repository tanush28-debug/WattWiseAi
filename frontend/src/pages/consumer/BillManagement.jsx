import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  Download,
  Info
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { DataTable } from '../../components/common/DataTable';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../contexts/ToastContext';
import { billService } from '../../services/billService';
import { formatCurrency, formatKWh, formatDate, maskAccountNumber } from '../../utils/formatters';

const EMPTY_REVIEW_FORM = {
  consumerName: '',
  accountNumber: '',
  discom: '',
  billingMonth: '',
  billingPeriodStart: '',
  billingPeriodEnd: '',
  billIssueDate: '',
  dueDate: '',
  tariffCategory: 'Domestic LT-1 Standard',
  previousReading: '',
  currentReading: '',
  unitsConsumed: '',
  energyCharges: '',
  fixedCharges: '',
  taxes: '',
  otherCharges: '',
  arrears: '',
  currentDemandPayable: '',
  amount: '',
};

const buildReviewFormData = (bill = {}) => {
  const extracted = bill.extraction || {};
  const breakdown = bill.breakdown || {};
  const pick = (...values) => values.find((value) => value !== null && value !== undefined && value !== '') ?? '';
  const dateValue = (...values) => {
    const value = pick(...values);
    return typeof value === 'string' ? value.slice(0, 10) : value;
  };

  return {
    consumerName: pick(extracted.consumerName, bill.consumerName),
    accountNumber: pick(extracted.accountNumber, bill.accountNumber),
    discom: pick(extracted.discom),
    billingMonth: pick(extracted.billingMonth, bill.billingMonth),
    billingPeriodStart: dateValue(extracted.billingPeriodStart, bill.billingPeriodStart),
    billingPeriodEnd: dateValue(extracted.billingPeriodEnd, bill.billingPeriodEnd),
    billIssueDate: dateValue(extracted.billIssueDate),
    dueDate: dateValue(extracted.dueDate, bill.dueDate),
    tariffCategory: pick(extracted.tariffCategory, bill.tariffCategory, 'Domestic LT-1 Standard'),
    previousReading: pick(extracted.previousReading),
    currentReading: pick(extracted.currentReading),
    unitsConsumed: pick(extracted.unitsConsumed, bill.unitsConsumed),
    energyCharges: pick(extracted.energyCharges, breakdown.energyCharges),
    fixedCharges: pick(extracted.fixedCharges, breakdown.standingCharge),
    taxes: pick(extracted.taxes, breakdown.taxes),
    otherCharges: pick(extracted.otherCharges, breakdown.environmentalSurcharge),
    arrears: pick(extracted.arrears),
    currentDemandPayable: pick(extracted.currentDemandPayable),
    amount: pick(extracted.netPayable, bill.amount),
  };
};

const highlightFor = (bill, field) => {
  const missing = bill?.missingFields || bill?.validation?.missingFields || [];
  const uncertain = bill?.uncertainFields || bill?.validation?.uncertainFields || [];
  if (missing.includes(field)) return 'missing';
  if (uncertain.includes(field)) return 'uncertain';
  return null;
};

const fieldTone = (highlight) => {
  if (highlight === 'missing') return 'border-rose-400 bg-rose-50/70';
  if (highlight === 'uncertain') return 'border-amber-400 bg-amber-50/70';
  return 'border-ivory-300 bg-white';
};

const ReviewField = ({
  label,
  value,
  onChange,
  type = 'text',
  step,
  required = false,
  highlight = null,
  hint = null,
  placeholder = '',
}) => (
  <div>
    <label className="block text-midnight-700 font-semibold mb-1">
      {label}
      {required && <span className="text-rose-600"> *</span>}
    </label>
    <input
      type={type}
      step={step}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 border rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cobalt-500 ${fieldTone(highlight)}`}
    />
    {hint && <p className="mt-1 text-[10px] text-midnight-500 leading-snug">{hint}</p>}
  </div>
);

const toNumberOrNull = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const BillManagement = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [billToDelete, setBillToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [billToReview, setBillToReview] = useState(null);
  const [reviewFormData, setReviewFormData] = useState({ ...EMPTY_REVIEW_FORM });
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const fileInputRef = useRef(null);
  const toast = useToast();

  const fetchBills = async () => {
    try {
      const res = await billService.getBills();
      setBills(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      toast.error(err.message || 'Could not load saved bills.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handleFileUpload = async (file) => {
    if (!file) return;

    // Validate file type (supports Windows MIME quirks like image/pjpeg or empty type with extension)
    const fileName = (file.name || '').toLowerCase();
    const isExtensionValid = /\.(pdf|png|jpe?g)$/i.test(fileName);
    const validMimes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/pjpeg'];
    const isMimeValid = validMimes.includes(file.type);

    if (!isMimeValid && !isExtensionValid) {
      toast.error('Only PDF documents or image files (PNG, JPG, JPEG) are supported.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error('File size exceeds the 15 MB threshold.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    let progressTimer = null;
    try {
      progressTimer = setInterval(() => {
        setUploadProgress((prev) => (prev < 90 ? prev + 15 : prev));
      }, 150);

      const result = await billService.uploadBill(file);
      clearInterval(progressTimer);
      setUploadProgress(100);

      if (result.success) {
        const d = result.data;
        setReviewFormData(buildReviewFormData(d));
        setReviewConfirmed(false);
        setBillToReview(d);

        if (d.validation?.status === 'MANUAL_ENTRY_REQUIRED') {
          toast.warning(result.message || 'Bill saved, but automatic extraction was incomplete. Enter the missing values and confirm.');
        } else {
          toast.info(result.message || 'Bill extracted and saved as a draft. Review every field before confirming.');
        }
        await fetchBills();
      }
    } catch (err) {
      if (progressTimer) clearInterval(progressTimer);
      // Distinguish error types — do NOT show generic "unable to connect" for HTTP errors
      if (err.isTimeout) {
        toast.error('Upload timed out. Your file may be too large or the server is busy — please try again.');
      } else if (err.isNetworkError || err.status === 0) {
        toast.error('Cannot connect to WattWise backend. Make sure the server is running on port 5000.');
      } else if (err.status === 400) {
        toast.error(err.message || 'Invalid file. Please upload a valid electricity bill (PDF/PNG/JPG).');
      } else if (err.status === 401) {
        toast.error('You must be signed in to upload bills. Please log in and try again.');
      } else if (err.status === 403) {
        toast.error('Access denied. You do not have permission to upload bills.');
      } else if (err.status === 413) {
        toast.error('File is too large. Maximum allowed size is 15 MB.');
      } else if (err.status === 500) {
        toast.error(err.message || 'Backend processing failed. Please try again.');
      } else {
        toast.error(err.message || 'Bill OCR processing failed. Please try again.');
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openReviewModal = (bill) => {
    setReviewFormData(buildReviewFormData(bill));
    setReviewConfirmed(false);
    setBillToReview(bill);
    if (selectedBill) setSelectedBill(null);
  };

  const updateReviewField = (field, value) => {
    setReviewFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleConfirmBill = async (e) => {
    if (e) e.preventDefault();
    if (!billToReview) return;
    if (!reviewConfirmed) {
      toast.warning('Tick the confirmation checkbox after verifying every field.');
      return;
    }

    const units = toNumberOrNull(reviewFormData.unitsConsumed);
    const amount = toNumberOrNull(reviewFormData.amount);
    if (units === null || amount === null) {
      toast.error('Units consumed and net payable amount are required before confirming.');
      return;
    }

    setIsConfirming(true);
    try {
      const confirmPayload = {
        consumerName: reviewFormData.consumerName || null,
        accountNumber: reviewFormData.accountNumber || null,
        billingMonth: reviewFormData.billingMonth || null,
        billingPeriodStart: reviewFormData.billingPeriodStart || null,
        billingPeriodEnd: reviewFormData.billingPeriodEnd || null,
        dueDate: reviewFormData.dueDate || null,
        tariffCategory: reviewFormData.tariffCategory || null,
        previousReading: toNumberOrNull(reviewFormData.previousReading),
        currentReading: toNumberOrNull(reviewFormData.currentReading),
        unitsConsumed: units,
        currentDemandPayable: toNumberOrNull(reviewFormData.currentDemandPayable),
        arrears: toNumberOrNull(reviewFormData.arrears),
        amount,
        breakdown: {
          energyCharges: toNumberOrNull(reviewFormData.energyCharges),
          standingCharge: toNumberOrNull(reviewFormData.fixedCharges),
          environmentalSurcharge: toNumberOrNull(reviewFormData.otherCharges),
          taxes: toNumberOrNull(reviewFormData.taxes),
        },
      };

      const res = await billService.confirmBill(billToReview.id, confirmPayload);
      toast.success(res?.message || 'Bill verified and saved.');
      setBillToReview(null);
      setReviewConfirmed(false);
      await fetchBills();
    } catch (err) {
      toast.error(err.message || 'Failed to verify and save this bill.');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDeleteBill = async () => {
    if (!billToDelete) return;
    setIsDeleting(true);
    try {
      await billService.deleteBill(billToDelete.id);
      toast.success('Bill record removed');
      setBills((prev) => prev.filter((b) => b.id !== billToDelete.id));
      setBillToDelete(null);
    } catch (err) {
      toast.error(err.message || 'Failed to remove bill record.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      header: 'File Name',
      key: 'fileName',
      render: (val, row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-ivory-100 border border-ivory-200 flex items-center justify-center text-midnight-800 shrink-0">
            <FileText className="w-4 h-4 text-cobalt-600" />
          </div>
          <div>
            <p className="font-bold text-midnight-900 truncate max-w-[180px]">{val}</p>
            <p className="text-[10px] text-midnight-500 font-mono">{row.fileSize || '380 KB'}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Account #',
      key: 'accountNumber',
      render: (val) => <span className="font-mono text-midnight-700">{maskAccountNumber(val)}</span>
    },
    {
      header: 'Billing Period',
      key: 'billingPeriod',
      render: (val, row) => (
        <div>
          <p className="font-semibold text-midnight-900">{row.billingMonth}</p>
          <p className="text-[10px] text-midnight-500">{val}</p>
        </div>
      )
    },
    {
      header: 'Units (kWh)',
      key: 'unitsConsumed',
      render: (val) => <span className="font-mono font-bold text-midnight-900">{formatKWh(val)}</span>
    },
    {
      header: 'Amount',
      key: 'amount',
      render: (val) => <span className="font-mono font-bold text-midnight-950">{formatCurrency(val)}</span>
    },
    {
      header: 'Status',
      key: 'status',
      render: (val) => {
        const isVerified = val === 'VERIFIED';
        const isFailed = val === 'FAILED';
        return (
          <span
            className={`inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-full font-semibold ${
              isVerified
                ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/30'
                : isFailed
                  ? 'bg-rose-500/10 text-rose-800 border border-rose-500/30'
                  : 'bg-amber-500/10 text-amber-800 border border-amber-500/30'
            }`}
          >
            {isVerified ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            {isVerified ? 'VERIFIED' : val === 'EXTRACTED' ? 'NEEDS REVIEW' : val}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          {row.status === 'EXTRACTED' && (
            <button
              onClick={() => openReviewModal(row)}
              className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
              title="Review & Confirm Extracted Bill"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setSelectedBill(row)}
            className="p-1.5 text-midnight-600 hover:text-midnight-950 hover:bg-ivory-200 rounded-lg transition-colors"
            title="Inspect Extracted Fields"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => setBillToDelete(row)}
            className="p-1.5 text-midnight-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Bill"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const reviewWarnings = billToReview
    ? Array.from(new Set([...(billToReview.warnings || []), ...(billToReview.validation?.warnings || [])]))
    : [];
  const reviewEvidence = billToReview?.evidence || billToReview?.extraction?.evidence || {};

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-midnight-900 tracking-tight">Electricity Bill Management</h2>
        <p className="text-xs text-midnight-600 mt-0.5">
          Upload a utility PDF or photo. WattWise extracts the bill fields and saves a draft; nothing is marked verified until you review and confirm it.
        </p>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all bg-white flex flex-col items-center justify-center ${
          dragActive
            ? 'border-cobalt-500 bg-cobalt-50/30 scale-[1.01]'
            : 'border-ivory-300 hover:border-ivory-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,image/png,image/jpeg,image/jpg"
          onChange={(e) => handleFileUpload(e.target.files[0])}
          className="hidden"
          id="bill-upload-input"
        />

        <div className="w-16 h-16 rounded-2xl bg-ivory-100 border border-ivory-200 flex items-center justify-center text-midnight-800 mb-4 shadow-sm">
          <UploadCloud className="w-8 h-8 text-cobalt-600" />
        </div>

        <h3 className="text-base font-bold text-midnight-900 mb-1">
          Upload Utility Electricity Bill
        </h3>
        <p className="text-xs text-midnight-600 max-w-md mb-6 leading-relaxed">
          Drag and drop your electricity bill file here, or click to browse. Supported formats: <strong>PDF, PNG, JPG</strong> up to 15 MB.
        </p>

        {isUploading ? (
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-xs font-mono text-midnight-700">
              <span>Running OCR Extraction...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-ivory-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-cobalt-500 h-full transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <Button
            variant="primary"
            onClick={() => fileInputRef.current?.click()}
            leftIcon={UploadCloud}
          >
            Select Bill File
          </Button>
        )}
      </div>

      {/* Uploaded Bills Table */}
      <Card
        title="Extracted Billing Statements"
        subtitle="Historical utility statements parsed and securely indexed"
      >
        <DataTable
          columns={columns}
          data={bills}
          isLoading={loading}
          emptyMessage="No bills uploaded yet. Upload your first PDF statement above."
        />
      </Card>

      {/* Bill Details Modal */}
      <Modal
        isOpen={!!selectedBill}
        onClose={() => setSelectedBill(null)}
        title="Extracted Bill Intelligence"
        subtitle={selectedBill?.fileName}
        maxWidth="max-w-lg"
      >
        {selectedBill && (
          <div className="space-y-5">
            <div className="p-4 bg-ivory-100 rounded-2xl border border-ivory-200 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono text-midnight-500 uppercase tracking-wider">Total Amount Due</p>
                <p className="text-2xl font-black text-midnight-900 mt-0.5 font-sans">
                  {selectedBill.extraction?.netPayable != null || selectedBill.amount != null
                    ? formatCurrency(selectedBill.extraction?.netPayable ?? selectedBill.amount)
                    : 'Not extracted'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-mono text-midnight-500 uppercase tracking-wider">Units Billed</p>
                <p className="text-xl font-bold text-cobalt-600 mt-0.5 font-mono">
                  {formatKWh(selectedBill.unitsConsumed)}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-ivory-200">
                <span className="text-midnight-600">Account Number (Masked)</span>
                <span className="font-mono font-semibold text-midnight-900">
                  {maskAccountNumber(selectedBill.accountNumber)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-ivory-200">
                <span className="text-midnight-600">Billing Cycle</span>
                <span className="font-semibold text-midnight-900">{selectedBill.billingPeriod}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-ivory-200">
                <span className="text-midnight-600">Due Date</span>
                <span className="font-mono font-semibold text-midnight-900">{formatDate(selectedBill.dueDate)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-ivory-200">
                <span className="text-midnight-600">Tariff Classification</span>
                <span className="font-semibold text-midnight-900">{selectedBill.tariffCategory || 'Not extracted'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-ivory-200">
                <span className="text-midnight-600">Net Payable (Final Amount)</span>
                <span className="font-mono font-semibold text-midnight-900">{formatCurrency(selectedBill.amount)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-ivory-200">
                <span className="text-midnight-600">Current Demand Payable</span>
                <span className="font-mono font-semibold text-midnight-900">
                  {selectedBill.extraction?.currentDemandPayable != null
                    ? formatCurrency(selectedBill.extraction.currentDemandPayable)
                    : 'Not extracted'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-ivory-200">
                <span className="text-midnight-600">Arrears</span>
                <span className="font-mono font-semibold text-midnight-900">
                  {selectedBill.extraction?.arrears != null ? formatCurrency(selectedBill.extraction.arrears) : 'Not extracted'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-ivory-200">
                <span className="text-midnight-600">Meter Readings (Prev → Curr)</span>
                <span className="font-mono font-semibold text-midnight-900">
                  {selectedBill.extraction?.previousReading ?? '—'} → {selectedBill.extraction?.currentReading ?? '—'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-ivory-200">
                <span className="text-midnight-600">OCR Extraction Status</span>
                <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                  selectedBill.status === 'VERIFIED'
                    ? 'text-emerald-700 bg-emerald-500/10'
                    : 'text-amber-700 bg-amber-500/10'
                }`}>
                  {selectedBill.status === 'EXTRACTED' ? 'NEEDS REVIEW' : selectedBill.status}
                </span>
              </div>
            </div>

            {(selectedBill.warnings?.length > 0 || selectedBill.validation?.warnings?.length > 0) && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-900 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Validation warnings
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  {Array.from(new Set([...(selectedBill.warnings || []), ...(selectedBill.validation?.warnings || [])])).map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedBill.breakdown && (
              <div className="bg-ivory-50 p-4 rounded-xl border border-ivory-200 space-y-2 text-xs">
                <p className="font-bold text-midnight-900 mb-2">Itemized Component Charges</p>
                <div className="flex justify-between text-midnight-600">
                  <span>Energy Charges:</span>
                  <span className="font-mono font-semibold text-midnight-900">
                    {formatCurrency(selectedBill.breakdown.energyCharges)}
                  </span>
                </div>
                <div className="flex justify-between text-midnight-600">
                  <span>Standing Service Charge:</span>
                  <span className="font-mono font-semibold text-midnight-900">
                    {formatCurrency(selectedBill.breakdown.standingCharge)}
                  </span>
                </div>
                <div className="flex justify-between text-midnight-600">
                  <span>Environmental Surcharges:</span>
                  <span className="font-mono font-semibold text-midnight-900">
                    {formatCurrency(selectedBill.breakdown.environmentalSurcharge)}
                  </span>
                </div>
                <div className="flex justify-between text-midnight-600">
                  <span>State & Local Taxes:</span>
                  <span className="font-mono font-semibold text-midnight-900">
                    {formatCurrency(selectedBill.breakdown.taxes)}
                  </span>
                </div>
              </div>
            )}

            {selectedBill.status === 'EXTRACTED' && (
              <Button
                variant="primary"
                className="w-full"
                onClick={() => openReviewModal(selectedBill)}
                leftIcon={CheckCircle2}
              >
                Review & Confirm This Bill
              </Button>
            )}

            <Button variant="secondary" className="w-full" onClick={() => setSelectedBill(null)}>
              Close Bill Details
            </Button>
          </div>
        )}
      </Modal>

      {/* Review & Confirm Extracted Bill Modal */}
      <Modal
        isOpen={!!billToReview}
        onClose={() => setBillToReview(null)}
        title="Review Extracted Bill Data"
        subtitle={billToReview?.fileName}
        maxWidth="max-w-lg"
      >
        {billToReview && (
          <form onSubmit={handleConfirmBill} className="space-y-4">
            <div className="p-3 bg-cobalt-50 border border-cobalt-200/60 rounded-xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cobalt-600 shrink-0" />
                <span className="font-semibold text-midnight-900">
                  {billToReview.ocrConfidence && billToReview.ocrConfidence > 0
                    ? `Extraction confidence: ${Math.round(billToReview.ocrConfidence * 100)}%`
                    : 'Manual verification required'}
                </span>
              </div>
              <span className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold text-right ${
                billToReview.validation?.status === 'HIGH_CONFIDENCE'
                  ? 'text-emerald-700 bg-emerald-100/80'
                  : 'text-amber-800 bg-amber-100/80'
              }`}>
                {billToReview.sourceEngine || 'Extracted from file'}
              </span>
            </div>

            <p className="text-[11px] text-midnight-500 leading-relaxed">
              Confidence values are heuristic indicators, not calibrated probabilities. Fields outlined in
              <span className="font-semibold text-amber-700"> amber </span>are uncertain and
              <span className="font-semibold text-rose-700"> red </span>fields were not extracted. Compare every value with the original bill.
            </p>

            {billToReview.validation?.status === 'MANUAL_ENTRY_REQUIRED' && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Automatic extraction could not confirm the net payable amount and/or billed units. Enter them from the bill before confirming.</span>
              </div>
            )}

            {reviewWarnings.length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-900 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Validation warnings
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  {reviewWarnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <p className="font-bold text-midnight-900 mb-2">Consumer & bill identity</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ReviewField
                    label="Consumer Name"
                    value={reviewFormData.consumerName}
                    onChange={(value) => updateReviewField('consumerName', value)}
                    highlight={highlightFor(billToReview, 'consumerName')}
                  />
                  <ReviewField
                    label="Account / Consumer Number"
                    value={reviewFormData.accountNumber}
                    onChange={(value) => updateReviewField('accountNumber', value)}
                    highlight={highlightFor(billToReview, 'accountNumber')}
                  />
                  <ReviewField
                    label="DISCOM / Provider"
                    value={reviewFormData.discom}
                    onChange={(value) => updateReviewField('discom', value)}
                    highlight={highlightFor(billToReview, 'discom')}
                  />
                  <div>
                    <label className="block text-midnight-700 font-semibold mb-1">Tariff Category</label>
                    <select
                      value={reviewFormData.tariffCategory}
                      onChange={(e) => updateReviewField('tariffCategory', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cobalt-500 ${fieldTone(highlightFor(billToReview, 'tariffCategory'))}`}
                    >
                      <option value="Domestic LT-1 Standard">Domestic LT-1 Standard (Urban)</option>
                      <option value="Domestic LT-1 Time-of-Day">Domestic LT-1 Time-of-Day (ToD)</option>
                      <option value="Commercial LT-2">Commercial LT-2 (Shops/Offices)</option>
                      <option value="Agricultural PM-KUSUM">Agricultural PM-KUSUM</option>
                      <option value="Industrial HT-2a">Industrial HT-2a High Voltage</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <p className="font-bold text-midnight-900 mb-2">Billing period</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ReviewField
                    label="Billing Month"
                    value={reviewFormData.billingMonth}
                    onChange={(value) => updateReviewField('billingMonth', value)}
                    highlight={highlightFor(billToReview, 'billingMonth')}
                    placeholder="e.g. October 2026"
                  />
                  <ReviewField
                    label="Bill Issue / Reading Date"
                    type="date"
                    value={reviewFormData.billIssueDate}
                    onChange={(value) => updateReviewField('billIssueDate', value)}
                    highlight={highlightFor(billToReview, 'billIssueDate')}
                  />
                  <ReviewField
                    label="Billing Period Start"
                    type="date"
                    value={reviewFormData.billingPeriodStart}
                    onChange={(value) => updateReviewField('billingPeriodStart', value)}
                    highlight={highlightFor(billToReview, 'billingPeriodStart')}
                  />
                  <ReviewField
                    label="Billing Period End"
                    type="date"
                    value={reviewFormData.billingPeriodEnd}
                    onChange={(value) => updateReviewField('billingPeriodEnd', value)}
                    highlight={highlightFor(billToReview, 'billingPeriodEnd')}
                  />
                  <ReviewField
                    label="Payment Due Date"
                    type="date"
                    value={reviewFormData.dueDate}
                    onChange={(value) => updateReviewField('dueDate', value)}
                    highlight={highlightFor(billToReview, 'dueDate')}
                  />
                </div>
              </div>

              <div>
                <p className="font-bold text-midnight-900 mb-2">Meter readings & consumption</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <ReviewField
                    label="Previous Reading"
                    type="number"
                    step="0.001"
                    value={reviewFormData.previousReading}
                    onChange={(value) => updateReviewField('previousReading', value)}
                    highlight={highlightFor(billToReview, 'previousReading')}
                  />
                  <ReviewField
                    label="Current Reading"
                    type="number"
                    step="0.001"
                    value={reviewFormData.currentReading}
                    onChange={(value) => updateReviewField('currentReading', value)}
                    highlight={highlightFor(billToReview, 'currentReading')}
                  />
                  <ReviewField
                    label="Units Consumed (kWh)"
                    type="number"
                    step="0.1"
                    required
                    value={reviewFormData.unitsConsumed}
                    onChange={(value) => updateReviewField('unitsConsumed', value)}
                    highlight={highlightFor(billToReview, 'unitsConsumed')}
                  />
                </div>
              </div>

              <div>
                <p className="font-bold text-midnight-900 mb-2">Charges as printed</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ReviewField
                    label="Energy Charges (₹)"
                    type="number"
                    step="0.01"
                    value={reviewFormData.energyCharges}
                    onChange={(value) => updateReviewField('energyCharges', value)}
                    highlight={highlightFor(billToReview, 'energyCharges')}
                  />
                  <ReviewField
                    label="Fixed / Standing Charges (₹)"
                    type="number"
                    step="0.01"
                    value={reviewFormData.fixedCharges}
                    onChange={(value) => updateReviewField('fixedCharges', value)}
                    highlight={highlightFor(billToReview, 'fixedCharges')}
                  />
                  <ReviewField
                    label="Other Charges / FPPCA & Surcharges (₹)"
                    type="number"
                    step="0.01"
                    value={reviewFormData.otherCharges}
                    onChange={(value) => updateReviewField('otherCharges', value)}
                    highlight={highlightFor(billToReview, 'otherCharges')}
                  />
                  <ReviewField
                    label="Taxes / Electricity Duty (₹)"
                    type="number"
                    step="0.01"
                    value={reviewFormData.taxes}
                    onChange={(value) => updateReviewField('taxes', value)}
                    highlight={highlightFor(billToReview, 'taxes')}
                  />
                </div>
              </div>

              <div>
                <p className="font-bold text-midnight-900 mb-2">Payables</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <ReviewField
                    label="Current Demand Payable (₹)"
                    type="number"
                    step="0.01"
                    value={reviewFormData.currentDemandPayable}
                    onChange={(value) => updateReviewField('currentDemandPayable', value)}
                    highlight={highlightFor(billToReview, 'currentDemandPayable')}
                    hint="Current cycle only; excludes arrears."
                  />
                  <ReviewField
                    label="Arrears (₹)"
                    type="number"
                    step="0.01"
                    value={reviewFormData.arrears}
                    onChange={(value) => updateReviewField('arrears', value)}
                    highlight={highlightFor(billToReview, 'arrears')}
                    hint="Negative values indicate a credit."
                  />
                  <ReviewField
                    label="Net Payable / Final Amount (₹)"
                    type="number"
                    step="0.01"
                    required
                    value={reviewFormData.amount}
                    onChange={(value) => updateReviewField('amount', value)}
                    highlight={highlightFor(billToReview, 'netPayable')}
                    hint="The final amount printed on the bill. Negative values are allowed."
                  />
                </div>
              </div>

              {Object.keys(reviewEvidence).length > 0 && (
                <details className="rounded-xl border border-ivory-300 bg-ivory-50 p-3">
                  <summary className="cursor-pointer font-semibold text-midnight-800">
                    Source evidence from the document ({Object.keys(reviewEvidence).length} fields)
                  </summary>
                  <dl className="mt-2 space-y-1.5 text-[11px] text-midnight-600">
                    {Object.entries(reviewEvidence).slice(0, 20).map(([field, snippet]) => (
                      <div key={field} className="flex gap-2">
                        <dt className="font-mono font-semibold text-midnight-800 shrink-0">{field}:</dt>
                        <dd className="break-words">{String(snippet).slice(0, 200)}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
              )}
            </div>

            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-ivory-300 bg-ivory-50 cursor-pointer">
              <input
                type="checkbox"
                checked={reviewConfirmed}
                onChange={(e) => setReviewConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-cobalt-600"
              />
              <span className="text-[11px] text-midnight-700 leading-relaxed">
                I have compared these values with the original bill and confirm they are correct. I understand this will be saved as a verified record and used in consumption analytics.
              </span>
            </label>

            <div className="pt-2 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setBillToReview(null)}
                disabled={isConfirming}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isConfirming}
                disabled={!reviewConfirmed || isConfirming}
                leftIcon={CheckCircle2}
              >
                Confirm & Save to Records
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!billToDelete}
        onClose={() => setBillToDelete(null)}
        onConfirm={handleDeleteBill}
        title="Remove Bill Record?"
        description={`Are you sure you want to delete ${billToDelete?.fileName}? This will recalculate historical benchmarks.`}
        confirmLabel="Delete Record"
        isDestructive
        isLoading={isDeleting}
      />
    </div>
  );
};

export default BillManagement;

