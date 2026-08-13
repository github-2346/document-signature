import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Check, 
  X, 
  Pen, 
  Type, 
  Upload,
  ZoomIn,
  ZoomOut,
  Move,
  CheckCircle,
  Trash2
} from 'lucide-react';
import { useDocumentStore } from '../store/documentStore';
import { useAuthStore } from '../store/authStore';
import { SignatureField } from '../types';

type SignatureMode = 'draw' | 'type' | 'upload';

interface DragState {
  isDragging: boolean;
  fieldId: string | null;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

const SignaturePage: React.FC = () => {
  const { id: documentId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    getDocument, 
    getDocumentFile, 
    getSignatureFields,
    addSignatureFieldV2,
    updateSignatureField,
    deleteSignatureField,
    updateDocumentStatus,
    updateSignedDocument,
    addAuditLog
  } = useDocumentStore();

  const document = documentId ? getDocument(documentId) : null;
  const documentFile = documentId ? getDocumentFile(documentId) : null;
  const signatureFields = documentId ? getSignatureFields(documentId) : [];

  // States
  const [signatureMode, setSignatureMode] = useState<SignatureMode>('draw');
  const [typedSignature, setTypedSignature] = useState('');
  const [drawnSignature, setDrawnSignature] = useState<string | null>(null);
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(null);
  const [currentSignatureImage, setCurrentSignatureImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const documentImageRef = useRef<HTMLImageElement>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Drag state
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    fieldId: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0
  });

  // Initialize canvas
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

