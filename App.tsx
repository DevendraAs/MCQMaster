import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { BarChart, Activity, BookOpen, User, Shield } from 'lucide-react';
import Dashboard from './components/Dashboard';
import TestConfig from './components/TestConfig';
import ActiveTest from './components/ActiveTest';
import TestReview from './components/TestReview';
import Profile from './components/Profile';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import { getUserProfile } from './services/engine';
import { isAdmin, getCurrentUser, isAuthenticated } from './services/auth';
import { UserProfile } from './types';

const SidebarItem = ({ icon: Icon, label, to, active }: any) => (
  <Link
    to={to}
    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
      active 
        ? 'bg-brand-100 text-brand-600' 
        : 'text-gray-600 hover:bg-gray-100'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
};

const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isAdmin()) {
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
};

const Layout = ({ children }: { children?: React.ReactNode }) => {
  const location = useLocation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const user = getCurrentUser();

  useEffect(() => {
    const loadProfile = async () => {
      if (isAuthenticated()) {
        const p = await getUserProfile();
        setProfile(p);
      }
    };
    loadProfile();
  }, [location.pathname]);

  // Hide sidebar on login page
  if (location.pathname === '/login') {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-brand-600 flex items-center">
            <Activity className="mr-2" /> MasterMCQ
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <SidebarItem 
            icon={BarChart} 
            label="Dashboard" 
            to="/" 
            active={location.pathname === '/'} 
          />
          <SidebarItem 
            icon={BookOpen} 
            label="Practice" 
            to="/practice" 
            active={location.pathname.startsWith('/practice') || location.pathname.startsWith('/test')} 
          />
          <SidebarItem 
            icon={User} 
            label="Profile" 
            to="/profile" 
            active={location.pathname === '/profile'} 
          />
          {user?.role === 'admin' && (
             <SidebarItem 
                icon={Shield} 
                label="Admin" 
                to="/admin" 
                active={location.pathname === '/admin'} 
            />
          )}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-orange-800">Daily Streak</span>
              <span className="text-lg font-bold text-orange-600">🔥 {profile?.streak || 0}</span>
            </div>
            <div className="w-full bg-orange-200 rounded-full h-2 mt-2">
              <div className="bg-orange-500 h-2 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <header className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-10">
             <h1 className="text-xl font-bold text-brand-600 flex items-center">
              <Activity className="mr-2" size={20}/> MasterMCQ
            </h1>
        </header>
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/practice" element={<ProtectedRoute><TestConfig /></ProtectedRoute>} />
          <Route path="/test/:subjectId" element={<ProtectedRoute><ActiveTest /></ProtectedRoute>} />
          <Route path="/review/:sessionId" element={<ProtectedRoute><TestReview /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={
              <ProtectedAdminRoute>
                  <AdminDashboard />
              </ProtectedAdminRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;