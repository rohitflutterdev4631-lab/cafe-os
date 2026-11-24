'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  FileImage,
  X,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';

export default function NewMenuImportPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [menuName, setMenuName] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [notes, setNotes] = useState('');
  const [language, setLanguage] = useState('en');
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [cafe, setCafe] = useState<any>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetch('/api/v1/cafes/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.cafe) {
          setCafe(data.cafe);
          if (data.cafe.settings?.currency) {
            setCurrency(data.cafe.settings.currency);
          }
          if (data.cafe.branches && data.cafe.branches.length > 0) {
            setBranches(data.cafe.branches);
            setSelectedBranchId(data.cafe.branches[0].id);
          }
        }
      })
      .catch((err) => console.error('Failed to load cafe details:', err));
  }, []);

  const handleFilesSelected = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const incoming = Array.from(newFiles);
    const validFiles: File[] = [];

    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'docx', 'xlsx', 'xls', 'csv'];

    for (const file of incoming) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !allowedExtensions.includes(ext)) {
        showToast(`File "${file.name}" rejected: Unsupported format .${ext}`, 'error');
        continue;
      }
      if (file.size > 25 * 1024 * 1024) {
        showToast(`File "${file.name}" exceeds 25MB limit`, 'error');
        continue;
      }
      validFiles.push(file);
    }

    setFiles((prev) => [...prev, ...validFiles]);

    // Auto set menu name if empty
    if (!menuName && validFiles.length > 0) {
      const rawBase = validFiles[0].name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setMenuName(`${rawBase.charAt(0).toUpperCase() + rawBase.slice(1)} Menu`);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (files.length === 0) {
      showToast('Please upload at least one menu file', 'error');
      return;
    }

    if (!menuName.trim()) {
      showToast('Please enter a menu name', 'error');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(15);

      // 1. Create Import Session
      const sessionRes = await fetch('/api/v1/menu-imports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menuName: menuName.trim(),
          branchId: selectedBranchId || null,
          notes: notes.trim() || null,
          language,
        }),
      });

      const sessionData = await sessionRes.json();
      if (!sessionRes.ok) {
        throw new Error(sessionData.error || 'Failed to create import session');
      }

      const importId = sessionData.data.id;
      setUploadProgress(40);

      // 2. Upload Files
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const uploadRes = await fetch(`/api/v1/menu-imports/${importId}/files`, {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || 'Failed to upload files');
      }

      setUploadProgress(75);

      // 3. Trigger Asynchronous Processing
      const processRes = await fetch(`/api/v1/menu-imports/${importId}/process`, {
        method: 'POST',
      });

      if (!processRes.ok) {
        const processData = await processRes.json();
        throw new Error(processData.error || 'Failed to start extraction');
      }

      setUploadProgress(100);
      showToast('Files uploaded successfully! Extraction started.', 'success');

      // Redirect directly to review studio
      router.push(`/dashboard/importer/${importId}`);
    } catch (err: any) {
      console.error('Import initiation error:', err);
      showToast(err.message || 'An error occurred during import', 'error');
      setUploading(false);
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-5 h-5 text-rose-500" />;
    if (['xlsx', 'xls', 'csv'].includes(ext || '')) return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) return <FileImage className="w-5 h-5 text-blue-500" />;
    return <FileText className="w-5 h-5 text-slate-400" />;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/importer">
          <Button variant="ghost" size="sm" className="p-2 text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Upload Existing Menu</h1>
          <p className="text-sm text-slate-500">
            Our AI engine will analyze your documents, detect categories, extract food items, and format prices.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Upload Zone Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Select Menu Files</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload PDF menus, Excel price sheets, Word documents, or photos.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full">
                Up to 10 files · Max 25MB each
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Drag & Drop Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFilesSelected(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
                  : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50/80 bg-white'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files)}
              />

              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                <UploadCloud className="w-7 h-7" />
              </div>

              <h3 className="text-sm font-semibold text-slate-900">
                Click to browse or drag and drop your menu files
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Supports single or multi-page PDF documents, camera photographs (JPG/PNG), Excel spreadsheets, Word DOCX, and CSV files.
              </p>

              {/* Supported format badges */}
              <div className="mt-4 flex items-center justify-center gap-2 flex-wrap text-[11px] font-medium text-slate-500">
                <span className="px-2 py-0.5 bg-slate-100 rounded-md">PDF</span>
                <span className="px-2 py-0.5 bg-slate-100 rounded-md">DOCX</span>
                <span className="px-2 py-0.5 bg-slate-100 rounded-md">XLSX / XLS</span>
                <span className="px-2 py-0.5 bg-slate-100 rounded-md">CSV</span>
                <span className="px-2 py-0.5 bg-slate-100 rounded-md">JPG / PNG / WEBP</span>
              </div>
            </div>

            {/* Selected Files List */}
            {files.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Selected Files ({files.length})
                </p>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/40">
                  {files.map((file, idx) => (
                    <div
                      key={idx}
                      className="p-3 flex items-center justify-between gap-3 text-xs text-slate-700 hover:bg-white transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {getFileIcon(file.name)}
                        <span className="font-medium truncate">{file.name}</span>
                        <span className="text-slate-400 shrink-0">
                          ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configuration Details Card */}
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-900">Menu & Branch Details</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Menu Name"
                placeholder="e.g. Nordic Roast All Day Dining"
                value={menuName}
                onChange={(e) => setMenuName(e.target.value)}
                required
              />

              {branches.length > 0 ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assign to Branch
                  </label>
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <Input
                  label="Menu Currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  disabled
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Menu Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="en">English (Default)</option>
                  <option value="hi">Hindi</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="ar">Arabic</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Import Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Scanned from physical menu card"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* AI Guarantee Notice */}
            <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl flex items-start gap-3 text-xs text-blue-900 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Safe Extraction Guarantee:</strong> Our AI extracts
                only information explicitly present in your document. It will never invent prices or
                modify your menu without your explicit review and confirmation.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Progress Bar if active */}
        {uploading && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-2 text-blue-600">
                <Sparkles className="w-4 h-4 animate-spin" />
                Uploading files and initializing AI extraction pipeline...
              </span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/dashboard/importer">
            <Button variant="outline" disabled={uploading}>
              Cancel
            </Button>
          </Link>

          <Button
            type="submit"
            variant="primary"
            loading={uploading}
            disabled={files.length === 0 || uploading}
            className="gap-2 px-6 shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            Start AI Extraction
          </Button>
        </div>
      </form>
    </div>
  );
}
