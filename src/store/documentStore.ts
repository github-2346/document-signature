import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Document, Signature, SignatureField, PublicSigningLink, AuditLog } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface DocumentStore {
  documents: Document[];
  signatures: Signature[];
  signatureFields: SignatureField[];
  publicLinks: PublicSigningLink[];
  auditLogs: AuditLog[];
  documentFiles: Record<string, string>; // documentId -> base64 content
  signedDocumentFiles: Record<string, string>; // documentId -> base64 content of signed version
  
  // Document operations
  uploadDocument: (file: File, ownerId: string, ownerName: string) => Promise<Document>;
  getDocument: (id: string) => Document | undefined;
  getDocumentFile: (id: string) => string | undefined;
  getSignedDocumentFile: (id: string) => string | undefined;
  getUserDocuments: (userId: string) => Document[];
  getAllDocuments: () => Document[];
  updateDocumentStatus: (id: string, status: Document['status'], rejectionReason?: string) => void;
  deleteDocument: (id: string) => void;
  updateSignedDocument: (id: string, signedContent: string) => void;
  
  // Signature operations
  addSignatureField: (signature: Omit<Signature, 'id' | 'status'>) => Signature;
  getDocumentSignatures: (documentId: string) => Signature[];
  completeSignature: (signatureId: string, signatureImage: string) => void;
  removeSignature: (signatureId: string) => void;
  
  // Signature field operations (for drag & drop)
  addSignatureFieldV2: (field: SignatureField) => void;
  updateSignatureField: (fieldId: string, updates: Partial<SignatureField>) => void;
  deleteSignatureField: (fieldId: string) => void;
  getSignatureFields: (documentId: string) => SignatureField[];
  
  // Public link operations
  createPublicLink: (documentId: string, signerEmail: string, signerName: string, expiryHours: number) => PublicSigningLink;
  validatePublicLink: (token: string) => PublicSigningLink | null;
  markLinkUsed: (token: string) => void;
  getDocumentPublicLinks: (documentId: string) => PublicSigningLink[];
  
  // Audit operations
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp' | 'ipAddress'>) => void;
  getDocumentAuditLogs: (documentId: string) => AuditLog[];
  getAllAuditLogs: () => AuditLog[];
}

// Generate file hash simulation
const generateHash = (content: string): string => {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `sha256_${Math.abs(hash).toString(16).padStart(16, '0')}`;
};

