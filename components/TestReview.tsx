import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { TestSession } from '../types';
import { getSubjects } from '../services/database';
import { getSessionById } from '../services/engine';
import { getAIExplanation } from '../services/gemini';
import { CheckCircle, XCircle, AlertCircle, Bot, ArrowLeft, Award } from 'lucide-react';

const TestReview = () => {
  const { sessionId } = useParams();
  const [session, setSession] = useState<TestSession | null>(null);
  const [activeExplanationId, setActiveExplanationId] = useState<string | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string>("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
        if (sessionId) {
            const s = await getSessionById(sessionId);
            if (s) {
                setSession(s);
                const subs = await getSubjects();
                const sub = subs.find(sub => sub.id === s.subjectId);
                setSubjectName(sub ? sub.name : s.subjectId);
            }
        }
        setLoading(false);
    };
    load();
  }, [sessionId]);

  const handleGetAIHelp = async (questionId: string) => {
    if (!session) return;
    const question = session.questions.find(q => q.id === questionId);
    if (!question) return;

    setActiveExplanationId(questionId);
    setIsGeneratingAi(true);
    setAiExplanation("");

    const text = await getAIExplanation(question);
    setAiExplanation(text);
    setIsGeneratingAi(false);
  };

  if (loading) return <div className="p-10 text-center">Loading Review...</div>;
  if (!session) return <div className="p-10 text-center">Session not found.</div>;

  const accuracy = Math.round((session.score / session.questions.length) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <Link to="/" className="inline-flex items-center text-gray-500 hover:text-brand-600 mb-2">
        <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
      </Link>

      {/* Header Card */}
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center text-center md:text-left">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Session Complete!</h1>
          <p className="text-gray-500 mt-1">{subjectName} • {session.difficultyMode} Mode</p>
        </div>
        
        <div className="flex items-center gap-6 mt-6 md:mt-0">
          <div className="text-center">
            <div className="text-3xl font-bold text-brand-600">{session.score}/{session.questions.length}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider font-medium">Score</div>
          </div>
          <div className="w-px h-10 bg-gray-200"></div>
          <div className="text-center">
            <div className={`text-3xl font-bold ${accuracy >= 70 ? 'text-green-600' : accuracy >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
              {accuracy}%
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-wider font-medium">Accuracy</div>
          </div>
        </div>
      </div>

      {/* Analysis & Recommendations */}
      {accuracy < 50 && (
         <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-start">
            <Award className="text-orange-600 mt-1 mr-3 flex-shrink-0" />
            <div>
                <h4 className="font-bold text-orange-800">Adaptive Recommendation</h4>
                <p className="text-sm text-orange-700 mt-1">
                    It looks like you struggled with this set. The Adaptive Engine will likely lower the difficulty for the next test to help you rebuild your conceptual foundation. Keep practicing!
                </p>
            </div>
         </div>
      )}

      {/* Review Questions */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-800">Detailed Review</h2>
        
        {session.questions.map((q, index) => {
          const userResp = session.responses.find(r => r.questionId === q.id);
          const isCorrect = userResp?.isCorrect;
          const selectedIdx = userResp?.selectedOptionIndex ?? -1;

          return (
            <div key={q.id} className={`bg-white rounded-xl border p-6 ${isCorrect ? 'border-gray-200' : 'border-red-100 bg-red-50/30'}`}>
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  {isCorrect ? <CheckCircle className="text-green-500" size={24} /> : <XCircle className="text-red-500" size={24} />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h3 className="font-medium text-gray-900 mb-3">
                      <span className="text-gray-400 mr-2">#{index + 1}</span> {q.text}
                    </h3>
                    <span className="text-xs text-gray-400 border px-1.5 py-0.5 rounded h-fit">{q.difficulty}</span>
                  </div>

                  <div className="space-y-2 mb-4">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = selectedIdx === optIdx;
                      const isAnswer = q.correctOptionIndex === optIdx;
                      
                      let style = "border-gray-100 text-gray-600";
                      if (isAnswer) style = "bg-green-50 border-green-200 text-green-800 font-medium";
                      else if (isSelected && !isCorrect) style = "bg-red-50 border-red-200 text-red-800";

                      return (
                        <div key={optIdx} className={`p-3 rounded-lg border text-sm ${style} flex justify-between`}>
                          <span>{opt}</span>
                          {isAnswer && <span className="text-xs font-bold text-green-600 uppercase ml-2">Correct Answer</span>}
                          {isSelected && !isAnswer && <span className="text-xs font-bold text-red-600 uppercase ml-2">Your Answer</span>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Section */}
                  <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 border border-gray-200">
                    <p className="font-semibold mb-1 text-gray-900">Explanation:</p>
                    <p>{q.explanation}</p>
                  </div>

                  {/* AI Tutor Button */}
                  {!isCorrect && (
                    <div className="mt-3">
                       {activeExplanationId === q.id ? (
                         <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 text-sm">
                            <div className="flex items-center gap-2 text-indigo-700 font-bold mb-2">
                                <Bot size={16} /> AI Tutor Explanation
                            </div>
                            {isGeneratingAi ? (
                                <span className="text-indigo-500 animate-pulse">Generating deeper explanation with Gemini...</span>
                            ) : (
                                <p className="text-gray-800 leading-relaxed">{aiExplanation}</p>
                            )}
                         </div>
                       ) : (
                         <button 
                            onClick={() => handleGetAIHelp(q.id)}
                            className="text-indigo-600 text-sm font-medium flex items-center hover:underline mt-2"
                         >
                            <Bot size={16} className="mr-1.5" /> Ask AI Tutor for detailed help
                         </button>
                       )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TestReview;
