import React, { useState, useRef } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useDocumentStore } from '../store/documentStore';
import { useAuthStore } from '../store/authStore';
import { cn } from '../utils/cn';

interface UploadPageProps {
  onNavigate: (page: string, documentId?: string) => void;
}

interface UploadedFile {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  documentId?: string;
}

const ACCEPTED_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp'
];

export const UploadPage: React.FC<UploadPageProps> = ({ onNavigate }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadDocument } = useDocumentStore();
  const { user } = useAuthStore();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      f => ACCEPTED_TYPES.includes(f.type)
    );
    addFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter(
        f => ACCEPTED_TYPES.includes(f.type)
      );
      addFiles(selectedFiles);
    }
  };

  const addFiles = (newFiles: File[]) => {
    const newUploadFiles: UploadedFile[] = newFiles.map(file => ({
      file,
      status: 'pending',
      progress: 0,
    }));
    setFiles(prev => [...prev, ...newUploadFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (!user) return;

    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== 'pending') continue;

      setFiles(prev => prev.map((f, idx) => 
        idx === i ? { ...f, status: 'uploading', progress: 0 } : f
      ));

      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, progress } : f
        ));
      }

      try {
        const doc = await uploadDocument(files[i].file, user.id, user.name);
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'success', progress: 100, documentId: doc.id } : f
        ));
      } catch {
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'error', progress: 0 } : f
        ));
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') {
      return <FileText className="w-5 h-5 text-red-400" />;
    }
    return <ImageIcon className="w-5 h-5 text-blue-400" />;
  };

  const getFileIconBg = (file: File) => {
    if (file.type === 'application/pdf') {
      return 'bg-red-500/20';
    }
    return 'bg-blue-500/20';
  };

  const pendingFiles = files.filter(f => f.status === 'pending').length;
  const successFiles = files.filter(f => f.status === 'success').length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>
            Upload PDF documents or images for digital signing. Drag and drop or click to browse.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200',
              isDragging
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/50'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,application/pdf,image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-4">
              <div className={cn(
                'w-16 h-16 rounded-2xl flex items-center justify-center transition-colors',
                isDragging ? 'bg-blue-500/20' : 'bg-slate-800'
              )}>
                <Upload className={cn(
                  'w-8 h-8',
                  isDragging ? 'text-blue-400' : 'text-slate-400'
                )} />
              </div>
              <div>
                <p className="text-lg font-medium text-white mb-1">
                  {isDragging ? 'Drop files here' : 'Drag and drop files'}
                </p>
                <p className="text-sm text-slate-400">
                  or <span className="text-blue-400">browse from your device</span>
                </p>
              </div>
              <p className="text-xs text-slate-500">
                Supports: PDF, PNG, JPG, GIF, WebP (up to 50MB)
              </p>
            </div>
          </div>

          {files.length > 0 && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-300">
                  {files.length} file{files.length > 1 ? 's' : ''} selected
                </p>
                {pendingFiles > 0 && (
                  <Button onClick={uploadFiles} size="sm">
                    Upload {pendingFiles} file{pendingFiles > 1 ? 's' : ''}
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                      getFileIconBg(file.file)
                    )}>
                      {getFileIcon(file.file)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {file.file.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatFileSize(file.file.size)}
                      </p>
                      {file.status === 'uploading' && (
                        <div className="mt-2">
                          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 transition-all duration-300"
                              style={{ width: `${file.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {file.status === 'pending' && (
                        <span className="text-xs text-slate-400">Ready to upload</span>
                      )}
                      {file.status === 'uploading' && (
                        <span className="text-xs text-blue-400">{file.progress}%</span>
                      )}
                      {file.status === 'success' && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => file.documentId && onNavigate('document-view', file.documentId)}
                          >
                            View
                          </Button>
                        </div>
                      )}
                      {file.status === 'error' && (
                        <AlertCircle className="w-5 h-5 text-red-400" />
                      )}
                      {file.status === 'pending' && (
                        <button
                          onClick={() => removeFile(index)}
                          className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {successFiles > 0 && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-white">
                    {successFiles} document{successFiles > 1 ? 's' : ''} uploaded successfully
                  </p>
                  <p className="text-xs text-slate-400">
                    Ready for signature placement
                  </p>
                </div>
              </div>
              <Button onClick={() => onNavigate('documents')}>
                View Documents
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              PDF and image files (PNG, JPG, GIF, WebP) are supported
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              Maximum file size is 50MB per document
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              You can upload multiple files at once
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              Documents are encrypted and stored securely
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              Upload from your phone, computer, or any device
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
