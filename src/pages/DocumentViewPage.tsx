import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  Trash2, 
  Clock, 
  CheckCircle, 
  XCircle,
  FileText,
  User,
  Calendar,
  Hash,
  Layers,
  PenTool,
  Link,
  Mail,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Image as ImageIcon,
  FileImage
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { useDocumentStore } from '../store/documentStore';
import { useAuthStore } from '../store/authStore';

export const DocumentViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const documentId = id || '';
  const navigate = useNavigate();
  
  const onNavigate = (page: string, docId?: string) => {
    if (docId) {
      navigate(`/${page}/${docId}`);
    } else {
      navigate(`/${page}`);
    }
  };
  const [showShareModal, setShowShareModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [signerEmail, setSignerEmail] = useState('');
  const [signerName, setSignerName] = useState('');
  const [expiryHours, setExpiryHours] = useState('24');
  const [rejectionReason, setRejectionReason] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [previewZoom, setPreviewZoom] = useState(100);

  const { user } = useAuthStore();
  const { 
    getDocument, 
    getDocumentFile,
    getSignedDocumentFile,
    getDocumentSignatures, 
    getDocumentPublicLinks,
    getDocumentAuditLogs,
    createPublicLink,
    updateDocumentStatus,
    deleteDocument,
    addAuditLog,
    signatureFields
  } = useDocumentStore();

  const document = getDocument(documentId);
  const documentFile = getDocumentFile(documentId);
  const signedDocumentFile = getSignedDocumentFile(documentId);
  const signatures = getDocumentSignatures(documentId);
  // Get completed signature fields for display
  const completedSignatureFields = signatureFields.filter(f => f.documentId === documentId && f.status === 'COMPLETED');
  const publicLinks = getDocumentPublicLinks(documentId);
  const auditLogs = getDocumentAuditLogs(documentId);

  // Check file type
  const isPDF = documentFile?.startsWith('data:application/pdf');
  const isImage = documentFile?.startsWith('data:image/');

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <FileText className="w-16 h-16 text-slate-600 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Document not found</h2>
        <p className="text-slate-400 mb-6">The document you're looking for doesn't exist.</p>
        <Button onClick={() => onNavigate('documents')}>Back to Documents</Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SIGNED':
        return <Badge variant="success" size="md">Signed</Badge>;
      case 'PENDING':
        return <Badge variant="warning" size="md">Pending</Badge>;
      case 'REJECTED':
        return <Badge variant="danger" size="md">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
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

  const handleCreatePublicLink = () => {
    if (!signerEmail || !signerName) return;
    
    const link = createPublicLink(documentId, signerEmail, signerName, parseInt(expiryHours));
    const publicUrl = `${window.location.origin}/sign/${link.token}`;
    setGeneratedLink(publicUrl);
    setSignerEmail('');
    setSignerName('');
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(generatedLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleReject = () => {
    updateDocumentStatus(documentId, 'REJECTED', rejectionReason);
    addAuditLog({
      documentId,
      documentName: document.name,
      action: 'REJECTED',
      performedBy: user?.name || 'Unknown',
      performerEmail: user?.email || '',
      details: rejectionReason
    });
    setShowRejectModal(false);
    setRejectionReason('');
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      deleteDocument(documentId);
      onNavigate('documents');
    }
  };

  const handleDownload = () => {
    // Use signed document if available, otherwise original
    const fileToDownload = signedDocumentFile || documentFile;
    if (fileToDownload) {
      const link = window.document.createElement('a');
      link.href = fileToDownload;
      // Add "signed_" prefix if downloading signed version
      const fileName = signedDocumentFile 
        ? `signed_${document.name.replace(/\.[^/.]+$/, '')}.png`
        : document.name;
      link.download = fileName;
      link.click();
    }
  };

  const completedSignatures = signatures.filter(s => s.status === 'COMPLETED');

  // Render document preview
  const renderDocumentPreview = (fullSize: boolean = false) => {
    const minHeight = fullSize ? '70vh' : '500px';
    
    // If we have a signed document, show that instead
    if (signedDocumentFile) {
      return (
        <div className="relative bg-white rounded shadow-lg p-2 inline-block">
          <img 
            src={signedDocumentFile} 
            alt="Signed Document" 
            className="max-w-full h-auto"
            style={{ maxHeight: fullSize ? '75vh' : '600px' }}
          />
          <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
            ✓ Signed Document
          </div>
        </div>
      );
    }
    
    if (isImage && documentFile) {
      return (
        <div className="relative bg-white rounded shadow-lg p-2 inline-block">
          <img 
            src={documentFile} 
            alt="Document Preview" 
            className="max-w-full h-auto"
            style={{ maxHeight: fullSize ? '75vh' : '600px' }}
          />
          {/* Overlay signature fields on image */}
          {completedSignatureFields.map((field) => (
            <div
              key={field.id}
              className="absolute border-2 border-emerald-400 rounded bg-white/90 shadow-md overflow-hidden"
              style={{
                left: `${field.x}px`,
                top: `${field.y}px`,
                width: `${field.width}px`,
                height: `${field.height}px`,
              }}
            >
              {field.signatureData && (
                <img 
                  src={field.signatureData} 
                  alt={`Signature by ${field.signerName}`}
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          ))}
          {/* Also show old-style signatures for backwards compatibility */}
          {completedSignatures.map((sig) => (
            <div
              key={sig.id}
              className="absolute border-2 border-emerald-400 rounded bg-white shadow-md overflow-hidden"
              style={{
                left: `${sig.xCoordinate}px`,
                top: `${sig.yCoordinate}px`,
                width: `${sig.width}px`,
                height: `${sig.height}px`,
              }}
            >
              {sig.signatureImage && (
                <img 
                  src={sig.signatureImage} 
                  alt={`Signature by ${sig.signerName}`}
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          ))}
        </div>
      );
    } else if (isPDF) {
      return (
        <div 
          className="flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 rounded-lg"
          style={{ minHeight }}
        >
          <div className="text-center p-8">
            <div className="w-32 h-40 mx-auto mb-6 bg-white rounded-lg shadow-xl flex flex-col items-center justify-center border border-red-200">
              <FileText className="w-16 h-16 text-red-500 mb-2" />
              <span className="text-sm font-bold text-red-600">PDF</span>
            </div>
            <p className="text-gray-800 font-semibold text-xl mb-2">{document.name}</p>
            <p className="text-gray-500">{document.pageCount} page{document.pageCount > 1 ? 's' : ''}</p>
            <p className="text-gray-400 text-sm mt-4">
              {completedSignatures.length > 0 
                ? `${completedSignatures.length} signature(s) applied` 
                : 'No signatures yet'}
            </p>
            <Button 
              variant="secondary" 
              className="mt-6"
              onClick={handleDownload}
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      );
    } else {
      return (
        <div 
          className="flex items-center justify-center bg-slate-700/50 rounded-lg"
          style={{ minHeight }}
        >
          <div className="text-center p-8">
            <FileImage className="w-24 h-24 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-300 font-medium mb-2">{document.name}</p>
            <p className="text-slate-400 text-sm">{document.pageCount} pages</p>
            {!documentFile && (
              <p className="text-slate-500 text-xs mt-4">
                Preview not available - document data not found
              </p>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => onNavigate('documents')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-xl font-semibold text-white">{document.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(document.status)}
              <span className="text-sm text-slate-400">
                Uploaded {formatDate(document.uploadTime)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setShowShareModal(true)}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" onClick={handleDownload} disabled={!documentFile}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          {document.status === 'PENDING' && (
            <>
              <Button onClick={() => navigate(`/sign/${documentId}`)}>
                <PenTool className="w-4 h-4 mr-2" />
                Add Signature
              </Button>
              <Button variant="danger" onClick={() => setShowRejectModal(true)}>
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Preview */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-300">Document Preview</h3>
                <div className="flex items-center gap-2">
                  {isImage && (
                    <>
                      <button
                        onClick={() => setPreviewZoom(Math.max(50, previewZoom - 25))}
                        className="p-1.5 rounded bg-slate-700 text-slate-400 hover:text-white transition-colors"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <span className="text-xs text-slate-400 min-w-[50px] text-center">{previewZoom}%</span>
                      <button
                        onClick={() => setPreviewZoom(Math.min(200, previewZoom + 25))}
                        className="p-1.5 rounded bg-slate-700 text-slate-400 hover:text-white transition-colors"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setShowPreviewModal(true)}
                    className="p-1.5 rounded bg-slate-700 text-slate-400 hover:text-white ml-2 transition-colors"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Preview Container */}
              <div 
                className="bg-slate-800 rounded-lg overflow-auto relative"
                style={{ height: '500px' }}
              >
                <div 
                  className="min-h-full flex items-start justify-center p-4"
                  style={{ 
                    transform: isImage ? `scale(${previewZoom / 100})` : 'none',
                    transformOrigin: 'top center'
                  }}
                >
                  {renderDocumentPreview()}
                </div>
                
                {/* Status overlay */}
                {document.status === 'SIGNED' && (
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-emerald-500/90 backdrop-blur rounded-lg px-3 py-2 shadow-lg">
                    <CheckCircle className="w-5 h-5 text-white" />
                    <span className="text-sm text-white font-medium">Document Signed</span>
                  </div>
                )}
                {document.status === 'REJECTED' && (
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/90 backdrop-blur rounded-lg px-3 py-2 shadow-lg">
                    <XCircle className="w-5 h-5 text-white" />
                    <span className="text-sm text-white font-medium">Document Rejected</span>
                  </div>
                )}
              </div>

              {/* Completed Signatures Summary */}
              {(completedSignatures.length > 0 || completedSignatureFields.length > 0) && (
                <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-400">
                      {completedSignatures.length + completedSignatureFields.length} signature(s) applied
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* Show new-style signature fields */}
                    {completedSignatureFields.map((field) => (
                      <div key={field.id} className="flex items-center gap-3 bg-slate-800/80 rounded-lg p-3">
                        {field.signatureData ? (
                          <div className="w-16 h-10 bg-white rounded border border-slate-600 flex items-center justify-center overflow-hidden">
                            <img 
                              src={field.signatureData} 
                              alt="Signature" 
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-10 bg-slate-700 rounded flex items-center justify-center">
                            <PenTool className="w-4 h-4 text-slate-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">{field.signerName}</p>
                          <p className="text-xs text-slate-400">
                            {field.signedAt ? formatDate(field.signedAt) : 'Just now'}
                          </p>
                        </div>
                      </div>
                    ))}
                    {/* Show old-style signatures for backwards compatibility */}
                    {completedSignatures.map((sig) => (
                      <div key={sig.id} className="flex items-center gap-3 bg-slate-800/80 rounded-lg p-3">
                        {sig.signatureImage ? (
                          <div className="w-16 h-10 bg-white rounded border border-slate-600 flex items-center justify-center overflow-hidden">
                            <img 
                              src={sig.signatureImage} 
                              alt="Signature" 
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-10 bg-slate-700 rounded flex items-center justify-center">
                            <PenTool className="w-4 h-4 text-slate-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">{sig.signerName}</p>
                          <p className="text-xs text-slate-400">
                            {sig.timestamp ? formatDate(sig.timestamp) : 'Just now'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Document Details */}
        <div className="space-y-6">
          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Document Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Owner</p>
                  <p className="text-sm text-white">{document.ownerName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Upload Date</p>
                  <p className="text-sm text-white">{formatDate(document.uploadTime)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                  <Layers className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Size / Pages</p>
                  <p className="text-sm text-white">{formatFileSize(document.fileSize)} • {document.pageCount} pages</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                  {isPDF ? (
                    <FileText className="w-4 h-4 text-red-400" />
                  ) : isImage ? (
                    <ImageIcon className="w-4 h-4 text-blue-400" />
                  ) : (
                    <FileText className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-500">File Type</p>
                  <p className="text-sm text-white">
                    {isPDF ? 'PDF Document' : isImage ? 'Image File' : 'Document'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                  <Hash className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">File Hash (Integrity)</p>
                  <p className="text-sm text-white font-mono truncate" title={document.fileHash}>
                    {document.fileHash.substring(0, 20)}...
                  </p>
                </div>
              </div>
              {document.rejectionReason && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-xs text-red-400 mb-1">Rejection Reason</p>
                  <p className="text-sm text-white">{document.rejectionReason}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Signatures */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Signatures ({signatures.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {signatures.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-400 mb-3">No signatures yet</p>
                  {document.status === 'PENDING' && (
                    <Button size="sm" onClick={() => navigate(`/sign/${documentId}`)}>
                      Add Signature
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {signatures.map((sig) => (
                    <div key={sig.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        sig.status === 'COMPLETED' ? 'bg-emerald-500/20' : 'bg-amber-500/20'
                      }`}>
                        {sig.status === 'COMPLETED' ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{sig.signerName}</p>
                        <p className="text-xs text-slate-500 truncate">{sig.signerEmail}</p>
                      </div>
                      <Badge variant={sig.status === 'COMPLETED' ? 'success' : 'warning'}>
                        {sig.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Public Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sharing Links ({publicLinks.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {publicLinks.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-400 mb-3">No sharing links created</p>
                  <Button size="sm" variant="secondary" onClick={() => setShowShareModal(true)}>
                    Create Link
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {publicLinks.map((link) => (
                    <div key={link.id} className="p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-white truncate">{link.signerName}</p>
                        <Badge variant={link.used ? 'success' : new Date(link.expiresAt) < new Date() ? 'danger' : 'info'}>
                          {link.used ? 'Used' : new Date(link.expiresAt) < new Date() ? 'Expired' : 'Active'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">{link.signerEmail}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Expires: {formatDate(link.expiresAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delete */}
          <Button variant="danger" className="w-full" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Document
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? (
            <p className="text-sm text-slate-400">No activity recorded</p>
          ) : (
            <div className="space-y-3">
              {auditLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="info">{log.action.replace(/_/g, ' ')}</Badge>
                      <span className="text-xs text-slate-500">{formatDate(log.timestamp)}</span>
                    </div>
                    <p className="text-sm text-white mt-1">{log.performedBy}</p>
                    {log.details && <p className="text-xs text-slate-400 mt-1">{log.details}</p>}
                    <p className="text-xs text-slate-500 mt-1">IP: {log.ipAddress}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Share Modal */}
      <Modal isOpen={showShareModal} onClose={() => { setShowShareModal(false); setGeneratedLink(''); }} title="Share Document" size="md">
        <div className="space-y-6">
          <p className="text-sm text-slate-400">
            Create a public signing link to share with signers. They'll receive an email invitation to sign the document.
          </p>
          
          <div className="space-y-4">
            <Input
              label="Signer Name"
              placeholder="Enter signer's name"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              icon={<User className="w-4 h-4" />}
            />
            <Input
              label="Signer Email"
              type="email"
              placeholder="Enter signer's email"
              value={signerEmail}
              onChange={(e) => setSignerEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
            />
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Link Expiry</label>
              <select
                value={expiryHours}
                onChange={(e) => setExpiryHours(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="24">24 hours</option>
                <option value="48">48 hours</option>
                <option value="72">72 hours</option>
                <option value="168">1 week</option>
              </select>
            </div>
          </div>

          {!generatedLink ? (
            <Button className="w-full" onClick={handleCreatePublicLink} disabled={!signerEmail || !signerName}>
              <Link className="w-4 h-4 mr-2" />
              Generate Signing Link
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <p className="text-sm font-medium text-emerald-400">Link Generated!</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={generatedLink}
                    readOnly
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 font-mono"
                  />
                  <Button variant="secondary" onClick={handleCopyLink}>
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <Button variant="secondary" className="w-full" onClick={() => setGeneratedLink('')}>
                Create Another Link
              </Button>
            </div>
          )}
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="Reject Document" size="md">
        <div className="space-y-6">
          <p className="text-sm text-slate-400">
            Please provide a reason for rejecting this document. This action cannot be undone.
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Rejection Reason</label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter the reason for rejection..."
              rows={4}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleReject} disabled={!rejectionReason}>
              Reject Document
            </Button>
          </div>
        </div>
      </Modal>

      {/* Full Preview Modal */}
      <Modal isOpen={showPreviewModal} onClose={() => setShowPreviewModal(false)} title="Document Preview" size="full">
        <div className="h-[80vh] bg-slate-800 rounded-lg overflow-auto flex items-center justify-center p-4">
          {renderDocumentPreview(true)}
        </div>
      </Modal>
    </div>
  );
};