  // Load image dimensions when document loads
  useEffect(() => {
    if (documentFile && documentFile.startsWith('data:image')) {
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
        setImageLoaded(true);
      };
      img.src = documentFile;
    }
  }, [documentFile]);

  // Show toast
  const showToastMessage = (message: string) => {
    setShowToast(message);
    setTimeout(() => setShowToast(null), 3000);
  };

  // Canvas drawing functions
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getCanvasCoordinates(e);
    lastPointRef.current = coords;
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing || !canvasRef.current || !lastPointRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoordinates(e);
    
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    
    lastPointRef.current = coords;
  };

  const stopDrawing = () => {
    if (isDrawing && canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      setDrawnSignature(dataUrl);
      setCurrentSignatureImage(dataUrl);
    }
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    setDrawnSignature(null);
    setCurrentSignatureImage(null);
  };

  // Create typed signature image
  const createTypedSignatureImage = (): string | null => {
    if (!typedSignature.trim()) return null;

    const canvas = window.document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'italic 40px "Brush Script MT", "Segoe Script", Georgia, cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedSignature, canvas.width / 2, canvas.height / 2);

    return canvas.toDataURL('image/png');
  };

  // Handle signature upload
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setUploadedSignature(result);
      setCurrentSignatureImage(result);
      showToastMessage('Signature image uploaded!');
    };
    reader.readAsDataURL(file);
  };

  // Apply signature to document
  const applySignatureToDocument = () => {
    if (!documentId || !user) return;

    let signatureImage: string | null = null;

    if (signatureMode === 'draw') {
      signatureImage = drawnSignature;
    } else if (signatureMode === 'type') {
      signatureImage = createTypedSignatureImage();
    } else if (signatureMode === 'upload') {
      signatureImage = uploadedSignature;
    }

    if (!signatureImage) {
      showToastMessage('Please create a signature first!');
      return;
    }

    // Create a new signature field
    const newField: SignatureField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      documentId,
      signatureImage,
      x: 50,
      y: 50,
      width: 200,
      height: 80,
      status: 'PENDING',
      signerName: user.name,
      signerEmail: user.email,
      createdAt: new Date().toISOString()
    };

    addSignatureFieldV2(newField);
    showToastMessage('Signature added! Drag to position it.');
  };

  // Confirm a signature field
  const confirmSignatureField = (fieldId: string) => {
    updateSignatureField(fieldId, { status: 'COMPLETED' });
    showToastMessage('Signature confirmed!');
  };

  // Delete a signature field
  const removeSignatureField = (fieldId: string) => {
    deleteSignatureField(fieldId);
    showToastMessage('Signature removed');
  };

  // Drag handlers
  const handleFieldMouseDown = (e: React.MouseEvent | React.TouchEvent, fieldId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const field = signatureFields.find(f => f.id === fieldId);
    if (!field || field.status === 'COMPLETED') return;

    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    setDragState({
      isDragging: true,
      fieldId,
      startX: clientX,
      startY: clientY,
      offsetX: field.x,
      offsetY: field.y
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragState.isDragging || !dragState.fieldId || !containerRef.current) return;

    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const deltaX = (clientX - dragState.startX) / zoom;
    const deltaY = (clientY - dragState.startY) / zoom;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width / zoom;
    const containerHeight = containerRect.height / zoom;

    const field = signatureFields.find(f => f.id === dragState.fieldId);
    if (!field) return;

    let newX = dragState.offsetX + deltaX;
    let newY = dragState.offsetY + deltaY;

    // Clamp to container bounds
    newX = Math.max(0, Math.min(newX, containerWidth - field.width));
    newY = Math.max(0, Math.min(newY, containerHeight - field.height));

    updateSignatureField(dragState.fieldId, { x: newX, y: newY });
  }, [dragState, zoom, signatureFields, updateSignatureField]);

  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging) {
      setDragState({
        isDragging: false,
        fieldId: null,
        startX: 0,
        startY: 0,
        offsetX: 0,
        offsetY: 0
      });
    }
  }, [dragState.isDragging]);

  // Add global event listeners for drag
  useEffect(() => {
    if (dragState.isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleMouseMove);
        window.removeEventListener('touchend', handleMouseUp);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  // Generate signed document with embedded signatures
  const generateSignedDocument = async (): Promise<string | null> => {
    if (!documentFile || !documentId) return null;

    const completedFields = signatureFields.filter(f => f.status === 'COMPLETED');
    if (completedFields.length === 0) return null;

    // For images, we can embed signatures directly
    if (documentFile.startsWith('data:image')) {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = window.document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }

          // Draw original image
          ctx.drawImage(img, 0, 0);

          // Calculate scale from container to actual image
          const container = containerRef.current;
          if (!container) {
            resolve(null);
            return;
          }

          const containerWidth = container.offsetWidth;
          const containerHeight = container.offsetHeight;
          const scaleX = img.width / containerWidth;
          const scaleY = img.height / containerHeight;

          // Draw each completed signature
          let signaturesDrawn = 0;
          const totalSignatures = completedFields.length;

          completedFields.forEach((field) => {
            const sigImg = new Image();
            sigImg.crossOrigin = 'anonymous';
            sigImg.onload = () => {
              // Scale position and size to actual image dimensions
              const actualX = field.x * scaleX;
              const actualY = field.y * scaleY;
              const actualWidth = field.width * scaleX;
              const actualHeight = field.height * scaleY;

              ctx.drawImage(sigImg, actualX, actualY, actualWidth, actualHeight);
              signaturesDrawn++;

              if (signaturesDrawn === totalSignatures) {
                resolve(canvas.toDataURL('image/png'));
              }
            };
            sigImg.onerror = () => {
              signaturesDrawn++;
              if (signaturesDrawn === totalSignatures) {
                resolve(canvas.toDataURL('image/png'));
              }
            };
            sigImg.src = field.signatureImage;
          });
        };
        img.onerror = () => resolve(null);
        img.src = documentFile;
      });
    }

    // For PDFs, return null (PDF embedding would require a library)
    return null;
  };

  // Complete signing
  const completeSigning = async () => {
    if (!documentId || !document || !user) return;

    const pendingFields = signatureFields.filter(f => f.status === 'PENDING');
    
    if (signatureFields.length === 0) {
      showToastMessage('Please add at least one signature!');
      return;
    }

    setIsProcessing(true);

    try {
      // Confirm all pending signatures first
      pendingFields.forEach(field => {
        updateSignatureField(field.id, { status: 'COMPLETED' });
      });

      // Generate signed document
      const signedDoc = await generateSignedDocument();
      
      if (signedDoc) {
        updateSignedDocument(documentId, signedDoc);
      }

      // Update document status
      updateDocumentStatus(documentId, 'SIGNED');

      // Add audit log
      addAuditLog({
        documentId,
        documentName: document.name,
        action: 'SIGNED',
        performedBy: user.name,
        performerEmail: user.email,
        details: `Document signed with ${signatureFields.length} signature(s)`
      });

      showToastMessage('Document signed successfully!');
      
      setTimeout(() => {
        navigate(`/documents/${documentId}`);
      }, 1500);
    } catch (error) {
      console.error('Error completing signing:', error);
      showToastMessage('Error completing signing. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Download signed document
  const downloadSignedDocument = async () => {
    if (!document) return;

    setIsProcessing(true);
    
    try {
      const signedDoc = await generateSignedDocument();
      
      if (signedDoc) {
        const link = window.document.createElement('a');
        link.href = signedDoc;
        link.download = `signed_${document.name.replace(/\.[^/.]+$/, '')}.png`;
        link.click();
        showToastMessage('Signed document downloaded!');
      } else if (documentFile) {
        // If no signatures or PDF, download original
        const link = window.document.createElement('a');
        link.href = documentFile;
        link.download = document.name;
        link.click();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (!document || !documentFile) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-lg mb-4">Document not found</div>
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

  const isPDF = documentFile.startsWith('data:application/pdf');
  const isImage = documentFile.startsWith('data:image');
  const completedCount = signatureFields.filter(f => f.status === 'COMPLETED').length;
  const pendingCount = signatureFields.filter(f => f.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Toast */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
          <CheckCircle className="w-5 h-5" />
          {showToast}
        </div>
      )}

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
          <div className="bg-gray-800 rounded-xl p-8 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-white text-lg">Processing...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/documents')}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-300" />
          </button>
          <div>
            <h1 className="text-white font-semibold">{document.name}</h1>
            <p className="text-gray-400 text-sm">
              {completedCount} signed, {pendingCount} pending
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadSignedDocument}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <button
            onClick={completeSigning}
            disabled={signatureFields.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Complete Signing
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Document Preview - Left Side */}
        <div className="flex-1 p-4 overflow-auto bg-gray-950">
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
          </div>

          {/* Document Container */}
          <div className="flex justify-center">
            <div
              ref={containerRef}
              className="relative bg-white rounded-lg shadow-xl overflow-hidden"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
                maxWidth: '100%'
              }}
            >
              {/* Document Preview */}
              {isImage && (
                <img
                  ref={documentImageRef}
                  src={documentFile}
                  alt={document.name}
                  className="max-w-full h-auto"
                  style={{ display: 'block', minWidth: '600px' }}
                  onLoad={(e) => {
                    const img = e.target as HTMLImageElement;
                    setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
                    setImageLoaded(true);
                  }}
                />
              )}

              {isPDF && (
                <div className="w-[600px] h-[800px] flex flex-col items-center justify-center bg-gray-100 p-8">
                  <div className="text-red-600 text-6xl mb-4">📄</div>
                  <h3 className="text-gray-800 text-xl font-semibold mb-2">{document.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">PDF Document</p>
                  <p className="text-gray-500 text-xs">
                    Drag signatures to position them on this document
                  </p>
                </div>
              )}

              {/* Signature Fields Overlay */}
              {signatureFields.map((field) => (
                <div
                  key={field.id}
                  className={`absolute cursor-move border-2 rounded-lg overflow-hidden transition-all ${
                    field.status === 'COMPLETED'
                      ? 'border-green-500 bg-green-500/10'
                      : dragState.fieldId === field.id
                      ? 'border-blue-500 bg-blue-500/20 shadow-xl scale-105'
                      : 'border-yellow-500 bg-yellow-500/10 hover:border-yellow-400'
                  }`}
                  style={{
                    left: field.x,
                    top: field.y,
                    width: field.width,
                    height: field.height,
                    zIndex: dragState.fieldId === field.id ? 100 : 10
                  }}
                  onMouseDown={(e) => handleFieldMouseDown(e, field.id)}
                  onTouchStart={(e) => handleFieldMouseDown(e, field.id)}
                >
                  {/* Signature Image */}
                  <img
                    src={field.signatureImage}
                    alt="Signature"
                    className="w-full h-full object-contain pointer-events-none"
                    draggable={false}
                  />

                  {/* Status Badge */}
                  {field.status === 'COMPLETED' && (
                    <div className="absolute top-1 left-1 bg-green-600 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Signed
                    </div>
                  )}

                  {/* Action Buttons for Pending */}
                  {field.status === 'PENDING' && (
                    <div className="absolute top-1 right-1 flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          confirmSignatureField(field.id);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        className="p-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md shadow-lg"
                        title="Confirm signature"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          removeSignatureField(field.id);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md shadow-lg"
                        title="Remove signature"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Drag Handle for Pending */}
                  {field.status === 'PENDING' && (
                    <div className="absolute bottom-1 left-1 text-xs text-gray-600 bg-white/80 px-2 py-0.5 rounded flex items-center gap-1">
                      <Move className="w-3 h-3" />
                      Drag to move
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Signature Panel - Right Side */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-white font-semibold text-lg">Add Signature</h2>
            <p className="text-gray-400 text-sm">Create and place your signature</p>
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

          {/* Signature Content */}
          <div className="flex-1 p-4 overflow-auto">
            {/* Draw Mode */}
            {signatureMode === 'draw' && (
              <div className="space-y-4">
                <p className="text-gray-400 text-sm">Draw your signature below:</p>
                <div className="bg-white rounded-lg overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={300}
                    height={150}
                    className="w-full cursor-crosshair touch-none"
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
                  className="w-full py-2 text-sm text-gray-400 hover:text-white border border-gray-600 rounded-lg hover:border-gray-500"
                >
                  Clear & Redraw
                </button>
              </div>
            )}

            {/* Type Mode */}
            {signatureMode === 'type' && (
              <div className="space-y-4">
                <p className="text-gray-400 text-sm">Type your name:</p>
                <input
                  type="text"
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {typedSignature && (
                  <div className="bg-white rounded-lg p-4">
                    <p
                      className="text-center text-3xl text-blue-900"
                      style={{ fontFamily: '"Brush Script MT", "Segoe Script", Georgia, cursive', fontStyle: 'italic' }}
                    >
                      {typedSignature}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Upload Mode */}
            {signatureMode === 'upload' && (
              <div className="space-y-4">
                <p className="text-gray-400 text-sm">Upload a signature image:</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSignatureUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-8 border-2 border-dashed border-gray-600 rounded-lg hover:border-blue-500 transition-colors flex flex-col items-center gap-2"
                >
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-gray-400 text-sm">Click to upload</span>
                  <span className="text-gray-500 text-xs">PNG, JPG up to 5MB</span>
                </button>
                {uploadedSignature && (
                  <div className="bg-white rounded-lg p-4">
                    <img
                      src={uploadedSignature}
                      alt="Uploaded signature"
                      className="max-w-full h-auto max-h-32 mx-auto"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Apply Button */}
            <button
              onClick={applySignatureToDocument}
              disabled={
                (signatureMode === 'draw' && !drawnSignature) ||
                (signatureMode === 'type' && !typedSignature.trim()) ||
                (signatureMode === 'upload' && !uploadedSignature)
              }
              className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
            >
              Add Signature to Document
            </button>
          </div>

          {/* Signature Fields Summary */}
          {signatureFields.length > 0 && (
            <div className="border-t border-gray-700 p-4">
              <h3 className="text-white font-medium mb-3">Placed Signatures ({signatureFields.length})</h3>
              <div className="space-y-2 max-h-40 overflow-auto">
                {signatureFields.map((field, index) => (
                  <div
                    key={field.id}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      field.status === 'COMPLETED' ? 'bg-green-900/30' : 'bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={field.signatureImage}
                        alt={`Signature ${index + 1}`}
                        className="w-12 h-8 object-contain bg-white rounded"
                      />
                      <div>
                        <p className="text-white text-sm">Signature {index + 1}</p>
                        <p className="text-gray-400 text-xs">
                          {field.status === 'COMPLETED' ? '✓ Confirmed' : 'Pending'}
                        </p>
                      </div>
                    </div>
                    {field.status === 'PENDING' && (
                      <button
                        onClick={() => removeSignatureField(field.id)}
                        className="p-1 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="p-4 bg-gray-900 border-t border-gray-700">
            <p className="text-gray-400 text-xs">
              💡 Click ✓ on the signature to confirm. Click "Complete Signing" when done.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignaturePage;
