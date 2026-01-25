import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/Layout';
import { api, ApiError } from '@/lib/api';

interface Account {
  id: string;
  name: string;
  currency: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
}

interface UploadResult {
  importId: string;
  filename: string;
  totalRows: number;
  preview: Array<Record<string, string>>;
  suggestedMapping: Record<string, string>;
  headers: string[];
}

interface PreviewRow {
  rowNumber: number;
  date: string | null;
  amount: number | null;
  payee: string | null;
  notes: string | null;
  isValid: boolean;
  isDuplicate: boolean;
  errors: string[];
}

interface PreviewResult {
  importId: string;
  totalRows: number;
  validRows: number;
  duplicateRows: number;
  errorRows: number;
  rows: PreviewRow[];
}

interface ImportHistory {
  id: string;
  filename: string;
  fileType: string;
  status: string;
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  createdAt: string;
  completedAt: string | null;
}

type Step = 'upload' | 'mapping' | 'preview' | 'complete';

const FIELD_OPTIONS = [
  { value: '', label: 'Ignore' },
  { value: 'date', label: 'Date' },
  { value: 'amount', label: 'Amount' },
  { value: 'payee', label: 'Payee / Description' },
  { value: 'notes', label: 'Notes / Memo' },
];

const DATE_FORMAT_OPTIONS = [
  { value: '', label: 'Auto-detect' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (European)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
];

export function ImportPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step state
  const [step, setStep] = useState<Step>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);

  // Mapping state
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [dateFormat, setDateFormat] = useState('');
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [negativeIsExpense, setNegativeIsExpense] = useState(true);
  const [defaultCategoryId, setDefaultCategoryId] = useState('');

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Queries
  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.accounts.list() as Promise<Account[]>,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.categories.list() as Promise<Category[]>,
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['importHistory'],
    queryFn: () => api.import.history(),
  });

  // Mutations
  const uploadMutation = useMutation({
    mutationFn: (file: File) => api.import.upload(file),
    onSuccess: (data) => {
      setUploadResult(data);
      setColumnMapping(data.suggestedMapping);
      setStep('mapping');
      setError(null);
    },
    onError: (err: ApiError) => {
      setError(err.message);
    },
  });

  const previewMutation = useMutation({
    mutationFn: () => {
      if (!selectedFile || !uploadResult) return Promise.reject(new Error('No file'));
      return api.import.preview(
        selectedFile,
        uploadResult.importId,
        selectedAccountId,
        columnMapping,
        dateFormat || undefined
      );
    },
    onSuccess: (data) => {
      setPreviewResult(data);
      setStep('preview');
      setError(null);
    },
    onError: (err: ApiError) => {
      setError(err.message);
    },
  });

  const commitMutation = useMutation({
    mutationFn: () => {
      if (!selectedFile) return Promise.reject(new Error('No file'));
      return api.import.commit(selectedFile, selectedAccountId, columnMapping, {
        dateFormat: dateFormat || undefined,
        negativeIsExpense,
        skipDuplicates,
        defaultCategoryId: defaultCategoryId || undefined,
      });
    },
    onSuccess: () => {
      setStep('complete');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['importHistory'] });
    },
    onError: (err: ApiError) => {
      setError(err.message);
    },
  });

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      uploadMutation.mutate(file);
    }
  }, [uploadMutation]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) {
        setSelectedFile(file);
        setError(null);
        uploadMutation.mutate(file);
      }
    },
    [uploadMutation]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleMappingChange = (header: string, field: string) => {
    setColumnMapping((prev) => {
      const next = { ...prev };
      // Remove any existing mapping for this field
      Object.keys(next).forEach((key) => {
        if (next[key] === field && key !== header) {
          delete next[key];
        }
      });
      if (field) {
        next[header] = field;
      } else {
        delete next[header];
      }
      return next;
    });
  };

  const isMappingValid = () => {
    const mappedFields = Object.values(columnMapping);
    return mappedFields.includes('date') && mappedFields.includes('amount') && mappedFields.includes('payee');
  };

  const handleStartOver = () => {
    setStep('upload');
    setSelectedFile(null);
    setUploadResult(null);
    setPreviewResult(null);
    setColumnMapping({});
    setSelectedAccountId('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Completed</span>;
      case 'PENDING':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
      case 'PROCESSING':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Processing</span>;
      case 'FAILED':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Failed</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Import Transactions</h1>
          {step !== 'upload' && step !== 'complete' && (
            <button onClick={handleStartOver} className="btn-outline">
              Start Over
            </button>
          )}
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {['upload', 'mapping', 'preview', 'complete'].map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === s
                      ? 'bg-primary-600 text-white'
                      : ['upload', 'mapping', 'preview', 'complete'].indexOf(step) > i
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {i + 1}
                </div>
                <span className="ml-2 text-sm text-gray-600 hidden sm:inline">
                  {s === 'upload' && 'Upload'}
                  {s === 'mapping' && 'Map Columns'}
                  {s === 'preview' && 'Preview'}
                  {s === 'complete' && 'Complete'}
                </span>
                {i < 3 && <div className="w-12 sm:w-24 h-0.5 mx-2 bg-gray-200" />}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700">
            {error}
          </div>
        )}

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Upload Transaction File</h2>
            <p className="text-gray-600 mb-6">
              Upload a CSV file exported from your bank. We support most common formats.
            </p>

            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-primary-500 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="mt-4 text-gray-600">
                {uploadMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></span>
                    Processing file...
                  </span>
                ) : (
                  <>
                    <span className="text-primary-600 font-medium">Click to upload</span> or drag and
                    drop
                  </>
                )}
              </p>
              <p className="mt-2 text-sm text-gray-500">CSV, XLSX, or XLS files up to 10MB</p>
            </div>
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === 'mapping' && uploadResult && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Select Account</h2>
              <p className="text-gray-600 mb-4">
                Choose which account these transactions belong to.
              </p>
              <select
                className="input max-w-md"
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
              >
                <option value="">Select an account</option>
                {accounts?.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.currency})
                  </option>
                ))}
              </select>
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Map Columns</h2>
              <p className="text-gray-600 mb-4">
                File: <strong>{uploadResult.filename}</strong> ({uploadResult.totalRows} rows)
              </p>
              <p className="text-gray-600 mb-4">
                Map each column from your file to the corresponding field. Date, Amount, and Payee are
                required.
              </p>

              <div className="space-y-3">
                {uploadResult.headers.map((header) => (
                  <div key={header} className="flex items-center gap-4">
                    <span className="w-48 text-sm font-medium text-gray-700 truncate" title={header}>
                      {header}
                    </span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <select
                      className="input flex-1 max-w-xs"
                      value={columnMapping[header] || ''}
                      onChange={(e) => handleMappingChange(header, e.target.value)}
                    >
                      {FIELD_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {/* Preview value */}
                    <span className="text-sm text-gray-500 truncate max-w-[200px]" title={uploadResult.preview[0]?.[header]}>
                      {uploadResult.preview[0]?.[header] || '-'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Import Options</h2>
              <div className="space-y-4">
                <div>
                  <label className="label">Date Format</label>
                  <select
                    className="input max-w-xs"
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                  >
                    {DATE_FORMAT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="skipDuplicates"
                    checked={skipDuplicates}
                    onChange={(e) => setSkipDuplicates(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="skipDuplicates" className="text-sm text-gray-700">
                    Skip duplicate transactions (same date, amount, and payee)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="negativeIsExpense"
                    checked={negativeIsExpense}
                    onChange={(e) => setNegativeIsExpense(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="negativeIsExpense" className="text-sm text-gray-700">
                    Negative amounts are expenses
                  </label>
                </div>

                <div>
                  <label className="label">Default Category (for uncategorized transactions)</label>
                  <select
                    className="input max-w-xs"
                    value={defaultCategoryId}
                    onChange={(e) => setDefaultCategoryId(e.target.value)}
                  >
                    <option value="">No default category</option>
                    {categories?.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={handleStartOver} className="btn-outline">
                Cancel
              </button>
              <button
                onClick={() => previewMutation.mutate()}
                className="btn-primary"
                disabled={!isMappingValid() || !selectedAccountId || previewMutation.isPending}
              >
                {previewMutation.isPending ? 'Loading Preview...' : 'Preview Import'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 'preview' && previewResult && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Import Summary</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Rows</p>
                  <p className="text-2xl font-bold text-gray-900">{previewResult.totalRows}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600">Valid</p>
                  <p className="text-2xl font-bold text-green-700">{previewResult.validRows}</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-600">Duplicates</p>
                  <p className="text-2xl font-bold text-yellow-700">{previewResult.duplicateRows}</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-600">Errors</p>
                  <p className="text-2xl font-bold text-red-700">{previewResult.errorRows}</p>
                </div>
              </div>
            </div>

            <div className="card overflow-hidden p-0">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold">Transaction Preview</h2>
                <p className="text-sm text-gray-600">Showing first 50 rows</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payee</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewResult.rows.slice(0, 50).map((row) => (
                      <tr
                        key={row.rowNumber}
                        className={
                          row.isDuplicate
                            ? 'bg-yellow-50'
                            : !row.isValid
                            ? 'bg-red-50'
                            : 'hover:bg-gray-50'
                        }
                      >
                        <td className="px-4 py-3 text-sm text-gray-500">{row.rowNumber}</td>
                        <td className="px-4 py-3">
                          {row.isDuplicate ? (
                            <span className="text-xs text-yellow-600">Duplicate</span>
                          ) : !row.isValid ? (
                            <span className="text-xs text-red-600" title={row.errors.join(', ')}>
                              Error
                            </span>
                          ) : (
                            <span className="text-xs text-green-600">Valid</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.date || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                          {row.payee || '-'}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm text-right font-medium ${
                            row.amount && row.amount < 0 ? 'text-red-600' : 'text-green-600'
                          }`}
                        >
                          {row.amount?.toFixed(2) || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep('mapping')} className="btn-outline">
                Back to Mapping
              </button>
              <button
                onClick={() => commitMutation.mutate()}
                className="btn-primary"
                disabled={previewResult.validRows === 0 || commitMutation.isPending}
              >
                {commitMutation.isPending
                  ? 'Importing...'
                  : `Import ${skipDuplicates ? previewResult.validRows - previewResult.duplicateRows : previewResult.validRows} Transactions`}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 'complete' && (
          <div className="card text-center py-12">
            <svg
              className="mx-auto h-16 w-16 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Import Complete!</h2>
            <p className="mt-2 text-gray-600">Your transactions have been successfully imported.</p>
            <div className="mt-6 flex justify-center gap-4">
              <button onClick={handleStartOver} className="btn-outline">
                Import Another File
              </button>
              <a href="/transactions" className="btn-primary">
                View Transactions
              </a>
            </div>
          </div>
        )}

        {/* Import History */}
        {step === 'upload' && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Import History</h2>
            {historyLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              </div>
            ) : history && history.length > 0 ? (
              <div className="card overflow-hidden p-0">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        File
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Imported
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Skipped
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(history as ImportHistory[]).map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{item.filename}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(item.createdAt)}
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                        <td className="px-6 py-4 text-sm text-right text-gray-900">
                          {item.importedCount}
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-gray-500">
                          {item.skippedCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="card text-center py-8 text-gray-500">
                No previous imports found. Upload your first file above.
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
