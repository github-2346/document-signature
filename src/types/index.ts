export interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

export interface Document {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  uploadTime: string;
  status: 'PENDING' | 'SIGNED' | 'REJECTED';
  filePath: string;
  fileHash: string;
  fileSize: number;
  pageCount: number;
  rejectionReason?: string;
  signedFilePath?: string;
}

export interface Signature {
  id: string;
  documentId: string;
  signerId: string;
  signerName: string;
  signerEmail: string;
  pageNumber: number;
  xCoordinate: number;
  yCoordinate: number;
  width: number;
  height: number;
  status: 'PENDING' | 'COMPLETED';
  timestamp?: string;
  signatureImage?: string;
}

export interface SignatureField {
  id: string;
  documentId: string;
  signerId: string;
  signerName: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  status: 'PENDING' | 'COMPLETED';
  signatureData?: string;
  signedAt?: string;
}

export interface PublicSigningLink {
  id: string;
  documentId: string;
  token: string;
  signerEmail: string;
  signerName: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  documentId: string;
  documentName: string;
  action: 'UPLOAD' | 'VIEW' | 'SIGNATURE_PLACED' | 'SIGNED' | 'REJECTED' | 'PUBLIC_LINK_CREATED' | 'PUBLIC_LINK_ACCESSED' | 'DOWNLOADED';
  performedBy: string;
  performerEmail: string;
  timestamp: string;
  ipAddress: string;
  details?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
