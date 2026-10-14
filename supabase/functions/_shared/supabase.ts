import { createClient } from 'npm:@supabase/supabase-js@2';

export const db = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

export const CATEGORIES = [
  'blusas', 'tube_tops', 'regatas', 'camisetas', 'camisas', 'calcas', 'shorts', 'saias',
  'vestidos', 'macacoes', 'casacos', 'calcados', 'bolsas', 'acessorios',
];
