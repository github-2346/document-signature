import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { UploadPage } from './pages/UploadPage';
import { DocumentViewPage } from './pages/DocumentViewPage';
import { SignaturePage } from './pages/SignaturePage';
import { AuditPage } from './pages/AuditPage';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';

// Auth wrapper for protected routes
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Layout wrapper with sidebar and header
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigate = (page: string, documentId?: string) => {
    if (documentId) {
      // Handle special page names
      if (page === 'document-view') {
        navigate(`/documents/${documentId}`);
      } else {
        navigate(`/${page}/${documentId}`);
      }
    } else {
      navigate(`/${page}`);
    }
    setSidebarOpen(false);
  };

  // Get page title based on route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') {
      return { title: 'Dashboard', subtitle: 'Overview of your documents and activity' };
    }
    if (path === '/documents') {
      return { title: 'Documents', subtitle: 'Manage your documents' };
    }
    if (path === '/upload') {
      return { title: 'Upload', subtitle: 'Upload new documents for signing' };
    }
    if (path.startsWith('/documents/')) {
      return { title: 'Document Details', subtitle: 'View and manage document' };
    }
    if (path.startsWith('/sign/')) {
      return { title: 'Sign Document', subtitle: 'Add your signature' };
    }
    if (path === '/audit') {
      return { title: 'Audit Logs', subtitle: 'Track all document activity' };
    }
    if (path === '/settings') {
      return { title: 'Settings', subtitle: 'Manage your account settings' };
    }
    if (path === '/users') {
      return { title: 'Users', subtitle: 'Manage system users' };
    }
    return { title: 'DocuSign Pro', subtitle: '' };
  };

  // Get current page for sidebar
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'dashboard';
    if (path.startsWith('/documents')) return 'documents';
    if (path === '/upload') return 'upload';
    if (path.startsWith('/sign/')) return 'documents';
    if (path === '/audit') return 'audit';
    if (path === '/settings') return 'settings';
    if (path === '/users') return 'users';
    return 'dashboard';
  };

  const pageInfo = getPageTitle();

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform lg:relative lg:translate-x-0 transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar currentPage={getCurrentPage()} onNavigate={handleNavigate} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Header
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

// Auth pages wrapper
const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// Pages that use the navigate pattern
const DashboardPageWrapper: React.FC = () => {
  const navigate = useNavigate();
  const handleNavigate = (page: string, documentId?: string) => {
    if (documentId) {
      if (page === 'document-view') {
        navigate(`/documents/${documentId}`);
      } else {
        navigate(`/${page}/${documentId}`);
      }
    } else {
      navigate(`/${page}`);
    }
  };
  return <DashboardPage onNavigate={handleNavigate} />;
};

const DocumentsPageWrapper: React.FC = () => {
  const navigate = useNavigate();
  const handleNavigate = (page: string, documentId?: string) => {
    if (documentId) {
      if (page === 'document-view') {
        navigate(`/documents/${documentId}`);
      } else {
        navigate(`/${page}/${documentId}`);
      }
    } else {
      navigate(`/${page}`);
    }
  };
  return <DocumentsPage onNavigate={handleNavigate} />;
};

const UploadPageWrapper: React.FC = () => {
  const navigate = useNavigate();
  const handleNavigate = (page: string, documentId?: string) => {
    if (documentId) {
      if (page === 'document-view') {
        navigate(`/documents/${documentId}`);
      } else {
        navigate(`/${page}/${documentId}`);
      }
    } else {
      navigate(`/${page}`);
    }
  };
  return <UploadPage onNavigate={handleNavigate} />;
};

// Settings Page Component
const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Account Settings</h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
            <input
              type="text"
              value={user?.name || ''}
              readOnly
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              readOnly
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
            <input
              type="text"
              value={user?.role || ''}
              readOnly
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Member Since</label>
            <input
              type="text"
              value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}
              readOnly
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100"
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Security</h3>
        <p className="text-sm text-slate-400 mb-4">
          Your password is securely hashed using BCrypt encryption.
        </p>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
          Change Password
        </button>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Notifications</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500" />
            <span className="text-sm text-slate-300">Email me when a document is signed</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500" />
            <span className="text-sm text-slate-300">Email me when a document is rejected</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500" />
            <span className="text-sm text-slate-300">Weekly activity digest</span>
          </label>
        </div>
      </div>
    </div>
  );
};

// Users Page Component (Admin only)
const UsersPage: React.FC = () => {
  const { users } = useAuthStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">System Users</h2>
          <p className="text-sm text-slate-400">{users.length} registered users</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
          Add User
        </button>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">User</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Role</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Created</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {users.map((userRecord) => (
              <tr key={userRecord.user.id} className="hover:bg-slate-800/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {userRecord.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-white">{userRecord.user.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">{userRecord.user.email}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    userRecord.user.role === 'ADMIN' 
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'bg-slate-700 text-slate-300'
                  }`}>
                    {userRecord.user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">
                  {new Date(userRecord.user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-slate-400 hover:text-white text-sm">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Login page with navigation
const LoginPageWrapper: React.FC = () => {
  const navigate = useNavigate();
  return <LoginPage onSwitchToRegister={() => navigate('/register')} />;
};

const RegisterPageWrapper: React.FC = () => {
  const navigate = useNavigate();
  return <RegisterPage onSwitchToLogin={() => navigate('/login')} />;
};

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={
          <AuthLayout>
            <LoginPageWrapper />
          </AuthLayout>
        } />
        <Route path="/register" element={
          <AuthLayout>
            <RegisterPageWrapper />
          </AuthLayout>
        } />
        
        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout>
              <DashboardPageWrapper />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <AppLayout>
              <DashboardPageWrapper />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/documents" element={
          <ProtectedRoute>
            <AppLayout>
              <DocumentsPageWrapper />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/documents/:id" element={
          <ProtectedRoute>
            <AppLayout>
              <DocumentViewPage />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/sign/:id" element={
          <ProtectedRoute>
            <AppLayout>
              <SignaturePage />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/upload" element={
          <ProtectedRoute>
            <AppLayout>
              <UploadPageWrapper />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/audit" element={
          <ProtectedRoute>
            <AppLayout>
              <AuditPage />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <AppLayout>
              <SettingsPage />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/users" element={
          <ProtectedRoute>
            <AppLayout>
              <UsersPage />
            </AppLayout>
          </ProtectedRoute>
        } />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
