import { supabase } from '../lib/supabase';
import { Subject, Question, UserProfile } from '../types';

// --- Helper: Image Upload ---

export const uploadSubjectIcon = async (file: File): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // upload to 'subject-icons' bucket
    const { error: uploadError } = await supabase.storage
      .from('subject-icons')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      // Fallback: If bucket doesn't exist, returns null. 
      // User must create 'subject-icons' bucket in Supabase dashboard.
      return null;
    }

    const { data } = supabase.storage
      .from('subject-icons')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error("Upload exception:", error);
    return null;
  }
};

// --- Subjects ---

export const getSubjects = async (): Promise<Subject[]> => {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .order('name'); // Order alphabetically for better UX
  
  if (error) {
    console.error('Error fetching subjects:', error);
    return [];
  }
  return data as Subject[];
};

export const saveSubject = async (subject: Subject) => {
  // Logic for Auto-ID:
  // If the subject has no ID (new), generate one. 
  // If it has an ID, use it (edit mode).
  
  const payload = { ...subject };

  if (!payload.id) {
      // Generate a UUID if not present
      payload.id = crypto.randomUUID ? crypto.randomUUID() : `sub_${Date.now()}`;
  }

  const { error } = await supabase
    .from('subjects')
    .upsert(payload);
    
  if (error) console.error('Error saving subject', error);
};

export const deleteSubject = async (id: string) => {
  const { error } = await supabase
    .from('subjects')
    .delete()
    .eq('id', id);
  if (error) console.error('Error deleting subject', error);
};

// --- Questions ---

export const getQuestionsForSubject = async (subjectId: string): Promise<Question[]> => {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('subject_id', subjectId);

  if (error) {
    console.error('Error fetching questions:', error);
    return [];
  }
  
  if (!data) return [];

  // Map DB fields if they don't match exactly, though we try to keep them consistent
  return data.map((q: any) => ({
    id: q.id,
    subjectId: q.subject_id,
    text: q.text,
    options: q.options, // Supabase automatically parses JSON columns
    correctOptionIndex: q.correct_option_index,
    difficulty: q.difficulty,
    explanation: q.explanation
  }));
};

export const saveQuestion = async (question: Question) => {
  // If ID is a temp placeholder from frontend, remove it so Postgres generates a UUID
  const idToSave = (question.id && !question.id.includes('temp')) ? question.id : undefined;

  const payload: any = {
      subject_id: question.subjectId,
      text: question.text,
      options: question.options,
      correct_option_index: question.correctOptionIndex,
      difficulty: question.difficulty,
      explanation: question.explanation
  };

  if (idToSave) {
      payload.id = idToSave;
  }

  const { error } = await supabase
    .from('questions')
    .upsert(payload);
    
  if (error) console.error('Error saving question', error);
};

export const deleteQuestion = async (id: string) => {
    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (error) console.error('Error deleting question', error);
};

// --- Profiles ---

export const getUserProfile = async (userId?: string): Promise<UserProfile | null> => {
  // If no userId provided, try to get current auth user
  let uid = userId;
  if (!uid) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    uid = user.id;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .single();

  if (error) return null;
  
  // Fetch extra stats if needed, or rely on what's in the profile table
  // Here we assume profile table acts as cache/source of truth for streak/xp
  
  return {
    streak: data.streak || 0,
    lastLoginDate: data.last_login_date || '',
    totalTests: 0, // Aggregated elsewhere if needed, or added to profile columns
    globalAccuracy: 0, // Aggregated elsewhere
    xp: data.xp || 0
  };
};

// --- Admin User Management ---

export const getAllProfiles = async () => {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
        console.error("Error fetching profiles", error);
        return [];
    }
    return data;
};

export const updateUserRole = async (userId: string, role: 'admin' | 'user') => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
    if (error) console.error("Error updating role", error);
};