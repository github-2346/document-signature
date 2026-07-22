import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  FileText,
  Calendar,
  User,
  Hash,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Pen,
  Share2,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize,
  X,
  Eye
} from 'lucide-react';
import { useDocumentStore } from '../store/documentStore';
import { useAuthStore } from '../store/authStore';

const DocumentViewPage: React.FC = () => {
  const { id: documentId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    getDocument,
    getDocumentFile,
    getSignedDocumentFile,
    getSignatureFields,
    getDocumentPublicLinks,
    deleteDocument,
    addAuditLog
  } = useDocumentStore();

  const document = documentId ? getDocument(documentId) : null;
  const documentFile = documentId ? getDocumentFile(documentId) : null;
  const signedDocumentFile = documentId ? getSignedDocumentFile(documentId) : null;
  const signatureFields = documentId ? getSignatureFields(documentId) : [];
  const publicLinks = documentId ? getDocumentPublicLinks(documentId) : [];

  const [zoom, setZoom] = useState(1);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const completedSignatures = signatureFields.filter(f => f.status === 'COMPLETED');

  // Log document view
  useEffect(() => {
    if (document && user) {
      addAuditLog({
        documentId: document.id,
        documentName: document.name,
        action: 'VIEW',
        performedBy: user.name,
        performerEmail: user.email
      });
    }
  }, []);

  const handleDownload = () => {
    if (!document) return;

    // Prefer signed document if available
    const fileToDownload = signedDocumentFile || documentFile;
    if (!fileToDownload) return;

    const link = window.document.createElement('a');
    link.href = fileToDownload;
    
    // Add "signed_" prefix if downloading signed version
    const fileName = signedDocumentFile 
      ? `signed_${document.name.replace(/\.[^/.]+$/, '')}.png`
      : document.name;
    
    link.download = fileName;
    link.click();

    if (user) {
      addAuditLog({
        documentId: document.id,
        documentName: document.name,
        action: 'DOWNLOAD',
        performedBy: user.name,
        performerEmail: user.email,
        details: signedDocumentFile ? 'Downloaded signed version' : 'Downloaded original'
      });
    }
  };

  const handleDelete = () => {
    if (!document) return;
    deleteDocument(document.id);
    navigate('/documents');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'SIGNED':
        return { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20', label: 'Signed' };
      case 'REJECTED':
        return { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20', label: 'Rejected' };
      default:
        return { icon: AlertCircle, color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Pending' };
    }
  };

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl text-white mb-2">Document Not Found</h2>
          <p className="text-gray-400 mb-4">The document you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/documents')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Documents
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(document.status);
  const StatusIcon = statusInfo.icon;
  const isPDF = documentFile?.startsWith('data:application/pdf');
  const isImage = documentFile?.startsWith('data:image');

  // Use signed document for preview if available
  const previewFile = signedDocumentFile || documentFile;
  const isSignedPreview = !!signedDocumentFile;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/documents')}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-300" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl text-white font-semibold">{document.name}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusInfo.bg} ${statusInfo.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  {statusInfo.label}
                </span>
                {isSignedPreview && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Signatures Embedded
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-sm mt-1">
                Uploaded {formatDate(document.uploadTime)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {document.status === 'PENDING' && (
              <button
                onClick={() => navigate(`/sign/${document.id}`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Pen className="w-4 h-4" />
                Sign Document
              </button>
            )}
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {isSignedPreview ? 'Download Signed' : 'Download'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">
        {/* Document Preview */}
        <div className="flex-1 p-6">
          {/* Zoom Controls */}
          <div className="flex justify-center gap-2 mb-4">
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
              className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700"
            >
              <ZoomOut className="w-4 h-4 text-gray-300" />
            </button>
            <span className="px-4 py-2 bg-gray-800 rounded-lg text-gray-300">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(Math.min(2, zoom + 0.25))}
              className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700"
            >
              <ZoomIn className="w-4 h-4 text-gray-300" />
            </button>
            <button
              onClick={() => setShowFullScreen(true)}
              className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700"
            >
              <Maximize className="w-4 h-4 text-gray-300" />
            </button>
          </div>

          {/* Preview Container */}
          <div className="flex justify-center overflow-auto">
            <div
              ref={containerRef}
              className="relative bg-white rounded-lg shadow-xl overflow-hidden"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top center'
              }}
            >
              {/* Image Preview - Show signed version if available */}
              {(isImage || isSignedPreview) && previewFile && (
                <div className="relative">
                  <img
                    src={previewFile}
                    alt={document.name}
                    className="max-w-full h-auto"
                    style={{ display: 'block', minWidth: '600px' }}
                  />
                  {isSignedPreview && (
                    <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg">
                      <CheckCircle className="w-4 h-4" />
                      Signed Document
                    </div>
                  )}
                </div>
              )}

              {/* PDF Preview (show original since we can't embed in PDF without library) */}
              {isPDF && !isSignedPreview && (
                <div className="w-[600px] h-[800px] flex flex-col items-center justify-center bg-gray-100 p-8">
                  <div className="text-red-600 text-6xl mb-4">📄</div>
                  <h3 className="text-gray-800 text-xl font-semibold mb-2">{document.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">PDF Document</p>
                  <p className="text-gray-500 text-xs mb-4">
                    {formatFileSize(document.fileSize || 0)} • {document.pageCount} page(s)
                  </p>
                  
                  {/* Show signatures info for PDFs */}
                  {completedSignatures.length > 0 && (
                    <div className="mt-4 p-4 bg-green-100 rounded-lg">
                      <p className="text-green-800 font-medium flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        {completedSignatures.length} signature(s) applied
                      </p>
                    </div>
                  )}
                  
                  <button
                    onClick={handleDownload}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Document Info */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 p-6">
          <h2 className="text-white font-semibold mb-4">Document Details</h2>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-gray-400 text-sm">File Name</p>
                <p className="text-white">{document.name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-gray-400 text-sm">Owner</p>
                <p className="text-white">{document.ownerName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-gray-400 text-sm">Uploaded</p>
                <p className="text-white">{formatDate(document.uploadTime)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Hash className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-gray-400 text-sm">File Hash</p>
                <p className="text-white text-xs font-mono break-all">{document.fileHash}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-gray-400 text-sm">Size</p>
                <p className="text-white">{formatFileSize(document.fileSize || 0)}</p>
              </div>
            </div>
          </div>

          {/* Signatures Section */}
          {completedSignatures.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-700">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Pen className="w-4 h-4" />
                Signatures ({completedSignatures.length})
              </h3>
              <div className="space-y-3">
                {completedSignatures.map((sig, index) => (
                  <div key={sig.id} className="bg-gray-700/50 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-10 bg-white rounded overflow-hidden">
                        <img
                          src={sig.signatureImage}
                          alt={`Signature ${index + 1}`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{sig.signerName}</p>
                        <p className="text-gray-400 text-xs">{sig.signerEmail}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-green-400 text-xs">
                      <CheckCircle className="w-3 h-3" />
                      Signed {sig.createdAt ? formatDate(sig.createdAt) : 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Public Links */}
          {publicLinks.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-700">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Sharing Links ({publicLinks.length})
              </h3>
              <div className="space-y-2">
                {publicLinks.map((link) => (
                  <div key={link.id} className="bg-gray-700/50 rounded-lg p-3">
                    <p className="text-white text-sm">{link.signerName}</p>
                    <p className="text-gray-400 text-xs">{link.signerEmail}</p>
                    <p className={`text-xs mt-1 ${link.used ? 'text-green-400' : 'text-yellow-400'}`}>
                      {link.used ? '✓ Used' : '⏳ Pending'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <button
              onClick={() => navigate(`/sign/${document.id}`)}
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 mb-2"
            >
              <Pen className="w-4 h-4" />
              {document.status === 'SIGNED' ? 'Add More Signatures' : 'Sign Document'}
            </button>
            <button
              onClick={() => navigate('/audit')}
              className="w-full py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              View Audit Log
            </button>
          </div>
        </div>
      </div>

      {/* Full Screen Modal */}
      {showFullScreen && previewFile && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
          <button
            onClick={() => setShowFullScreen(false)}
            className="absolute top-4 right-4 p-2 bg-gray-800 rounded-lg hover:bg-gray-700"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <div className="max-w-[90vw] max-h-[90vh] overflow-auto">
            {(isImage || isSignedPreview) && (
              <img
                src={previewFile}
                alt={document.name}
                className="max-w-full h-auto"
              />
            )}
            {isPDF && !isSignedPreview && (
              <div className="bg-white p-8 rounded-lg text-center">
                <div className="text-red-600 text-8xl mb-4">📄</div>
                <h3 className="text-gray-800 text-2xl font-semibold">{document.name}</h3>
                <p className="text-gray-600 mt-2">PDF Document</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl text-white font-semibold mb-2">Delete Document?</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete "{document.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentViewPage;
