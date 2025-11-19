import { Difficulty, Question, SubjectAnalytics, TestSession, UserProfile } from '../types';
import { getQuestionsForSubject } from './database';
import { supabase } from '../lib/supabase';

// --- Adaptive Difficulty Logic ---

export const calculateAdaptiveDistribution = (recentSessions: TestSession[]): { [key in Difficulty]: number } => {
  if (recentSessions.length === 0) {
    return { [Difficulty.EASY]: 0.5, [Difficulty.MEDIUM]: 0.3, [Difficulty.HARD]: 0.2, [Difficulty.AUTO]: 0 };
  }

  let totalWeight = 0;
  let weightedAccuracySum = 0;

  recentSessions.slice(-5).forEach((session, index) => {
    const accuracy = session.score / session.questions.length;
    const weight = index + 1; 
    weightedAccuracySum += accuracy * weight;
    totalWeight += weight;
  });

  const avgAccuracy = weightedAccuracySum / totalWeight;

  if (avgAccuracy > 0.8) {
    return { [Difficulty.EASY]: 0.1, [Difficulty.MEDIUM]: 0.3, [Difficulty.HARD]: 0.6, [Difficulty.AUTO]: 0 };
  } else if (avgAccuracy > 0.5) {
    return { [Difficulty.EASY]: 0.2, [Difficulty.MEDIUM]: 0.5, [Difficulty.HARD]: 0.3, [Difficulty.AUTO]: 0 };
  } else {
    return { [Difficulty.EASY]: 0.6, [Difficulty.MEDIUM]: 0.3, [Difficulty.HARD]: 0.1, [Difficulty.AUTO]: 0 };
  }
};

// --- Test Generation Engine (Async) ---

