import { supabase } from '../supabaseClient';

export const checkSupabaseHealth = async () => {
  const maxRetries = 2;
  const retryDelay = 1000; // 1 second

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const { error } = await supabase
        .from('health_check')
        .select('id')
        .limit(1)
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);
      
      if (!error) return true;
      
      // If we get here, there was an error but not a timeout
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }
      
      return false;
    } catch (err) {
      // Handle network errors, timeouts, etc.
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }
      return false;
    }
  }
  return false;
};