import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getSubjects } from '../services/database';
import { Difficulty, Subject } from '../types';
import { Brain, Sparkles, Gauge, Zap } from 'lucide-react';

const TestConfig = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || '');
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.AUTO);
  const [count, setCount] = useState(10);

  useEffect(() => {
    const load = async () => {
        const s = await getSubjects();
        setSubjects(s);
    };
    load();
    
    const paramSub = searchParams.get('subject');
    if(paramSub) setSelectedSubject(paramSub);
  }, [searchParams]);

  const startTest = () => {
    if (!selectedSubject) return;
    navigate(`/test/${selectedSubject}?difficulty=${difficulty}&count=${count}`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900">Configure Practice Test</h2>
        <p className="text-gray-500 mt-2">Customize your session to fit your learning goals.</p>
      </div>

      {/* Subject Selection */}
      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">1. Select Subject</h3>
        {subjects.length === 0 ? (
            <div className="text-gray-500">Loading subjects...</div>
        ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {subjects.map(sub => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubject(sub.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col items-start ${
                selectedSubject === sub.id
                  ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200 ring-offset-1'
                  : 'border-gray-200 bg-white hover:border-brand-300'
              }`}
            >
              <div className="text-2xl mb-3 w-10 h-10 rounded-md overflow-hidden shadow-sm bg-gray-100 flex items-center justify-center">
                  {sub.icon.startsWith('http') ? (
                      <img src={sub.icon} alt={sub.name} className="w-full h-full object-cover" />
                  ) : (
                      sub.icon
                  )}
              </div>
              <div className="font-bold text-gray-900">{sub.name}</div>
              <div className="text-xs text-gray-500">{sub.totalQuestions} Questions</div>
            </button>
          ))}
        </div>
        )}
      </section>

      {/* Difficulty */}
      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">2. Difficulty Level</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { id: Difficulty.AUTO, label: 'Adaptive Auto', icon: Sparkles, desc: 'Adjusts to your skill' },
            { id: Difficulty.EASY, label: 'Easy', icon: Gauge, desc: 'Foundational concepts' },
            { id: Difficulty.MEDIUM, label: 'Medium', icon: Brain, desc: 'Standard problems' },
            { id: Difficulty.HARD, label: 'Hard', icon: Zap, desc: 'Complex reasoning' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setDifficulty(mode.id)}
              className={`p-4 rounded-xl border-2 flex flex-col items-center text-center transition-all ${
                difficulty === mode.id
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <mode.icon className={`mb-2 ${difficulty === mode.id ? 'text-brand-600' : 'text-gray-400'}`} size={24} />
              <span className="font-bold text-sm text-gray-900">{mode.label}</span>
              <span className="text-xs text-gray-500 mt-1">{mode.desc}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Count */}
      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">3. Number of Questions</h3>
        <div className="flex space-x-4">
            {[5, 10, 20, 30].map(num => (
                <button
                    key={num}
                    onClick={() => setCount(num)}
                    className={`px-6 py-3 rounded-lg font-medium border ${
                        count === num 
                        ? 'bg-gray-900 text-white border-gray-900' 
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                >
                    {num}
                </button>
            ))}
        </div>
      </section>

      <div className="pt-6 flex justify-end">
        <button
          disabled={!selectedSubject}
          onClick={startTest}
          className={`px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
            selectedSubject
              ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/30 transform hover:-translate-y-0.5'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Start Practice Session
        </button>
      </div>
    </div>
  );
};

export default TestConfig;