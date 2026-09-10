import { GameSyncAdapter } from './adapter';
import { LocalGameAdapter } from './local-adapter';
import { SupabaseGameAdapter } from './supabase-adapter';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isSupabaseValid =
  typeof supabaseUrl === 'string' &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('seu-projeto') &&
  typeof supabaseAnonKey === 'string' &&
  supabaseAnonKey.length > 20 &&
  !supabaseAnonKey.includes('sua_anon_key');

let activeAdapter: GameSyncAdapter;

if (isSupabaseValid) {
  console.log('💜 [Entre Nós] Conectado ao Supabase (PostgreSQL + Realtime)');
  activeAdapter = new SupabaseGameAdapter(supabaseUrl, supabaseAnonKey);
} else {
  console.log('💜 [Entre Nós] Operando em Modo Simulado Local (BroadcastChannel / Multi-Aba)');
  activeAdapter = new LocalGameAdapter();
}

export const syncAdapter = activeAdapter;
export const isUsingSupabase = isSupabaseValid;
