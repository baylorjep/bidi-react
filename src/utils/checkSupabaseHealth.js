import { supabase } from '../supabaseClient';

export const checkSupabaseHealth = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const { error } = await supabase
      .from('health_check')
      .select('id')
      .limit(1)
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);
    return !error;
  } catch (err) {
    return false;
  }
};