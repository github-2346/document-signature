import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocumentStore } from '../store/documentStore';
import { useAuthStore } from '../store/authStore';
import { SignatureField } from '../types';
import { 
  ArrowLeft, 
  Check, 
  X, 
  Move,
  Type,
  Upload,
  Pen,
  GripVertical,
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Download,
  Loader2
} from 'lucide-react';

export const SignaturePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    documents, 
    signatureFields, 
    addSignatureFieldV2, 
    updateSignatureField, 
    deleteSignatureField,
    updateDocumentStatus, 
    getDocumentFile,
    updateSignedDocument,
    getSignedDocumentFile
  } = useDocumentStore();
  
  const document = documents.find(d => d.id === id);
  const docFields = signatureFields.filter((f: SignatureField) => f.documentId === id);
  
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typedSignature, setTypedSignature] = useState('');
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(null);
  const [drawnSignature, setDrawnSignature] = useState<string | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showSignaturePanel, setShowSignaturePanel] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const documentCanvasRef = useRef<HTMLCanvasElement>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  
  // Drag state
  const [dragInfo, setDragInfo] = useState<{
    fieldId: string;
    startX: number;
    startY: number;
    fieldStartX: number;
    fieldStartY: number;
  } | null>(null);

  const documentContent = id ? getDocumentFile(id) : null;
  const signedDocumentContent = id ? getSignedDocumentFile(id) : null;
  const isPdf = document?.name.toLowerCase().endsWith('.pdf');

  // Initialize canvas for drawing signature
  useEffect(() => {
    if (signatureMode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#1e3a8a';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [signatureMode]);

  // Get current signature based on mode
  const getCurrentSignature = useCallback(() => {
    if (signatureMode === 'draw') return drawnSignature;
    if (signatureMode === 'upload') return uploadedSignature;
    if (signatureMode === 'type' && typedSignature.trim()) {
      // Create signature from typed text
      const canvas = window.document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = 'italic 36px "Brush Script MT", "Segoe Script", Georgia, cursive';
        ctx.fillStyle = '#1e3a8a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(typedSignature, 150, 50);
        return canvas.toDataURL('image/png');
      }
    }
    return null;
  }, [signatureMode, drawnSignature, uploadedSignature, typedSignature]);

  // Canvas drawing functions
  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      };
    }
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const coords = getCanvasCoords(e);
    lastPointRef.current = coords;
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current || !lastPointRef.current) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const coords = getCanvasCoords(e);
    
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    
    lastPointRef.current = coords;
  };

  const stopDrawing = () => {
    if (isDrawing && canvasRef.current) {
      setDrawnSignature(canvasRef.current.toDataURL('image/png'));
    }
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setDrawnSignature(null);
      }
    }
  };

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedSignature(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add signature field to document
  const addSignatureToDocument = () => {
    const signature = getCurrentSignature();
    if (!signature || !id || !user) return;
    
    const newField: SignatureField = {
      id: `field-${Date.now()}`,
      documentId: id,
      signerId: user.id,
      signerName: user.name,
      pageNumber: 1,
      x: 50,
      y: 100,
      width: 200,
      height: 80,
      status: 'PENDING',
      signatureData: signature,
      signedAt: new Date().toISOString()
    };
    
    addSignatureFieldV2(newField);
    setSelectedFieldId(newField.id);
    setSuccessMessage('Signature added! Drag to position, then click ✓ to confirm.');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Field drag handlers
  const handleFieldMouseDown = (e: React.MouseEvent | React.TouchEvent, fieldId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const field = docFields.find((f: SignatureField) => f.id === fieldId);
    if (!field || field.status === 'COMPLETED') return;
    
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    setDragInfo({
      fieldId,
      startX: clientX,
      startY: clientY,
      fieldStartX: field.x,
      fieldStartY: field.y
    });
    setSelectedFieldId(fieldId);
  };

  // Global mouse/touch move handler
  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!dragInfo || !containerRef.current) return;
      
      let clientX: number, clientY: number;
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const scale = zoom / 100;
      
      const deltaX = (clientX - dragInfo.startX) / scale;
      const deltaY = (clientY - dragInfo.startY) / scale;
      
      let newX = dragInfo.fieldStartX + deltaX;
      let newY = dragInfo.fieldStartY + deltaY;
      
      // Clamp to container bounds
      const field = docFields.find((f: SignatureField) => f.id === dragInfo.fieldId);
      if (field) {
        const maxX = (rect.width / scale) - field.width;
        const maxY = (rect.height / scale) - field.height;
        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));
      }
      
      updateSignatureField(dragInfo.fieldId, { x: newX, y: newY });
    };

    const handleEnd = () => {
      setDragInfo(null);
    };

    if (dragInfo) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [dragInfo, zoom, docFields, updateSignatureField]);

  // Generate signed document with embedded signatures
  const generateSignedDocument = async (): Promise<string | null> => {
    if (!documentContent || !id) return null;

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Create canvas with document dimensions
        const canvas = window.document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(null);
          return;
        }

        // Draw original document
        ctx.drawImage(img, 0, 0);

        // Get the container dimensions for scaling
        const containerWidth = 800;
        const containerHeight = 600;
        const scaleX = img.width / containerWidth;
        const scaleY = img.height / containerHeight;

        // Track loaded signatures
        const completedFields = docFields.filter((f: SignatureField) => f.status === 'COMPLETED');
        let loadedCount = 0;
        
        if (completedFields.length === 0) {
          resolve(canvas.toDataURL('image/png'));
          return;
        }

        // Draw each signature
        completedFields.forEach((field: SignatureField) => {
          if (field.signatureData) {
            const sigImg = new Image();
            sigImg.crossOrigin = 'anonymous';
            sigImg.onload = () => {
              // Calculate scaled position
              const x = field.x * scaleX;
              const y = field.y * scaleY;
              const width = field.width * scaleX;
              const height = field.height * scaleY;
              
              // Draw signature on document
              ctx.drawImage(sigImg, x, y, width, height);
              
              loadedCount++;
              if (loadedCount === completedFields.length) {
                resolve(canvas.toDataURL('image/png'));
              }
            };
            sigImg.onerror = () => {
              loadedCount++;
              if (loadedCount === completedFields.length) {
                resolve(canvas.toDataURL('image/png'));
              }
            };
            sigImg.src = field.signatureData;
          } else {
            loadedCount++;
            if (loadedCount === completedFields.length) {
              resolve(canvas.toDataURL('image/png'));
            }
          }
        });
      };
      img.onerror = () => {
        resolve(null);
      };
      img.src = documentContent;
    });
  };

  // Complete signature for a field (confirm it)
  const completeSignature = async (fieldId: string) => {
    setIsProcessing(true);
    
    // Update field status to completed
    updateSignatureField(fieldId, { 
      status: 'COMPLETED',
      signedAt: new Date().toISOString()
    });
    
    // Short delay to ensure state is updated
    await new Promise(resolve => setTimeout(resolve, 100));
    
    setSuccessMessage('Signature confirmed! You can add more signatures or complete signing.');
    setTimeout(() => setSuccessMessage(null), 3000);
    setIsProcessing(false);
  };

  // Delete a signature field
  const handleDeleteField = (fieldId: string) => {
    deleteSignatureField(fieldId);
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  };

  // Complete all signing and generate final document
  const completeAllSignatures = async () => {
    if (!id) return;
    
    setIsProcessing(true);
    
    try {
      // Mark all pending fields as completed
      docFields.forEach((field: SignatureField) => {
        if (field.status === 'PENDING') {
          updateSignatureField(field.id, { 
            status: 'COMPLETED',
            signedAt: new Date().toISOString()
          });
        }
      });
      
      // Wait for state update
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Generate the signed document with embedded signatures
      const signedDoc = await generateSignedDocument();
      
      if (signedDoc) {
        updateSignedDocument(id, signedDoc);
      }
      
      // Update document status
      updateDocumentStatus(id, 'SIGNED');
      
      setSuccessMessage('Document signed successfully! Redirecting...');
      
      setTimeout(() => {
        navigate(`/documents/${id}`);
      }, 1500);
    } catch (error) {
      console.error('Error completing signatures:', error);
      setIsProcessing(false);
    }
  };

  // Download signed document
  const downloadSignedDocument = async () => {
    if (!id || !document) return;
    
    setIsProcessing(true);
    
    try {
      let downloadContent = signedDocumentContent;
      
      // If no signed version exists, generate one
      if (!downloadContent) {
        downloadContent = await generateSignedDocument();
        if (downloadContent) {
          updateSignedDocument(id, downloadContent);
        }
      }
      
      if (downloadContent) {
        const link = window.document.createElement('a');
        link.href = downloadContent;
        link.download = `signed_${document.name.replace(/\.[^/.]+$/, '')}.png`;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        
        setSuccessMessage('Document downloaded successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (error) {
      console.error('Error downloading document:', error);
    }
    
    setIsProcessing(false);
  };

  if (!document) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Document not found</p>
          <button
            onClick={() => navigate('/documents')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Documents
          </button>
        </div>
      </div>
    );
  }

  const pendingFields = docFields.filter((f: SignatureField) => f.status === 'PENDING');
  const completedFields = docFields.filter((f: SignatureField) => f.status === 'COMPLETED');
  const canComplete = completedFields.length > 0 || pendingFields.length > 0;

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Success Message Toast */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
          <CheckCircle className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg p-6 flex items-center gap-4">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            <span className="text-white text-lg">Processing...</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/documents')}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-white">{document.name}</h1>
            <p className="text-sm text-gray-400">Add and position your signature</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-700 rounded-lg px-3 py-1">
            <button
              onClick={() => setZoom(z => Math.max(50, z - 10))}
              className="p-1 hover:bg-gray-600 rounded"
            >
              <ZoomOut className="w-4 h-4 text-gray-400" />
            </button>
            <span className="text-sm text-gray-300 w-12 text-center">{zoom}%</span>
            <button
              onClick={() => setZoom(z => Math.min(150, z + 10))}
              className="p-1 hover:bg-gray-600 rounded"
            >
              <ZoomIn className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          
          <button
            onClick={() => setShowSignaturePanel(!showSignaturePanel)}
            className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 text-sm"
          >
            {showSignaturePanel ? 'Hide Panel' : 'Show Panel'}
          </button>

          {completedFields.length > 0 && (
            <button
              onClick={downloadSignedDocument}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Download Signed
            </button>
          )}
          
          <button
            onClick={completeAllSignatures}
            disabled={!canComplete || isProcessing}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            Complete Signing
          </button>
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Document Preview - Takes most space */}
        <div className="flex-1 overflow-auto bg-gray-950 p-4">
          <div 
            ref={containerRef}
            className="relative mx-auto bg-white rounded-lg shadow-2xl overflow-hidden"
            style={{ 
              width: `${800 * zoom / 100}px`,
              minHeight: `${600 * zoom / 100}px`,
            }}
          >
            {/* Document Content */}
            {documentContent ? (
              isPdf ? (
                <div className="w-full min-h-[600px] flex flex-col items-center justify-center bg-gray-100 p-8" style={{ minHeight: `${600 * zoom / 100}px` }}>
                  <FileText className="w-24 h-24 text-red-500 mb-6" />
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{document.name}</h3>
                  <p className="text-gray-600 mb-4">PDF Document</p>
                  <div className="w-full max-w-md bg-white rounded-lg shadow p-6 text-left">
                    <div className="border-b border-gray-200 pb-4 mb-4">
                      <p className="text-sm text-gray-500">Document Details</p>
                    </div>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p><strong>Size:</strong> {(document.fileSize / 1024).toFixed(2)} KB</p>
                      <p><strong>Uploaded:</strong> {new Date(document.uploadTime).toLocaleDateString()}</p>
                      <p><strong>Status:</strong> {document.status}</p>
                    </div>
                  </div>
                  <p className="text-gray-500 mt-6 text-sm">Add your signature by placing it on this document area</p>
                </div>
              ) : (
                <img
                  src={documentContent}
                  alt={document.name}
                  className="w-full h-auto"
                  style={{ minHeight: '600px', objectFit: 'contain', backgroundColor: '#f0f0f0' }}
                  draggable={false}
                />
              )
            ) : (
              <div className="w-full min-h-[600px] flex items-center justify-center bg-gray-100">
                <div className="text-center text-gray-500">
                  <FileText className="w-16 h-16 mx-auto mb-4" />
                  <p>Document preview not available</p>
                </div>
              </div>
            )}

            {/* Signature Fields Overlay */}
            {docFields.map((field: SignatureField) => (
              <div
                key={field.id}
                className={`absolute cursor-move border-2 rounded-lg overflow-hidden transition-shadow ${
                  field.status === 'COMPLETED' 
                    ? 'border-green-500 bg-green-50/90 cursor-default' 
                    : selectedFieldId === field.id
                      ? 'border-blue-500 bg-blue-50/90 shadow-lg'
                      : 'border-yellow-500 bg-yellow-50/90 hover:shadow-lg'
                } ${dragInfo?.fieldId === field.id ? 'shadow-2xl z-50' : 'z-10'}`}
                style={{
                  left: `${field.x * zoom / 100}px`,
                  top: `${field.y * zoom / 100}px`,
                  width: `${field.width * zoom / 100}px`,
                  height: `${field.height * zoom / 100}px`,
                }}
                onMouseDown={(e) => field.status !== 'COMPLETED' && handleFieldMouseDown(e, field.id)}
                onTouchStart={(e) => field.status !== 'COMPLETED' && handleFieldMouseDown(e, field.id)}
              >
                {/* Drag Handle */}
                <div className={`absolute top-0 left-0 right-0 ${field.status === 'COMPLETED' ? 'bg-green-600' : 'bg-gray-800/90'} text-white text-xs py-1 px-2 flex items-center justify-between`}>
                  <div className="flex items-center gap-1">
                    {field.status !== 'COMPLETED' && <GripVertical className="w-3 h-3" />}
                    <span>{field.status === 'COMPLETED' ? '✓ Signed' : 'Drag to move'}</span>
                  </div>
                  {field.status === 'PENDING' && (
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          completeSignature(field.id);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        className="p-1 bg-green-600 hover:bg-green-500 rounded transition-colors"
                        title="Confirm signature"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteField(field.id);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        className="p-1 bg-red-600 hover:bg-red-500 rounded transition-colors"
                        title="Remove signature"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Signature Image */}
                <div className="absolute inset-0 pt-6 p-2 flex items-center justify-center bg-white/80">
                  {field.signatureData ? (
                    <img
                      src={field.signatureData}
                      alt="Signature"
                      className="max-w-full max-h-full object-contain"
                      draggable={false}
                    />
                  ) : (
                    <span className="text-gray-400 text-sm">No signature</span>
                  )}
                </div>
                
                {/* Completed Badge */}
                {field.status === 'COMPLETED' && (
                  <div className="absolute bottom-1 right-1">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Signature Panel - Right Side */}
        {showSignaturePanel && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col overflow-hidden flex-shrink-0">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-1">Create Signature</h2>
              <p className="text-sm text-gray-400">Draw, type, or upload your signature</p>
            </div>

            {/* Signature Mode Tabs */}
            <div className="flex border-b border-gray-700">
              <button
                onClick={() => setSignatureMode('draw')}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
                  signatureMode === 'draw'
                    ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-700/50'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <Pen className="w-4 h-4" />
                Draw
              </button>
              <button
                onClick={() => setSignatureMode('type')}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
                  signatureMode === 'type'
                    ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-700/50'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <Type className="w-4 h-4" />
                Type
              </button>
              <button
                onClick={() => setSignatureMode('upload')}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
                  signatureMode === 'upload'
                    ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-700/50'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <Upload className="w-4 h-4" />
                Upload
              </button>
            </div>

            {/* Signature Input Area */}
            <div className="flex-1 overflow-auto p-4">
              {signatureMode === 'draw' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-400">Draw your signature below:</p>
                  <div className="bg-white rounded-lg overflow-hidden border-2 border-gray-600">
                    <canvas
                      ref={canvasRef}
                      width={280}
                      height={140}
                      className="w-full touch-none cursor-crosshair"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                  </div>
                  <button
                    onClick={clearCanvas}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 text-sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Clear & Redraw
                  </button>
                  {drawnSignature && (
                    <div className="p-3 bg-green-900/30 border border-green-700 rounded-lg">
                      <p className="text-green-400 text-sm flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Signature captured!
                      </p>
                    </div>
                  )}
                </div>
              )}

              {signatureMode === 'type' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-400">Type your name:</p>
                  <input
                    type="text"
                    value={typedSignature}
                    onChange={(e) => setTypedSignature(e.target.value)}
                    placeholder="Type your name..."
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {typedSignature && (
                    <>
                      <div className="bg-white rounded-lg p-4 border-2 border-gray-600">
                        <p className="text-center text-3xl text-blue-900" style={{ fontFamily: '"Brush Script MT", "Segoe Script", Georgia, cursive', fontStyle: 'italic' }}>
                          {typedSignature}
                        </p>
                      </div>
                      <div className="p-3 bg-green-900/30 border border-green-700 rounded-lg">
                        <p className="text-green-400 text-sm flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Signature ready!
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {signatureMode === 'upload' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-400">Upload a signature image:</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="signature-upload"
                  />
                  <label
                    htmlFor="signature-upload"
                    className="block w-full py-8 border-2 border-dashed border-gray-600 rounded-lg hover:border-blue-500 hover:bg-gray-700/50 transition-colors cursor-pointer"
                  >
                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-400 text-center">Click to upload signature image</p>
                    <p className="text-gray-500 text-sm mt-1 text-center">PNG, JPG, or GIF</p>
                  </label>
                  
                  {uploadedSignature && (
                    <>
                      <div className="bg-white rounded-lg p-4 border-2 border-gray-600">
                        <img
                          src={uploadedSignature}
                          alt="Uploaded signature"
                          className="max-w-full max-h-32 mx-auto object-contain"
                        />
                      </div>
                      <label
                        htmlFor="signature-upload"
                        className="block w-full py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 text-sm text-center cursor-pointer"
                      >
                        Choose Different Image
                      </label>
                      <div className="p-3 bg-green-900/30 border border-green-700 rounded-lg">
                        <p className="text-green-400 text-sm flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Signature uploaded!
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Add Signature Button */}
              <button
                onClick={addSignatureToDocument}
                disabled={!getCurrentSignature()}
                className="w-full mt-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
              >
                <Move className="w-5 h-5" />
                Add Signature to Document
              </button>

              {/* Instructions */}
              <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
                <h3 className="text-sm font-medium text-white mb-2">How to sign:</h3>
                <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
                  <li>Create your signature above</li>
                  <li>Click "Add Signature to Document"</li>
                  <li>Drag the signature to position it</li>
                  <li>Click <span className="inline-flex items-center px-1 py-0.5 bg-green-600 rounded text-white text-xs">✓</span> to confirm</li>
                  <li>Click "Complete Signing" when done</li>
                </ol>
              </div>

              {/* Signature Fields Summary */}
              {docFields.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-white mb-3">Signature Fields ({docFields.length})</h3>
                  <div className="space-y-2">
                    {docFields.map((field: SignatureField, index: number) => (
                      <div
                        key={field.id}
                        className={`p-3 rounded-lg border ${
                          field.status === 'COMPLETED'
                            ? 'bg-green-900/20 border-green-700'
                            : 'bg-gray-700 border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-300">Signature {index + 1}</span>
                          {field.status === 'COMPLETED' ? (
                            <span className="text-xs text-green-400 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Confirmed
                            </span>
                          ) : (
                            <span className="text-xs text-yellow-400">Pending Confirmation</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Position: ({Math.round(field.x)}, {Math.round(field.y)})
                        </p>
                        {field.signatureData && (
                          <div className="mt-2 p-1 bg-white rounded">
                            <img 
                              src={field.signatureData} 
                              alt="Signature preview" 
                              className="h-8 object-contain mx-auto"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hidden canvas for document rendering */}
      <canvas ref={documentCanvasRef} className="hidden" />
    </div>
  );
};