export const generateTest = async (subjectId: string, count: number, mode: Difficulty): Promise<Question[]> => {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return [];

  // 1. Fetch All Questions
  const allQuestions = await getQuestionsForSubject(subjectId);
  
  // 2. Fetch Cooldown Data (Sessions from last 15 days)
  const fifteenDaysAgo = new Date();
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

  const { data: recentSessions } = await supabase
    .from('test_sessions')
    .select('questions')
    .eq('user_id', user.id)
    .gte('created_at', fifteenDaysAgo.toISOString());

  // Extract used question IDs
  const usedQuestionIds = new Set<string>();
  recentSessions?.forEach((s: any) => {
      const qs = s.questions as Question[];
      qs?.forEach(q => usedQuestionIds.add(q.id));
  });

  let availableQuestions = allQuestions.filter(q => !usedQuestionIds.has(q.id));
  
  // Fallback if not enough questions
  if (availableQuestions.length < count) {
    availableQuestions = allQuestions; 
  }

  // 3. Select Questions based on Difficulty
  let selectedQuestions: Question[] = [];

  if (mode === Difficulty.AUTO) {
    // Fetch all sessions for adaptive logic
    const { data: allSubjectSessions } = await supabase
        .from('test_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('subject_id', subjectId)
        .eq('completed', true);

    // Need to map DB session to Type
    const mappedSessions: TestSession[] = (allSubjectSessions || []).map((s:any) => ({
        id: s.id,
        subjectId: s.subject_id,
        startTime: 0,
        difficultyMode: s.difficulty_mode as Difficulty,
        questions: s.questions,
        responses: [], // minimal needed for algo
        score: s.score,
        completed: s.completed
    }));

    const distribution = calculateAdaptiveDistribution(mappedSessions);
    
    const easyCount = Math.floor(count * (distribution[Difficulty.EASY] || 0));
    const mediumCount = Math.floor(count * (distribution[Difficulty.MEDIUM] || 0));
    const hardCount = count - easyCount - mediumCount;

    const easyQ = availableQuestions.filter(q => q.difficulty === Difficulty.EASY);
    const mediumQ = availableQuestions.filter(q => q.difficulty === Difficulty.MEDIUM);
    const hardQ = availableQuestions.filter(q => q.difficulty === Difficulty.HARD);

    selectedQuestions = [
      ...sampleRandom(easyQ, easyCount),
      ...sampleRandom(mediumQ, mediumCount),
      ...sampleRandom(hardQ, hardCount),
    ];
  } else {
    const filtered = availableQuestions.filter(q => q.difficulty === mode);
    if (filtered.length < count) {
        const remaining = count - filtered.length;
        const others = availableQuestions.filter(q => q.difficulty !== mode);
        selectedQuestions = [...filtered, ...sampleRandom(others, remaining)];
    } else {
        selectedQuestions = sampleRandom(filtered, count);
    }
  }

  return shuffleArray(selectedQuestions);
};

// --- Helpers ---

function sampleRandom<T>(arr: T[], n: number): T[] {
  return shuffleArray(arr).slice(0, n);
}

function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

// --- Storage & Analytics ---

export const saveSession = async (session: TestSession) => {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return;

  // 1. Insert Session
  const { data: sessionData, error } = await supabase
    .from('test_sessions')
    .insert({
        user_id: user.id,
        subject_id: session.subjectId,
        score: session.score,
        difficulty_mode: session.difficultyMode,
        completed: true,
        questions: session.questions // Storing questions as JSONB for snapshot
    })
    .select()
    .single();

  if (error || !sessionData) {
      console.error("Failed to save session", error);
      return;
  }

  // 2. Insert Responses (Optional, for detailed analytics)
  const responsesToInsert = session.responses.map(r => ({
      session_id: sessionData.id,
      question_id: r.questionId,
      selected_option_index: r.selectedOptionIndex,
      is_correct: r.isCorrect,
      time_taken_seconds: r.timeTakenSeconds
  }));
  
  await supabase.from('test_responses').insert(responsesToInsert);

  // 3. Update Stats
  await updateProfileStats(user.id, session);
  
  return sessionData.id;
};

export const getAnalytics = async (subjectId: string): Promise<SubjectAnalytics> => {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return { subjectId, testsTaken: 0, avgAccuracy: 0, totalQuestionsSolved: 0, lastAttemptDate: 0, difficultyDistribution: {} };

  const { data: sessions } = await supabase
    .from('test_sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('subject_id', subjectId)
    .eq('completed', true);

  if (!sessions || sessions.length === 0) {
    return {
        subjectId,
        testsTaken: 0,
        avgAccuracy: 0,
        totalQuestionsSolved: 0,
        lastAttemptDate: 0,
        difficultyDistribution: {}
    };
  }

  const totalAccuracy = sessions.reduce((acc, s) => {
      const qCount = Array.isArray(s.questions) ? s.questions.length : 10; // Fallback
      return acc + (s.score / qCount);
  }, 0);

  const totalQuestions = sessions.reduce((acc, s) => {
      return acc + (Array.isArray(s.questions) ? s.questions.length : 0);
  }, 0);
  
  return {
    subjectId,
    testsTaken: sessions.length,
    avgAccuracy: (totalAccuracy / sessions.length) * 100,
    totalQuestionsSolved: totalQuestions,
    lastAttemptDate: new Date(sessions[sessions.length - 1].created_at).getTime(),
    difficultyDistribution: {}
  };
};

export const getSessionById = async (sessionId: string): Promise<TestSession | null> => {
    const { data, error } = await supabase
        .from('test_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
    
    if (error || !data) return null;

    // Fetch responses to reconstruct full session if needed, 
    // but we stored questions in JSONB so we can use that.
    const { data: responses } = await supabase
        .from('test_responses')
        .select('*')
        .eq('session_id', sessionId);

    const mappedResponses = (responses || []).map((r: any) => ({
        questionId: r.question_id,
        selectedOptionIndex: r.selected_option_index,
        isCorrect: r.is_correct,
        timeTakenSeconds: r.time_taken_seconds
    }));

    return {
        id: data.id,
        subjectId: data.subject_id,
        startTime: new Date(data.created_at).getTime(),
        difficultyMode: data.difficulty_mode as Difficulty,
        questions: data.questions as Question[],
        responses: mappedResponses,
        score: data.score,
        completed: data.completed
    };
}

// --- Streak & Profile Logic ---

const updateProfileStats = async (userId: string, session: TestSession) => {
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    
    if (!profile) return; // Should not happen if RLS/Trigger sets up profile

    const today = new Date().toISOString().split('T')[0];
    const lastDate = profile.last_login_date;
    let newStreak = profile.streak;

    if (today !== lastDate) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastDate === yesterdayStr) {
            newStreak += 1;
        } else {
            newStreak = 1; 
        }
    }

    const newXp = profile.xp + (session.score * 10);

    await supabase.from('profiles').update({
        streak: newStreak,
        xp: newXp,
        last_login_date: today
    }).eq('id', userId);
};

export const getUserProfile = async (): Promise<UserProfile> => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return { streak: 0, lastLoginDate: '', totalTests: 0, globalAccuracy: 0, xp: 0 };

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    
    // Get Global Stats Aggregation
    const { data: sessions } = await supabase
        .from('test_sessions')
        .select('score, questions')
        .eq('user_id', user.id);

    let totalQ = 0;
    let totalScore = 0;
    
    if (sessions) {
        sessions.forEach((s: any) => {
            totalScore += s.score;
            totalQ += Array.isArray(s.questions) ? s.questions.length : 0;
        });
    }

    return {
        streak: profile?.streak || 0,
        lastLoginDate: profile?.last_login_date || '',
        totalTests: sessions?.length || 0,
        globalAccuracy: totalQ > 0 ? (totalScore / totalQ) * 100 : 0,
        xp: profile?.xp || 0
    };
}