export const useDocumentStore = create<DocumentStore>()(
  persist(
    (set, get) => ({
      documents: [],
      signatures: [],
      signatureFields: [],
      publicLinks: [],
      auditLogs: [],
      documentFiles: {},
      signedDocumentFiles: {},

      uploadDocument: async (file: File, ownerId: string, ownerName: string) => {
        // Convert file to base64 for storage and preview
        const base64Content = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        const docId = `doc_${uuidv4()}`;
        
        const newDocument: Document = {
          id: docId,
          name: file.name,
          ownerId,
          ownerName,
          uploadTime: new Date().toISOString(),
          status: 'PENDING',
          filePath: `/uploads/${file.name}`,
          fileHash: generateHash(base64Content + Date.now()),
          fileSize: file.size,
          pageCount: Math.floor(Math.random() * 5) + 1, // Simulated page count (1-5 pages)
        };

        set((state) => ({
          documents: [...state.documents, newDocument],
          documentFiles: { ...state.documentFiles, [docId]: base64Content },
        }));

        // Add audit log
        get().addAuditLog({
          documentId: newDocument.id,
          documentName: newDocument.name,
          action: 'UPLOAD',
          performedBy: ownerName,
          performerEmail: ownerId,
        });

        return newDocument;
      },

      getDocument: (id: string) => {
        return get().documents.find((d) => d.id === id);
      },

      getDocumentFile: (id: string) => {
        return get().documentFiles[id];
      },

      getSignedDocumentFile: (id: string) => {
        return get().signedDocumentFiles[id];
      },

      updateSignedDocument: (id: string, signedContent: string) => {
        set((state) => ({
          signedDocumentFiles: { ...state.signedDocumentFiles, [id]: signedContent },
        }));
      },

      getUserDocuments: (userId: string) => {
        return get().documents.filter((d) => d.ownerId === userId);
      },

      getAllDocuments: () => {
        return get().documents;
      },

      updateDocumentStatus: (id: string, status: Document['status'], rejectionReason?: string) => {
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === id
              ? { ...d, status, rejectionReason: rejectionReason || d.rejectionReason }
              : d
          ),
        }));
      },

      deleteDocument: (id: string) => {
        set((state) => {
          const newDocumentFiles = { ...state.documentFiles };
          delete newDocumentFiles[id];
          return {
            documents: state.documents.filter((d) => d.id !== id),
            signatures: state.signatures.filter((s) => s.documentId !== id),
            publicLinks: state.publicLinks.filter((l) => l.documentId !== id),
            documentFiles: newDocumentFiles,
          };
        });
      },

      addSignatureField: (signature) => {
        const newSignature: Signature = {
          ...signature,
          id: `sig_${uuidv4()}`,
          status: 'PENDING',
        };

        set((state) => ({
          signatures: [...state.signatures, newSignature],
        }));

        get().addAuditLog({
          documentId: signature.documentId,
          documentName: get().getDocument(signature.documentId)?.name || 'Unknown',
          action: 'SIGNATURE_PLACED',
          performedBy: signature.signerName,
          performerEmail: signature.signerEmail,
          details: `Signature field placed on page ${signature.pageNumber}`,
        });

        return newSignature;
      },

      getDocumentSignatures: (documentId: string) => {
        return get().signatures.filter((s) => s.documentId === documentId);
      },

      completeSignature: (signatureId: string, signatureImage: string) => {
        const signature = get().signatures.find((s) => s.id === signatureId);
        
        set((state) => ({
          signatures: state.signatures.map((s) =>
            s.id === signatureId
              ? { ...s, status: 'COMPLETED', signatureImage, timestamp: new Date().toISOString() }
              : s
          ),
        }));

        if (signature) {
          const document = get().getDocument(signature.documentId);
          const allSignatures = get().getDocumentSignatures(signature.documentId);
          const allCompleted = allSignatures.every((s) => 
            s.id === signatureId || s.status === 'COMPLETED'
          );

          if (allCompleted && document) {
            get().updateDocumentStatus(signature.documentId, 'SIGNED');
          }

          get().addAuditLog({
            documentId: signature.documentId,
            documentName: document?.name || 'Unknown',
            action: 'SIGNED',
            performedBy: signature.signerName,
            performerEmail: signature.signerEmail,
            details: `Document signed on page ${signature.pageNumber}`,
          });
        }
      },

      removeSignature: (signatureId: string) => {
        set((state) => ({
          signatures: state.signatures.filter((s) => s.id !== signatureId),
        }));
      },

      // Signature field operations for drag & drop
      addSignatureFieldV2: (field: SignatureField) => {
        set((state) => ({
          signatureFields: [...state.signatureFields, field],
        }));
      },

      updateSignatureField: (fieldId: string, updates: Partial<SignatureField>) => {
        set((state) => ({
          signatureFields: state.signatureFields.map((f) =>
            f.id === fieldId ? { ...f, ...updates } : f
          ),
        }));
      },

      deleteSignatureField: (fieldId: string) => {
        set((state) => ({
          signatureFields: state.signatureFields.filter((f) => f.id !== fieldId),
        }));
      },

      getSignatureFields: (documentId: string) => {
        return get().signatureFields.filter((f) => f.documentId === documentId);
      },

      createPublicLink: (documentId, signerEmail, signerName, expiryHours) => {
        const link: PublicSigningLink = {
          id: `link_${uuidv4()}`,
          documentId,
          token: uuidv4(),
          signerEmail,
          signerName,
          expiresAt: new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString(),
          used: false,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          publicLinks: [...state.publicLinks, link],
        }));

        const document = get().getDocument(documentId);
        get().addAuditLog({
          documentId,
          documentName: document?.name || 'Unknown',
          action: 'PUBLIC_LINK_CREATED',
          performedBy: 'System',
          performerEmail: signerEmail,
          details: `Public signing link created for ${signerName} (${signerEmail})`,
        });

        return link;
      },

      validatePublicLink: (token: string) => {
        const link = get().publicLinks.find((l) => l.token === token);
        if (!link) return null;
        if (link.used) return null;
        if (new Date(link.expiresAt) < new Date()) return null;
        return link;
      },

      markLinkUsed: (token: string) => {
        set((state) => ({
          publicLinks: state.publicLinks.map((l) =>
            l.token === token ? { ...l, used: true } : l
          ),
        }));
      },

      getDocumentPublicLinks: (documentId: string) => {
        return get().publicLinks.filter((l) => l.documentId === documentId);
      },

      addAuditLog: (log) => {
        const newLog: AuditLog = {
          ...log,
          id: `audit_${uuidv4()}`,
          timestamp: new Date().toISOString(),
          ipAddress: '192.168.1.' + Math.floor(Math.random() * 255),
        };

        set((state) => ({
          auditLogs: [newLog, ...state.auditLogs],
        }));
      },

      getDocumentAuditLogs: (documentId: string) => {
        return get().auditLogs.filter((l) => l.documentId === documentId);
      },

      getAllAuditLogs: () => {
        return get().auditLogs;
      },
    }),
    {
      name: 'docusign-document-storage',
    }
  )
);
