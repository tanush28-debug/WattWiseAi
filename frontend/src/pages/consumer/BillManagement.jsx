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
  const [reviewFormData, setReviewFormData] = useState({
    accountNumber: '',
    billingMonth: '',
    unitsConsumed: '',
    amount: '',
    dueDate: '',
    tariffCategory: 'Domestic LT-1 Standard',
  });
  const [isConfirming, setIsConfirming] = useState(false);

  const fileInputRef = useRef(null);
  const toast = useToast();

  const fetchBills = async () => {
    try {
      const res = await billService.getBills();
      if (res && Array.isArray(res.data)) {
        setBills(res.data);
      }
    } catch (err) {
      console.warn('Unable to retrieve uploaded bills:', err);
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
        setReviewFormData({
          accountNumber: d.accountNumber ?? '',
          billingMonth: d.billingMonth ?? '',
          unitsConsumed: d.unitsConsumed ?? '',
          amount: d.amount ?? '',
          dueDate: d.dueDate ?? '',
          tariffCategory: d.tariffCategory || 'Domestic LT-1 Standard',
        });
        setBillToReview(d);

        const hasFields = d.accountNumber || d.unitsConsumed || d.amount;
        if (hasFields) {
          toast.info('OCR complete! Please review and confirm extracted values.');
        } else {
          toast.warning('OCR ran but could not extract fields automatically. Please fill in the details manually.');
        }
        fetchBills();
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
    setReviewFormData({
      accountNumber: bill.accountNumber || '',
      billingMonth: bill.billingMonth || '',
      unitsConsumed: bill.unitsConsumed || '',
      amount: bill.amount || '',
      dueDate: bill.dueDate || '',
      tariffCategory: bill.tariffCategory || 'Domestic LT-1 Standard',
    });
    setBillToReview(bill);
    if (selectedBill) setSelectedBill(null);
  };

  const handleConfirmBill = async (e) => {
    if (e) e.preventDefault();
    if (!billToReview) return;
    setIsConfirming(true);
    try {
      const confirmPayload = {
        ...reviewFormData,
        fileName: billToReview.fileName,
        fileSize: billToReview.fileSize,
        storagePath: billToReview.storagePath,
        breakdown: billToReview.breakdown,
        ocrConfidence: billToReview.ocrConfidence,
      };

      const res = await billService.confirmBill(billToReview.id, confirmPayload);
      const savedBill = res?.data || res;

      toast.success(res?.message || 'Bill verified! Added to your official consumption records.');
      setBillToReview(null);

      // Optimistically update table immediately so there is zero latency
      if (savedBill) {
        setBills((prev) => {
          const filtered = prev.filter((b) => b.id !== billToReview.id && b.id !== savedBill.id);
          return [
            {
              id: savedBill.id || ('bill-' + Date.now()),
              fileName: savedBill.fileName || billToReview.fileName || 'Verified Bill',
              accountNumber: savedBill.accountNumber || reviewFormData.accountNumber,
              billingMonth: savedBill.billingMonth || reviewFormData.billingMonth,
              billingPeriod: savedBill.billingMonth || reviewFormData.billingMonth || 'Cycle',
              unitsConsumed: Number(savedBill.unitsConsumed || reviewFormData.unitsConsumed),
              amount: Number(savedBill.amount || reviewFormData.amount),
              dueDate: savedBill.dueDate || reviewFormData.dueDate,
              tariffCategory: savedBill.tariffCategory || reviewFormData.tariffCategory,
              status: 'VERIFIED',
              uploadDate: new Date().toISOString(),
              fileSize: billToReview.fileSize || 'N/A',
              ocrConfidence: billToReview.ocrConfidence,
            },
            ...filtered
          ];
        });
      }

      // Synchronize with database
      await fetchBills();
    } catch (err) {
      toast.error(err.message || 'Failed to confirm bill record.');
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
      toast.error('Failed to remove bill record');
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
        const isExtracted = val === 'EXTRACTED';
        return (
          <span
            className={`inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-full font-semibold ${
              isExtracted
                ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-800 border border-amber-500/30'
            }`}
          >
            {isExtracted ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            {val}
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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-midnight-900 tracking-tight">Electricity Bill Management</h2>
        <p className="text-xs text-midnight-600 mt-0.5">
          Upload utility PDF statements or photos. Our backend OCR automatically verifies and extracts consumption parameters.
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
                  {formatCurrency(selectedBill.amount)}
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
                <span className="font-semibold text-midnight-900">{selectedBill.tariffCategory}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-ivory-200">
                <span className="text-midnight-600">OCR Extraction Status</span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded">
                  {selectedBill.status}
                </span>
              </div>
            </div>

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
            <div className="p-3 bg-cobalt-50 border border-cobalt-200/60 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cobalt-600 shrink-0" />
                <span className="font-semibold text-midnight-900">
                  {billToReview.ocrConfidence && billToReview.ocrConfidence > 0
                    ? `Extraction Confidence: ${Math.round(billToReview.ocrConfidence * 100)}%`
                    : 'Manual Verification Required'}
                </span>
              </div>
              <span className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold ${
                billToReview.validation?.status === 'HIGH_CONFIDENCE'
                  ? 'text-emerald-700 bg-emerald-100/80'
                  : 'text-amber-800 bg-amber-100/80'
              }`}>
                {billToReview.sourceEngine || 'Extracted from File'}
              </span>
            </div>

            {(!billToReview.ocrConfidence || billToReview.ocrConfidence === 0) && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Automatic text extraction was incomplete. Please verify and enter the details from your bill below.
                </span>
              </div>
            )}

            <p className="text-xs text-midnight-600 leading-relaxed">
              Verify the parsed billing attributes before saving to your official consumption analytics:
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-midnight-700 font-semibold mb-1">Account Number / Consumer ID</label>
                <input
                  type="text"
                  value={reviewFormData.accountNumber}
                  onChange={(e) => setReviewFormData({ ...reviewFormData, accountNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-ivory-300 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cobalt-500 bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-midnight-700 font-semibold mb-1">Billing Month</label>
                  <input
                    type="text"
                    value={reviewFormData.billingMonth}
                    onChange={(e) => setReviewFormData({ ...reviewFormData, billingMonth: e.target.value })}
                    className="w-full px-3 py-2 border border-ivory-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cobalt-500 bg-white"
                    placeholder="e.g. October 2026"
                    required
                  />
                </div>
                <div>
                  <label className="block text-midnight-700 font-semibold mb-1">Payment Due Date</label>
                  <input
                    type="date"
                    value={reviewFormData.dueDate ? reviewFormData.dueDate.split('T')[0] : ''}
                    onChange={(e) => setReviewFormData({ ...reviewFormData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-ivory-300 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cobalt-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-midnight-700 font-semibold mb-1">Units Consumed (kWh)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={reviewFormData.unitsConsumed}
                    onChange={(e) => setReviewFormData({ ...reviewFormData, unitsConsumed: e.target.value })}
                    className="w-full px-3 py-2 border border-ivory-300 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cobalt-500 bg-white font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-midnight-700 font-semibold mb-1">Total Bill Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={reviewFormData.amount}
                    onChange={(e) => setReviewFormData({ ...reviewFormData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-ivory-300 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cobalt-500 bg-white font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-midnight-700 font-semibold mb-1">Tariff Classification</label>
                <select
                  value={reviewFormData.tariffCategory}
                  onChange={(e) => setReviewFormData({ ...reviewFormData, tariffCategory: e.target.value })}
                  className="w-full px-3 py-2 border border-ivory-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cobalt-500 bg-white"
                >
                  <option value="Domestic LT-1 Standard">Domestic LT-1 Standard (Urban)</option>
                  <option value="Domestic LT-1 Time-of-Day">Domestic LT-1 Time-of-Day (ToD)</option>
                  <option value="Commercial LT-2">Commercial LT-2 (Shops/Offices)</option>
                  <option value="Agricultural PM-KUSUM">Agricultural PM-KUSUM</option>
                  <option value="Industrial HT-2a">Industrial HT-2a High Voltage</option>
                </select>
              </div>
            </div>

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
                leftIcon={CheckCircle2}
              >
                Confirm & Save to Records (+100 Pts)
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

