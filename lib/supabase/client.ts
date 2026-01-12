import { createBrowserClient } from '@supabase/ssr';
import { z } from 'zod';
import type { Database } from '@/src/types/database';

// Validate environment variables with Zod
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL format'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
});

function validateEnv() {
  const result = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const errorMessages = Object.entries(errors)
      .map(([key, msgs]) => `${key}: ${msgs?.join(', ')}`)
      .join('\n');
    throw new Error(
      `Invalid Supabase environment variables:\n${errorMessages}\n\nPlease check your .env.local file.`
    );
  }

  return result.data;
}

export const createClient = () => {
  const env = validateEnv();
  return createBrowserClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
};
