import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login, isAuthenticated, getCurrentUser } from '../services/auth';
import { Lock, User, ArrowRight, Activity, CheckCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated()) {
      const user = getCurrentUser();
      if (user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const { user, error: authError } = await login(email, password);
    
    setIsLoading(false);

    if (user) {
        if (user.role === 'admin') {
            navigate('/admin');
        } else {
            navigate('/');
        }
    } else {
        setError(authError || 'Invalid credentials.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header Section */}
        <div className="bg-brand-600 p-8 text-center">
          <div className="mx-auto bg-white/20 w-16 h-16 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
            <Activity className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-brand-100 mt-2">Sign in to MasterMCQ</p>
        </div>

        {/* Form Section */}
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start">
                <div className="text-red-500 mr-2 mt-0.5">
                  <Activity size={16} className="rotate-45" />
                </div>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full bg-brand-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-brand-500/30 hover:bg-brand-700 transition-all transform hover:-translate-y-0.5 flex items-center justify-center ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing In...
                </span>
              ) : (
                <span className="flex items-center">
                  Sign In <ArrowRight size={18} className="ml-2" />
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Default Supabase Login required.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
