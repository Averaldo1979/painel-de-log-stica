
import { createClient } from 'https://esm.sh/@supabase/supabase-js@^2.45.4';

// Estas variáveis devem ser configuradas no painel da Vercel/Ambiente
const supabaseUrl = (process.env.SUPABASE_URL || 'https://seu-projeto.supabase.co') as string;
const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || 'sua-chave-anon') as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Nota para MCP Supabase:
 * Espera-se as seguintes tabelas no banco de dados:
 * 
 * 1. units (id uuid, name text)
 * 2. teams (id uuid, number text, unit_id uuid, unit_name text)
 * 3. cargos (id uuid, cargo_number text, slaughter_time timestamp, team_id uuid, 
 *           integrated text, city text, pickup_time timestamp, bird_count int, 
 *           total_load int, unit_id uuid, unit_name text, status text, 
 *           start_time text, end_time text, end_date text)
 * 4. users (id uuid, name text, email text, password text, role text, allowedMenus text[], allowedUnits text[], allowedTeams text[])
 */
