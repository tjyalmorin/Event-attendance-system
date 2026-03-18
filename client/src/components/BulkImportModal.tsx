import React, { useState, useRef } from 'react'
import { bulkImportParticipantsApi, downloadImportTemplateUrl, ImportResult, ImportError } from '../api/bulk-import.api'

// ── Icons ──────────────────────────────────────────────────────────────────────
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
)
const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)

interface Props {
  eventId: number
  eventTitle: string
  onClose: () => void
  onSuccess: () => void
}

type Step = 'upload' | 'result'

const BulkImportModal: React.FC<Props> = ({ eventId, eventTitle, onClose, onSuccess }) => {
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (selected: File) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/csv',
    ]
    if (!allowed.includes(selected.type) && !selected.name.match(/\.(xlsx|xls|csv)$/i)) {
      alert('Only Excel (.xlsx) and CSV files are supported.')
      return
    }
    if (selected.size > 5 * 1024 * 1024) {
      alert('File must be under 5MB.')
      return
    }
    setFile(selected)
  }

  const handleImport = async () => {
    if (!file) return
    setLoading(true)
    try {
      const res = await bulkImportParticipantsApi(eventId, file)
      setResult(res)
      setStep('result')
      if (res.success) onSuccess()
    } catch (err: any) {
      // 422 = validation errors returned in body
      if (err.response?.data) {
        setResult(err.response.data)
        setStep('result')
      } else {
        alert(err.message || 'Import failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setFile(null)
    setResult(null)
    setStep('upload')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] w-full max-w-lg mx-4 flex flex-col max-h-[90vh] overflow-hidden">

        {/* Red top edge */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#DC143C] to-[#ff4d6d] flex-shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gray-50 dark:bg-[#242424] flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Bulk Import Participants</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate max-w-[320px]">{eventTitle}</p>
          </div>
          <button onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#333] rounded-lg transition-colors">
            <XIcon />
          </button>
        </div>
        <div className="h-px bg-gray-200 dark:bg-[#2a2a2a] flex-shrink-0" />

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5">

          {/* ── Step 1: Upload ── */}
          {step === 'upload' && (
            <div className="space-y-5">
              {/* Download template */}
              <div className="flex items-start justify-between gap-4 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/40 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Download the template first</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                    Fill in your participant roster using the Excel template. Do not change the column headers.
                  </p>
                </div>
                <a
                  href={downloadImportTemplateUrl()}
                  download
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex-shrink-0"
                >
                  <DownloadIcon />
                  Template
                </a>
              </div>

              {/* File drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => {
                  e.preventDefault()
                  setDragOver(false)
                  const dropped = e.dataTransfer.files[0]
                  if (dropped) handleFileSelect(dropped)
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-3 py-10 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                  dragOver
                    ? 'border-[#DC143C] bg-red-50/30 dark:bg-[#DC143C]/5'
                    : file
                    ? 'border-green-400 dark:border-green-700 bg-green-50/30 dark:bg-green-900/10'
                    : 'border-gray-200 dark:border-[#2a2a2a] hover:border-[#DC143C] hover:bg-red-50/20 dark:hover:bg-[#DC143C]/5'
                }`}
              >
                {file ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                      <CheckIcon />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{file.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB — click to change</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-gray-300 dark:text-gray-600"><UploadIcon /></div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                        Drop your file here or click to browse
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                        Supports .xlsx and .csv — max 5MB — max 500 rows
                      </p>
                    </div>
                  </>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="sr-only"
                onChange={e => {
                  const selected = e.target.files?.[0]
                  if (selected) handleFileSelect(selected)
                  e.target.value = ''
                }}
              />

              {/* Rules */}
              <div className="bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-xl px-4 py-3 space-y-1.5">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rules</p>
                {[
                  'If ANY row has an error, the entire import is rejected',
                  'Duplicate agent codes within this event are not allowed',
                  'Agent type must match an active type in the system',
                  'Maximum 500 rows per import',
                ].map((rule, i) => (
                  <p key={i} className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
                    <span className="text-[#DC143C] font-bold flex-shrink-0">•</span>
                    {rule}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 2: Result ── */}
          {step === 'result' && result && (
            <div className="space-y-4">
              {/* Result banner */}
              <div className={`flex items-start gap-3 p-4 rounded-xl border ${
                result.success
                  ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/40'
                  : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/40'
              }`}>
                <span className={result.success ? 'text-green-600 dark:text-green-400' : 'text-red-500'}>
                  {result.success ? <CheckIcon /> : <AlertIcon />}
                </span>
                <div>
                  <p className={`text-sm font-bold ${result.success ? 'text-green-800 dark:text-green-300' : 'text-red-700 dark:text-red-400'}`}>
                    {result.success ? 'Import Successful' : 'Import Rejected'}
                  </p>
                  <p className={`text-xs mt-0.5 ${result.success ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {result.success
                      ? `${result.success_count} of ${result.total_rows} participants registered successfully.`
                      : `${result.error_count} error${result.error_count !== 1 ? 's' : ''} found in ${result.total_rows} rows. Fix all errors and re-upload.`
                    }
                  </p>
                </div>
              </div>

              {/* Error table */}
              {result.errors.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Errors ({result.errors.length})
                  </p>
                  <div className="border border-gray-200 dark:border-[#2a2a2a] rounded-xl overflow-hidden">
                    <div className="grid grid-cols-[60px_120px_1fr] bg-gray-50 dark:bg-[#242424] border-b border-gray-200 dark:border-[#2a2a2a]">
                      <div className="px-3 py-2 text-xs font-bold text-gray-500 dark:text-gray-400">Row</div>
                      <div className="px-3 py-2 text-xs font-bold text-gray-500 dark:text-gray-400">Agent Code</div>
                      <div className="px-3 py-2 text-xs font-bold text-gray-500 dark:text-gray-400">Reason</div>
                    </div>
                    <div className="overflow-y-auto max-h-48">
                      {result.errors.map((err: ImportError, i: number) => (
                        <div key={i} className={`grid grid-cols-[60px_120px_1fr] ${i > 0 ? 'border-t border-gray-100 dark:border-[#2a2a2a]' : ''}`}>
                          <div className="px-3 py-2.5 text-xs font-mono text-red-500">{err.row}</div>
                          <div className="px-3 py-2.5 text-xs font-mono text-gray-600 dark:text-gray-400 truncate">{err.agent_code}</div>
                          <div className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-400">{err.reason}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-px bg-gray-200 dark:bg-[#2a2a2a] flex-shrink-0" />
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0">
          {step === 'result' && !result?.success ? (
            <button onClick={reset}
              className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-[#3a3a3a] rounded-xl hover:bg-gray-50 dark:hover:bg-[#333] transition-all">
              Try Again
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-[#3a3a3a] rounded-xl hover:bg-gray-50 dark:hover:bg-[#333] transition-all">
              {step === 'result' && result?.success ? 'Close' : 'Cancel'}
            </button>

            {step === 'upload' && (
              <button
                onClick={handleImport}
                disabled={!file || loading}
                className="px-4 py-2 text-sm font-semibold bg-[#DC143C] hover:bg-[#b01030] text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading
                  ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Importing...</>
                  : <><UploadIcon /> Import</>
                }
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BulkImportModal