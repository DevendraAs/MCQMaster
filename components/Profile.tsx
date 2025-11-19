import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUserProfile } from '../services/engine';
import { getCurrentUser, logout } from '../services/auth';
import { UserProfile } from '../types';
import { User, Flame, Trophy, Target, Shield, LogOut, LayoutDashboard } from 'lucide-react';

const Profile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [adminUser, setAdminUser] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
        const p = await getUserProfile();
        setProfile(p);
        setAdminUser(getCurrentUser());
    }
    load();
  }, []);

  if (!profile) return <div className="p-8 text-center">Loading Profile...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
          <p className="text-gray-500">Track your learning journey.</p>
        </div>
        {adminUser ? (
           <div className="flex gap-3">
             {adminUser.role === 'admin' && (
                 <Link to="/admin" className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    <LayoutDashboard size={18} className="mr-2"/> Admin Dashboard
                 </Link>
             )}
             <button 
                onClick={async () => { await logout(); setAdminUser(null); window.location.href = '#/login'; }}
                className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
             >
                <LogOut size={18} className="mr-2"/> Logout
             </button>
           </div>
        ) : (
           <Link to="/login" className="text-sm text-gray-500 hover:text-brand-600 flex items-center">
             <Shield size={16} className="mr-1" /> Admin Login
           </Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Main Card */}
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-lg shadow-brand-500/5 flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 mb-4">
            <User size={48} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Student</h2>
          <p className="text-gray-500 mb-6">Level {Math.floor(profile.xp / 100) + 1}</p>
          
          <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
             <div className="bg-brand-500 h-3 rounded-full" style={{ width: `${(profile.xp % 100)}%` }}></div>
          </div>
          <div className="text-xs text-gray-400 w-full flex justify-between">
            <span>{profile.xp % 100} XP</span>
            <span>Next Level: 100 XP</span>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-orange-50 p-6 rounded-xl border border-orange-100 flex flex-col justify-center items-center">
              <Flame className="text-orange-500 mb-2" size={32} />
              <div className="text-3xl font-bold text-orange-700">{profile.streak}</div>
              <div className="text-sm text-orange-600 font-medium">Day Streak</div>
           </div>
           <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100 flex flex-col justify-center items-center">
              <Target className="text-emerald-500 mb-2" size={32} />
              <div className="text-3xl font-bold text-emerald-700">{Math.round(profile.globalAccuracy)}%</div>
              <div className="text-sm text-emerald-600 font-medium">Accuracy</div>
           </div>
           <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex flex-col justify-center items-center">
              <Trophy className="text-blue-500 mb-2" size={32} />
              <div className="text-3xl font-bold text-blue-700">{profile.totalTests}</div>
              <div className="text-sm text-blue-600 font-medium">Tests Completed</div>
           </div>
           <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 flex flex-col justify-center items-center">
              <div className="text-3xl font-bold text-purple-700 mt-2">{profile.xp}</div>
              <div className="text-sm text-purple-600 font-medium">Total XP</div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
