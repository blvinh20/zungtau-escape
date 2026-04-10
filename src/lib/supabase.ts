import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if keys exist to avoid crashing, but provide a warning
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials missing. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Helper functions for common operations
export const getActivities = async () => {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .order('day', { ascending: true })
    .order('time', { ascending: true });
  if (error) throw error;
  return data;
};

export const addActivity = async (activity: any) => {
  const { data, error } = await supabase
    .from('activities')
    .insert([activity])
    .select();
  if (error) throw error;
  return data[0];
};

export const deleteActivity = async (id: string) => {
  const { error } = await supabase
    .from('activities')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export const updateActivity = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('activities')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
};

export const getParticipants = async () => {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return data;
};

export const addParticipant = async (participant: any) => {
  const { data, error } = await supabase
    .from('participants')
    .insert([participant])
    .select();
  if (error) throw error;
  return data[0];
};

export const deleteParticipant = async (id: string) => {
  const { error } = await supabase
    .from('participants')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export const updateParticipant = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('participants')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
};

export const getExpenses = async () => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*, participants!expenses_payer_id_fkey(name, initials, color_class, avatar_url), expense_participants(participant_id)')
    .order('date', { ascending: false });
  if (error) throw error;
  return data;
};

export const addExpense = async (expense: any, participantIds: string[]) => {
  const { data, error } = await supabase
    .from('expenses')
    .insert([expense])
    .select();
  if (error) throw error;
  
  const expenseId = data[0].id;
  if (participantIds.length > 0) {
    const junctionData = participantIds.map(pid => ({ expense_id: expenseId, participant_id: pid }));
    const { error: jError } = await supabase.from('expense_participants').insert(junctionData);
    if (jError) throw jError;
  }
  
  return data[0];
};

export const deleteExpense = async (id: string) => {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export const updateExpense = async (id: string, updates: any, participantIds: string[]) => {
  const { data, error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw error;

  // Update junction table: delete old, insert new
  const { error: dError } = await supabase.from('expense_participants').delete().eq('expense_id', id);
  if (dError) throw dError;

  if (participantIds.length > 0) {
    const junctionData = participantIds.map(pid => ({ expense_id: id, participant_id: pid }));
    const { error: jError } = await supabase.from('expense_participants').insert(junctionData);
    if (jError) throw jError;
  }

  return data[0];
};

export const getMemories = async () => {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const addMemory = async (memory: any) => {
  const { data, error } = await supabase
    .from('memories')
    .insert([memory])
    .select();
  if (error) throw error;
  return data[0];
};

export const deleteMemory = async (id: string) => {
  const { error } = await supabase
    .from('memories')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export const getFundContributions = async () => {
  const { data, error } = await supabase
    .from('fund_contributions')
    .select('*, participants(name, initials, color_class, avatar_url)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const addFundContribution = async (contribution: any) => {
  const { data, error } = await supabase
    .from('fund_contributions')
    .insert([contribution])
    .select();
  if (error) throw error;
  return data[0];
};

export const deleteFundContribution = async (id: string) => {
  const { error } = await supabase
    .from('fund_contributions')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export const uploadImage = async (file: File, bucket: string = 'memories') => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
};
