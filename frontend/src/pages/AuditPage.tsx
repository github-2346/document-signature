import React, { useState } from 'react';
import { 
  Search, 
  Download, 
  Calendar,
  User,
  FileText,
  Globe,
  Clock
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useDocumentStore } from '../store/documentStore';
import { cn } from '../utils/cn';

export const AuditPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all');

  const { auditLogs } = useDocumentStore();

  const filterByDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    switch (dateRange) {
      case 'today':
        return date.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return date >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return date >= monthAgo;
      default:
        return true;
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.documentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.performedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.performerEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesDate = filterByDate(log.timestamp);
    return matchesSearch && matchesAction && matchesDate;
  });

  const getActionBadge = (action: string) => {
    const variants: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'default'> = {
      'UPLOAD': 'info',
      'VIEW': 'default',
      'SIGNATURE_PLACED': 'warning',
      'SIGNED': 'success',
      'REJECTED': 'danger',
      'PUBLIC_LINK_CREATED': 'info',
      'PUBLIC_LINK_ACCESSED': 'default',
      'DOWNLOADED': 'info',
    };
    return <Badge variant={variants[action] || 'default'}>{action.replace(/_/g, ' ')}</Badge>;
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'UPLOAD':
        return <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center"><FileText className="w-4 h-4 text-blue-400" /></div>;
      case 'SIGNED':
        return <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center"><FileText className="w-4 h-4 text-emerald-400" /></div>;
      case 'REJECTED':
        return <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center"><FileText className="w-4 h-4 text-red-400" /></div>;
      default:
        return <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center"><Clock className="w-4 h-4 text-slate-400" /></div>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const actionTypes = ['all', 'UPLOAD', 'VIEW', 'SIGNATURE_PLACED', 'SIGNED', 'REJECTED', 'PUBLIC_LINK_CREATED'];

  const groupedLogs: Record<string, typeof auditLogs> = {};
  filteredLogs.forEach(log => {
    const date = new Date(log.timestamp).toDateString();
    if (!groupedLogs[date]) {
      groupedLogs[date] = [];
    }
    groupedLogs[date].push(log);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Audit Logs</h2>
          <p className="text-sm text-slate-400">{auditLogs.length} total entries</p>
        </div>
        <Button variant="secondary">
          <Download className="w-4 h-4 mr-2" />
          Export Logs
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by document, user, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
                {(['all', 'today', 'week', 'month'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={cn(
                      'px-3 py-1.5 text-sm rounded-md transition-colors capitalize',
                      dateRange === range
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-white'
                    )}
                  >
                    {range === 'all' ? 'All Time' : range}
                  </button>
                ))}
              </div>
              
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {actionTypes.map((action) => (
                  <option key={action} value={action}>
                    {action === 'all' ? 'All Actions' : action.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredLogs.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Clock className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No audit logs found</h3>
            <p className="text-slate-400">
              {searchQuery || actionFilter !== 'all' || dateRange !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Activity will appear here as users interact with documents'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedLogs).map(([date, logs]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-medium text-slate-400">{date}</h3>
                <div className="flex-1 h-px bg-slate-800" />
              </div>
              
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-700">
                    {logs.map((log) => (
                      <div key={log.id} className="p-4 hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-start gap-4">
                          {getActionIcon(log.action)}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              {getActionBadge(log.action)}
                              <span className="text-xs text-slate-500">
                                {formatDate(log.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-white font-medium truncate">
                              {log.documentName}
                            </p>
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {log.performedBy}
                              </span>
                              <span className="flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {log.ipAddress}
                              </span>
                            </div>
                            {log.details && (
                              <p className="mt-2 text-sm text-slate-400 bg-slate-800/50 rounded px-2 py-1">
                                {log.details}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-white">
              {auditLogs.filter(l => l.action === 'UPLOAD').length}
            </p>
            <p className="text-sm text-slate-400 mt-1">Uploads</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-white">
              {auditLogs.filter(l => l.action === 'SIGNED').length}
            </p>
            <p className="text-sm text-slate-400 mt-1">Signatures</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-white">
              {auditLogs.filter(l => l.action === 'VIEW').length}
            </p>
            <p className="text-sm text-slate-400 mt-1">Views</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-white">
              {auditLogs.filter(l => l.action === 'PUBLIC_LINK_CREATED').length}
            </p>
            <p className="text-sm text-slate-400 mt-1">Shared Links</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
