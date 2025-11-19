import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { generateTest, saveSession } from '../services/engine';
import { getSubjects } from '../services/database';
import { Difficulty, Question, TestSession, UserResponse, Subject } from '../types';
import { Clock, ChevronLeft, ChevronRight, Flag } from 'lucide-react';

const ActiveTest = () => {
  const { subjectId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const difficulty = (searchParams.get('difficulty') as Difficulty) || Difficulty.AUTO;
  const count = parseInt(searchParams.get('count') || '10');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [startTime] = useState(Date.now());
  const [timeLeft, setTimeLeft] = useState(count * 60);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState<Subject | undefined>(undefined);

  // Initialize Test
  useEffect(() => {
    const init = async () => {
        const subs = await getSubjects();
        setSubject(subs.find(s => s.id === subjectId));

        if (subjectId) {
            const q = await generateTest(subjectId, count, difficulty);
            setQuestions(q);
            setLoading(false);
        }
    };
    init();
  }, [subjectId, count, difficulty]);

  // Timer
  useEffect(() => {
    if (loading) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          submitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const handleOptionSelect = (idx: number) => {
    const currentQ = questions[currentIndex];
    setResponses(prev => ({ ...prev, [currentQ.id]: idx }));
  };

  const submitTest = async () => {
    if (!subjectId) return;

    const endTime = Date.now();
    const formattedResponses: UserResponse[] = questions.map(q => {
      const selectedIdx = responses[q.id];
      return {
        questionId: q.id,
        selectedOptionIndex: selectedIdx !== undefined ? selectedIdx : -1,
        isCorrect: selectedIdx === q.correctOptionIndex,
        timeTakenSeconds: 0 // Simplified for demo
      };
    });

    const score = formattedResponses.filter(r => r.isCorrect).length;

    const session: TestSession = {
      id: '', // Will be assigned by DB
      subjectId,
      startTime,
      endTime,
      difficultyMode: difficulty,
      questions,
      responses: formattedResponses,
      score,
      completed: true
    };

    const sessionId = await saveSession(session);
    if (sessionId) {
        navigate(`/review/${sessionId}`);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading questions...</div>;

  // Handle case where generated test has no questions (e.g., new subject with no questions)
  if (questions.length === 0) {
      return (
          <div className="p-8 text-center">
              <h2 className="text-xl font-bold text-gray-800">No Questions Available</h2>
              <p className="text-gray-500 mt-2">The question bank for this subject is currently empty or failed to load.</p>
              <button onClick={() => navigate('/practice')} className="mt-4 text-brand-600 font-bold">Go Back</button>
          </div>
      );
  }

  const currentQ = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-100px)] flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex justify-between items-center border border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{subject?.name}</h2>
          <div className="text-sm text-gray-500 flex items-center">
            <span className="bg-brand-100 text-brand-700 px-2 py-0.5 rounded text-xs font-medium mr-2">
              {difficulty}
            </span>
            Question {currentIndex + 1} of {questions.length}
          </div>
        </div>
        <div className={`flex items-center space-x-2 font-mono text-xl font-bold ${timeLeft < 60 ? 'text-red-600' : 'text-gray-700'}`}>
          <Clock size={20} />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-6">
        <div className="bg-brand-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
      </div>

      {/* Question Area */}
      <div className="bg-white flex-1 rounded-2xl shadow-sm border border-gray-100 p-8 overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
            <h3 className="text-xl font-medium text-gray-900 leading-relaxed">{currentQ.text}</h3>
            <span className={`text-xs px-2 py-1 rounded border ${
                currentQ.difficulty === Difficulty.HARD ? 'bg-red-50 text-red-600 border-red-100' : 
                currentQ.difficulty === Difficulty.MEDIUM ? 'bg-yellow-50 text-yellow-600 border-yellow-100' : 
                'bg-green-50 text-green-600 border-green-100'
            }`}>
                {currentQ.difficulty}
            </span>
        </div>

        <div className="space-y-3">
          {currentQ.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleOptionSelect(idx)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center group ${
                responses[currentQ.id] === idx
                  ? 'border-brand-500 bg-brand-50 text-brand-900'
                  : 'border-gray-100 hover:border-gray-300 text-gray-700'
              }`}
            >
              <span className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 font-bold text-sm transition-colors ${
                 responses[currentQ.id] === idx ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
              }`}>
                {String.fromCharCode(65 + idx)}
              </span>
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="mt-6 flex justify-between items-center">
        <button
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex(p => p - 1)}
          className="flex items-center px-5 py-2.5 rounded-lg text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={18} className="mr-1" /> Previous
        </button>

        {currentIndex === questions.length - 1 ? (
          <button
            onClick={submitTest}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-green-500/30 transition-all"
          >
            Submit Test
          </button>
        ) : (
          <button
            onClick={() => setCurrentIndex(p => p + 1)}
            className="flex items-center px-5 py-2.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-500/30"
          >
            Next <ChevronRight size={18} className="ml-1" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ActiveTest;
