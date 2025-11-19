import React, { useState, useEffect } from 'react';
import { getSubjects, saveSubject, deleteSubject, getQuestionsForSubject, saveQuestion, deleteQuestion, getAllProfiles, updateUserRole, uploadSubjectIcon } from '../services/database';
import { registerUser } from '../services/auth';
import { Subject, Question, Difficulty } from '../types';
import { Plus, Trash2, Edit2, Save, Book, Layers, Users, RefreshCcw, AlertCircle, UserPlus, Upload, X } from 'lucide-react';

// Predefined Tailwind Colors for the Palette
const COLOR_PALETTE = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
  'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
  'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
  'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500',
  'bg-rose-500', 'bg-slate-500', 'bg-gray-500', 'bg-zinc-500'
];

const AdminDashboard = () => {
  const [tab, setTab] = useState<'subjects' | 'questions' | 'users'>('subjects');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  
  // Subject Form States
  const [editingSubject, setEditingSubject] = useState<Partial<Subject>>({});
  const [subjectIconFile, setSubjectIconFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Question Form States
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Partial<Question>>({});

  // New User State
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [userCreationMsg, setUserCreationMsg] = useState<{type: 'success'|'error', text: string} | null>(null);

  useEffect(() => {
    refreshSubjects();
    if (tab === 'users') refreshProfiles();
  }, [tab]);

  useEffect(() => {
    if (selectedSubjectId) {
      refreshQuestions(selectedSubjectId);
    }
  }, [selectedSubjectId]);

  const refreshSubjects = async () => {
      const data = await getSubjects();
      setSubjects(data);
  };

  const refreshQuestions = async (subId: string) => {
      const data = await getQuestionsForSubject(subId);
      setQuestions(data);
  };

  const refreshProfiles = async () => {
      const data = await getAllProfiles();
      setProfiles(data);
  }

  const handleSaveSubject = async () => {
    if (!editingSubject.name) {
        alert("Subject Name is required");
        return;
    }

    setUploading(true);
    let iconUrl = editingSubject.icon || '';

    // Upload image if a new file is selected
    if (subjectIconFile) {
        const uploadedUrl = await uploadSubjectIcon(subjectIconFile);
        if (uploadedUrl) {
            iconUrl = uploadedUrl;
        } else {
            alert("Failed to upload image. Please ensure 'subject-icons' bucket exists in Supabase.");
            setUploading(false);
            return;
        }
    }

    // Use selected color or default
    const finalSubject: Subject = {
        id: editingSubject.id || '', // Empty ID triggers generation in backend
        name: editingSubject.name,
        icon: iconUrl || '📚', // Fallback emoji
        color: editingSubject.color || 'bg-blue-500',
        totalQuestions: editingSubject.totalQuestions || 0
    };

    await saveSubject(finalSubject);
    
    setEditingSubject({});
    setSubjectIconFile(null);
    setUploading(false);
    refreshSubjects();
  };

  const handleEditSubjectClick = (sub: Subject) => {
      setEditingSubject(sub);
      setSubjectIconFile(null);
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelSubjectEdit = () => {
      setEditingSubject({});
      setSubjectIconFile(null);
  }

  const handleSaveQuestion = async () => {
    if (!editingQuestion.text || !selectedSubjectId) return;
    const q: Question = {
        id: editingQuestion.id || `temp_${Date.now()}`, // Temp ID, DB will replace if new
        subjectId: selectedSubjectId,
        text: editingQuestion.text,
        options: editingQuestion.options || ['', '', '', ''],
        correctOptionIndex: editingQuestion.correctOptionIndex || 0,
        difficulty: editingQuestion.difficulty || Difficulty.MEDIUM,
        explanation: editingQuestion.explanation || ''
    };
    await saveQuestion(q);
    setEditingQuestion({});
    refreshQuestions(selectedSubjectId);
  };

  const handleDeleteQuestion = async (id: string) => {
      if(confirm("Delete this question?")) {
          await deleteQuestion(id);
          refreshQuestions(selectedSubjectId);
      }
  }

  const toggleUserRole = async (profile: any) => {
      const newRole = profile.role === 'admin' ? 'user' : 'admin';
      if(confirm(`Change role for ${profile.email} to ${newRole}?`)) {
          await updateUserRole(profile.id, newRole);
          refreshProfiles();
      }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
      e.preventDefault();
      setUserCreationMsg(null);
      if (newUserPassword.length < 6) {
          setUserCreationMsg({type: 'error', text: 'Password must be at least 6 characters'});
          return;
      }

      const { error } = await registerUser(newUserEmail, newUserPassword);
      if (error) {
          setUserCreationMsg({type: 'error', text: error.message});
      } else {
          setUserCreationMsg({type: 'success', text: 'User created successfully! Refresh list to see.'});
          setNewUserEmail('');
          setNewUserPassword('');
          // We wait a moment for the trigger to populate the profile
          setTimeout(refreshProfiles, 1000);
      }
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="flex space-x-2">
            <button 
                onClick={() => setTab('subjects')}
                className={`px-4 py-2 rounded-lg flex items-center transition-colors ${tab === 'subjects' ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
            >
                <Layers size={18} className="mr-2"/> Subjects
            </button>
            <button 
                onClick={() => setTab('questions')}
                className={`px-4 py-2 rounded-lg flex items-center transition-colors ${tab === 'questions' ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
            >
                <Book size={18} className="mr-2"/> Questions
            </button>
            <button 
                onClick={() => setTab('users')}
                className={`px-4 py-2 rounded-lg flex items-center transition-colors ${tab === 'users' ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
            >
                <Users size={18} className="mr-2"/> Users
            </button>
        </div>
      </div>

      {/* SUBJECTS MANAGEMENT */}
      {tab === 'subjects' && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold mb-4">{editingSubject.id ? 'Edit Subject' : 'Add New Subject'}</h2>
          
          {/* Add/Edit Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
             
             {/* Name Field */}
             <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subject Name</label>
                <input 
                    placeholder="e.g. Mathematics" 
                    value={editingSubject.name || ''} 
                    onChange={e => setEditingSubject({...editingSubject, name: e.target.value})}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                />
             </div>

             {/* Icon Upload */}
             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Icon (PNG/JPEG)</label>
                <div className="flex items-center gap-3">
                    <label className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-sm text-gray-700">
                        <Upload size={16} className="mr-2" />
                        {subjectIconFile ? "Change Image" : "Choose Image"}
                        <input 
                            type="file" 
                            accept="image/png, image/jpeg" 
                            className="hidden" 
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    setSubjectIconFile(e.target.files[0]);
                                }
                            }}
                        />
                    </label>
                    {/* Preview */}
                    {(subjectIconFile || editingSubject.icon) && (
                         <div className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden border border-gray-300 relative">
                             {subjectIconFile ? (
                                 <img src={URL.createObjectURL(subjectIconFile)} alt="preview" className="w-full h-full object-cover" />
                             ) : editingSubject.icon?.startsWith('http') ? (
                                 <img src={editingSubject.icon} alt="current" className="w-full h-full object-cover" />
                             ) : (
                                 <div className="flex items-center justify-center h-full text-lg">{editingSubject.icon}</div>
                             )}
                         </div>
                    )}
                    {subjectIconFile && <span className="text-xs text-gray-500 truncate max-w-[120px]">{subjectIconFile.name}</span>}
                </div>
             </div>

             {/* Color Palette */}
             <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Card Color Theme</label>
                <div className="flex flex-wrap gap-2 bg-white p-3 rounded-lg border border-gray-200">
                    {COLOR_PALETTE.map(color => (
                        <button 
                            key={color}
                            onClick={() => setEditingSubject({...editingSubject, color})}
                            className={`w-8 h-8 rounded-full transition-all hover:scale-110 ${color} ${
                                editingSubject.color === color 
                                ? 'ring-4 ring-brand-200 scale-110 shadow-md' 
                                : 'opacity-70 hover:opacity-100'
                            }`}
                            title={color}
                        />
                    ))}
                </div>
             </div>

             {/* Action Buttons */}
             <div className="col-span-1 md:col-span-2 flex gap-3 mt-2">
                 {editingSubject.id && (
                     <button 
                        onClick={handleCancelSubjectEdit} 
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition-colors flex items-center"
                     >
                        <X size={18} className="mr-2"/> Cancel
                     </button>
                 )}
                 <button 
                    onClick={handleSaveSubject} 
                    disabled={uploading}
                    className={`flex-1 bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg font-bold flex justify-center items-center transition-colors ${uploading ? 'opacity-50 cursor-wait' : ''}`}
                 >
                    <Save size={18} className="mr-2"/> {uploading ? 'Uploading...' : 'Save Subject'}
                 </button>
             </div>
          </div>

          {/* Subject List */}
          <div className="space-y-3">
            {subjects.length === 0 && (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <AlertCircle className="mx-auto mb-2 text-gray-400" />
                    <p>No subjects found.</p> 
                    <p className="text-sm">Add your first subject above.</p>
                </div>
            )}
            {subjects.map(sub => (
                <div key={sub.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-lg ${sub.color} flex items-center justify-center text-white text-xl overflow-hidden shadow-sm`}>
                            {sub.icon.startsWith('http') ? (
                                <img src={sub.icon} alt={sub.name} className="w-full h-full object-cover" />
                            ) : (
                                sub.icon
                            )}
                        </div>
                        <div>
                            <div className="font-bold text-gray-900">{sub.name}</div>
                            <div className="text-xs text-gray-500 font-mono">ID: {sub.id.substring(0, 8)}...</div>
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <button onClick={() => handleEditSubjectClick(sub)} className="text-blue-600 p-2 hover:bg-blue-50 rounded transition-colors"><Edit2 size={18}/></button>
                        <button onClick={async () => {if(confirm('Delete?')) { await deleteSubject(sub.id); refreshSubjects(); }}} className="text-red-600 p-2 hover:bg-red-50 rounded transition-colors"><Trash2 size={18}/></button>
                    </div>
                </div>
            ))}
          </div>
        </div>
      )}

      {/* QUESTIONS MANAGEMENT */}
      {tab === 'questions' && (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Subject</label>
                <select 
                    className="w-full p-2.5 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                >
                    <option value="">-- Select Subject --</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>

            {selectedSubjectId && (
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h2 className="text-lg font-bold mb-4">Add / Edit Question</h2>
                    <div className="space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8">
                        <textarea 
                            placeholder="Question Text" 
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                            rows={2}
                            value={editingQuestion.text || ''}
                            onChange={e => setEditingQuestion({...editingQuestion, text: e.target.value})}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[0, 1, 2, 3].map(idx => (
                                <input 
                                    key={idx} 
                                    placeholder={`Option ${idx + 1}`}
                                    className="p-3 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                    value={editingQuestion.options?.[idx] || ''}
                                    onChange={e => {
                                        const newOpts = [...(editingQuestion.options || ['', '', '', ''])];
                                        newOpts[idx] = e.target.value;
                                        setEditingQuestion({...editingQuestion, options: newOpts});
                                    }}
                                />
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                 <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Correct Answer</label>
                                 <select 
                                    className="w-full p-3 border rounded-lg bg-white"
                                    value={editingQuestion.correctOptionIndex || 0}
                                    onChange={e => setEditingQuestion({...editingQuestion, correctOptionIndex: parseInt(e.target.value)})}
                                 >
                                    <option value={0}>Option 1</option>
                                    <option value={1}>Option 2</option>
                                    <option value={2}>Option 3</option>
                                    <option value={3}>Option 4</option>
                                 </select>
                             </div>
                             <div>
                                 <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Difficulty</label>
                                 <select 
                                    className="w-full p-3 border rounded-lg bg-white"
                                    value={editingQuestion.difficulty || Difficulty.MEDIUM}
                                    onChange={e => setEditingQuestion({...editingQuestion, difficulty: e.target.value as Difficulty})}
                                 >
                                    <option value={Difficulty.EASY}>Easy</option>
                                    <option value={Difficulty.MEDIUM}>Medium</option>
                                    <option value={Difficulty.HARD}>Hard</option>
                                 </select>
                             </div>
                        </div>
                        <textarea 
                            placeholder="Explanation (Why is the answer correct?)" 
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                            rows={2}
                            value={editingQuestion.explanation || ''}
                            onChange={e => setEditingQuestion({...editingQuestion, explanation: e.target.value})}
                        />
                        <button onClick={handleSaveQuestion} className="w-full bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-lg font-bold transition-colors flex justify-center items-center">
                            <Plus size={18} className="mr-2"/> Save Question
                        </button>
                    </div>

                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-700">Existing Questions ({questions.length})</h3>
                        <button onClick={() => refreshQuestions(selectedSubjectId)} className="text-gray-500 hover:text-gray-900"><RefreshCcw size={16}/></button>
                    </div>
                    
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                        {questions.map((q, idx) => (
                            <div key={q.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 cursor-pointer" onClick={() => setEditingQuestion(q)}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-mono text-xs text-gray-400">#{idx + 1}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                                                q.difficulty === Difficulty.HARD ? 'bg-red-100 text-red-700' : 
                                                q.difficulty === Difficulty.MEDIUM ? 'bg-yellow-100 text-yellow-700' : 
                                                'bg-green-100 text-green-700'
                                            }`}>{q.difficulty}</span>
                                        </div>
                                        <p className="font-medium text-gray-900 text-sm line-clamp-2">{q.text}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteQuestion(q.id)}
                                        className="text-gray-300 hover:text-red-600 p-2 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      )}

      {/* USER MANAGEMENT */}
      {tab === 'users' && (
          <div className="space-y-6">
              {/* Create User Form */}
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                  <h2 className="text-lg font-bold mb-4 flex items-center">
                      <UserPlus size={20} className="mr-2 text-brand-600" />
                      Register New User
                  </h2>
                  <form onSubmit={handleCreateUser} className="bg-gray-50 p-4 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                          <input 
                            type="email" 
                            required
                            value={newUserEmail}
                            onChange={e => setNewUserEmail(e.target.value)}
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-brand-500"
                            placeholder="newuser@example.com"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
                          <input 
                            type="text" // Visible text for admin convenience
                            required
                            value={newUserPassword}
                            onChange={e => setNewUserPassword(e.target.value)}
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-brand-500"
                            placeholder="Min 6 chars"
                          />
                      </div>
                      <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white p-2 rounded font-bold transition-colors">
                          Create User
                      </button>
                  </form>
                  {userCreationMsg && (
                      <div className={`mt-3 text-sm p-2 rounded ${userCreationMsg.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {userCreationMsg.text}
                      </div>
                  )}
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                  <h2 className="text-lg font-bold mb-4">Manage Existing Users</h2>
                  <div className="overflow-hidden border border-gray-200 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                              <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stats</th>
                                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                              </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                              {profiles.map(p => (
                                  <tr key={p.id}>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.email}</td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${p.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                                              {p.role}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                          Streak: {p.streak} | XP: {p.xp}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                          <button onClick={() => toggleUserRole(p)} className="text-brand-600 hover:text-brand-900">
                                              Toggle Role
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminDashboard;