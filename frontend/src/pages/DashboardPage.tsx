import React from 'react';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle, 
  TrendingUp, 
  Upload,
  Eye,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useDocumentStore } from '../store/documentStore';
import { useAuthStore } from '../store/authStore';

interface DashboardPageProps {
  onNavigate: (page: string, documentId?: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuthStore();
  const { documents, auditLogs } = useDocumentStore();

  const userDocs = documents.filter(d => d.ownerId === user?.id);
  const pendingDocs = userDocs.filter(d => d.status === 'PENDING');
  const signedDocs = userDocs.filter(d => d.status === 'SIGNED');
  const rejectedDocs = userDocs.filter(d => d.status === 'REJECTED');
  const recentLogs = auditLogs.slice(0, 5);
  const recentDocs = userDocs.slice(0, 5);

  const stats = [
    { 
      label: 'Total Documents', 
      value: userDocs.length, 
      icon: FileText, 
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      change: '+12%'
    },
    { 
      label: 'Pending Signatures', 
      value: pendingDocs.length, 
      icon: Clock, 
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
      change: '-5%'
    },
    { 
      label: 'Signed Documents', 
      value: signedDocs.length, 
      icon: CheckCircle, 
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/20',
      change: '+23%'
    },
    { 
      label: 'Rejected', 
      value: rejectedDocs.length, 
      icon: XCircle, 
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
      change: '-8%'
    },
  ];

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

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'UPLOAD':
        return <Badge variant="info">Upload</Badge>;
      case 'SIGNED':
        return <Badge variant="success">Signed</Badge>;
      case 'VIEW':
        return <Badge variant="default">View</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Rejected</Badge>;
      default:
        return <Badge>{action}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Welcome back, {user?.name}! 👋
            </h2>
            <p className="text-slate-400">
              Here's what's happening with your documents today.
            </p>
          </div>
          <Button onClick={() => onNavigate('upload')} icon={<Upload className="w-4 h-4" />}>
            Upload Document
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="relative overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    <span className="text-xs text-emerald-400">{stat.change}</span>
                    <span className="text-xs text-slate-500">vs last month</span>
                  </div>
                </div>
                <div className={`w-14 h-14 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                  <stat.icon className={`w-7 h-7 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity and Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Documents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Documents</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('documents')}>
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentDocs.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No documents yet</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => onNavigate('upload')}>
                  Upload your first document
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    onClick={() => onNavigate('document-view', doc.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white truncate max-w-[200px]">
                          {doc.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDate(doc.uploadTime)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(doc.status)}
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('audit')}>
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No activity yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg"
                  >
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getActionBadge(log.action)}
                        <span className="text-xs text-slate-500">
                          {formatDate(log.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 truncate">
                        {log.documentName}
                      </p>
                      <p className="text-xs text-slate-500">
                        by {log.performedBy}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => onNavigate('upload')}
              className="flex flex-col items-center gap-3 p-6 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-all hover:scale-105"
            >
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Upload className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-sm font-medium text-white">Upload PDF</span>
            </button>
            <button
              onClick={() => onNavigate('documents')}
              className="flex flex-col items-center gap-3 p-6 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-all hover:scale-105"
            >
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="text-sm font-medium text-white">View Documents</span>
            </button>
            <button
              onClick={() => onNavigate('audit')}
              className="flex flex-col items-center gap-3 p-6 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-all hover:scale-105"
            >
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-sm font-medium text-white">Audit Logs</span>
            </button>
            <button
              onClick={() => onNavigate('settings')}
              className="flex flex-col items-center gap-3 p-6 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-all hover:scale-105"
            >
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-amber-400" />
              </div>
              <span className="text-sm font-medium text-white">Settings</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
