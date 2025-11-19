import React, { useEffect, useState } from 'react';
import { getSubjects } from '../services/database';
import { getAnalytics } from '../services/engine';
import { SubjectAnalytics, Subject } from '../types';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, Clock, Target, AlertTriangle, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Dashboard = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [analytics, setAnalytics] = useState<SubjectAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(false);
    try {
      const subs = await getSubjects();
      setSubjects(subs);
      
      if (subs.length > 0) {
        // Load analytics in parallel
        const analyticsPromises = subs.map(sub => getAnalytics(sub.id));
        const data = await Promise.all(analyticsPromises);
        setAnalytics(data);
      }
    } catch (e) {
      console.error("Dashboard load error", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calculate global stats
  const totalTests = analytics.reduce((sum, a) => sum + a.testsTaken, 0);
  const totalSolved = analytics.reduce((sum, a) => sum + a.totalQuestionsSolved, 0);
  const avgAccuracy = analytics.length > 0
    ? analytics.reduce((sum, a) => sum + a.avgAccuracy, 0) / analytics.filter(a => a.testsTaken > 0).length || 0
    : 0;

  const chartData = analytics.map(a => ({
    name: subjects.find(s => s.id === a.subjectId)?.name.substring(0, 4) || a.subjectId,
    accuracy: Math.round(a.avgAccuracy),
    color: subjects.find(s => s.id === a.subjectId)?.color.replace('bg-', '#') // Approximate color mapping for chart
  }));

  if (loading) return <div className="flex h-full items-center justify-center text-gray-500">Loading Dashboard...</div>;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
         <div className="bg-red-100 p-4 rounded-full text-red-600 mb-4">
            <AlertTriangle size={40} />
         </div>
         <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Data</h2>
         <p className="text-gray-600 max-w-md mb-6">We couldn't fetch your subjects. This usually happens if the database policies need to be updated or the connection is lost.</p>
         <button onClick={loadData} className="flex items-center px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors">
            <RefreshCw size={18} className="mr-2"/> Retry Connection
         </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Overview</h2>
          <p className="text-gray-500">Track your progress across all subjects.</p>
        </div>
        <Link 
          to="/practice" 
          className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-brand-500/30 flex items-center"
        >
          Start New Test <ArrowRight size={18} className="ml-2" />
        </Link>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
              <Target size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Avg Accuracy</p>
              <h3 className="text-2xl font-bold text-gray-900">{Math.round(avgAccuracy)}%</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Tests Taken</p>
              <h3 className="text-2xl font-bold text-gray-900">{totalTests}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Questions Solved</p>
              <h3 className="text-2xl font-bold text-gray-900">{totalSolved}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      {analytics.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Subject Performance</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="accuracy" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.accuracy > 70 ? '#10b981' : entry.accuracy > 40 ? '#f59e0b' : '#ef4444'} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Subjects */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4">Subject Breakdown</h3>
        {subjects.length === 0 ? (
           <div className="bg-gray-50 border border-gray-200 border-dashed rounded-xl p-8 text-center">
              <p className="text-gray-500 mb-2">No subjects found.</p>
              <p className="text-sm text-gray-400">If you are an admin, go to the <Link to="/admin" className="text-brand-600 hover:underline">Admin Dashboard</Link> to add subjects.</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map(sub => {
              const stat = analytics.find(a => a.subjectId === sub.id);
              return (
                <div key={sub.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-10 h-10 rounded-lg ${sub.color} bg-opacity-10 flex items-center justify-center text-xl overflow-hidden shadow-sm`}>
                      {sub.icon.startsWith('http') ? (
                          <img src={sub.icon} alt={sub.name} className="w-full h-full object-cover" />
                      ) : (
                          sub.icon
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      (stat?.avgAccuracy || 0) > 70 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {Math.round(stat?.avgAccuracy || 0)}% Accuracy
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900">{sub.name}</h4>
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                      <span>{stat?.testsTaken || 0} Tests</span>
                      <Link to={`/practice?subject=${sub.id}`} className="text-brand-600 hover:underline">Practice</Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;