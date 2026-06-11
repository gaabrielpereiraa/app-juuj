import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  console.error(
    'Faltam variáveis de ambiente. Copie .env.example para .env e preencha ' +
      'SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.'
  );
  process.exit(1);
}

// Client com service_role: bypassa RLS. USO LOCAL APENAS.
export const supabase = createClient(url, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const BUCKET = 'memories';
