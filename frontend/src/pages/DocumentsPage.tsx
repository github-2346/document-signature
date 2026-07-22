import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  MoreVertical, 
  Eye, 
  Trash2, 
  Share2,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  Grid,
  List,
  Image
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useDocumentStore } from '../store/documentStore';
import { useAuthStore } from '../store/authStore';
import { cn } from '../utils/cn';

const DocumentThumbnail: React.FC<{ documentId: string; name: string }> = ({ documentId, name }) => {
  const { getDocumentFile } = useDocumentStore();
  const file = getDocumentFile(documentId);
  
  const isPDF = file?.startsWith('data:application/pdf');
  const isImage = file?.startsWith('data:image/');
  
  if (isPDF) {
    return (
      <div className="absolute inset-0 bg-slate-700 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-red-400 mx-auto mb-2" />
          <span className="text-xs text-slate-400 px-2 py-1 bg-slate-800 rounded">PDF</span>
        </div>
      </div>
    );
  }
  
  if (isImage && file) {
    return (
      <img 
        src={file} 
        alt={name} 
        className="absolute inset-0 w-full h-full object-cover"
      />
    );
  }
  
  return (
    <div className="absolute inset-0 bg-slate-700 flex items-center justify-center">
      <Image className="w-12 h-12 text-slate-500" />
    </div>
  );
};

interface DocumentsPageProps {
  onNavigate: (page: string, documentId?: string) => void;
}

export const DocumentsPage: React.FC<DocumentsPageProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  const { user } = useAuthStore();
  const { documents, deleteDocument } = useDocumentStore();

  const userDocs = documents.filter(d => d.ownerId === user?.id);
  
  const filteredDocs = userDocs.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SIGNED':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-amber-400" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SIGNED':
        return <Badge variant="success">Signed</Badge>;
      case 'PENDING':
        return <Badge variant="warning">Pending</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      deleteDocument(id);
    }
    setOpenMenuId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">My Documents</h2>
          <p className="text-sm text-slate-400">{userDocs.length} total documents</p>
        </div>
        <Button onClick={() => onNavigate('upload')}>
          Upload New Document
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
                {['all', 'PENDING', 'SIGNED', 'REJECTED'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      'px-3 py-1.5 text-sm rounded-md transition-colors',
                      statusFilter === status
                        ? status === 'all' ? 'bg-slate-700 text-white' :
                          status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' :
                          status === 'SIGNED' ? 'bg-emerald-500/20 text-emerald-400' :
                          'bg-red-500/20 text-red-400'
                        : 'text-slate-400 hover:text-white'
                    )}
                  >
                    {status === 'all' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-1.5 rounded-md transition-colors',
                    viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  )}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-1.5 rounded-md transition-colors',
                    viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredDocs.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No documents found</h3>
            <p className="text-slate-400 mb-6">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Upload your first document to get started'}
            </p>
            <Button onClick={() => onNavigate('upload')}>
              Upload Document
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocs.map((doc) => (
            <Card key={doc.id} hover className="relative group">
              <CardContent className="p-4">
                <div 
                  className="aspect-[3/4] bg-slate-800 rounded-lg mb-4 cursor-pointer relative overflow-hidden"
                  onClick={() => onNavigate('document-view', doc.id)}
                >
                  <DocumentThumbnail documentId={doc.id} name={doc.name} />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Eye className="w-8 h-8 text-white" />
                  </div>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate" title={doc.name}>
                      {doc.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatDate(doc.uploadTime)} • {doc.pageCount} pages
                    </p>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === doc.id ? null : doc.id)}
                      className="p-1 rounded hover:bg-slate-700 text-slate-400"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {openMenuId === doc.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10">
                        <button
                          onClick={() => { onNavigate('document-view', doc.id); setOpenMenuId(null); }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
                        >
                          <Eye className="w-4 h-4" /> View
                        </button>
                        <button
                          onClick={() => { onNavigate('sign', doc.id); setOpenMenuId(null); }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
                        >
                          <Share2 className="w-4 h-4" /> Add Signature
                        </button>
                        <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">
                          <Download className="w-4 h-4" /> Download
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-700"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  {getStatusBadge(doc.status)}
                  <span className="text-xs text-slate-500">{formatFileSize(doc.fileSize)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Document</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Size</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-800/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{doc.name}</p>
                          <p className="text-xs text-slate-500">{doc.pageCount} pages</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(doc.status)}
                        {getStatusBadge(doc.status)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">{formatDate(doc.uploadTime)}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{formatFileSize(doc.fileSize)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => onNavigate('document-view', doc.id)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onNavigate('sign', doc.id)}>
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(doc.id)}>
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
