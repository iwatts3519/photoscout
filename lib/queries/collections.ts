import type { Database } from '@/src/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

type Collection = Database['public']['Tables']['collections']['Row'];

export async function getCollectionsByUser(
  supabase: SupabaseClient<Database>,
  userId: string
) {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getCollectionById(
  supabase: SupabaseClient<Database>,
  id: string
) {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createCollection(
  supabase: SupabaseClient<Database>,
  collection: Omit<Collection, 'id' | 'created_at' | 'updated_at'>
) {
  const { data, error } = await supabase
    .from('collections')
    .insert([collection])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCollection(
  supabase: SupabaseClient<Database>,
  id: string,
  updates: Partial<Omit<Collection, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
) {
  const { data, error } = await supabase
    .from('collections')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCollection(
  supabase: SupabaseClient<Database>,
  id: string
) {
  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
