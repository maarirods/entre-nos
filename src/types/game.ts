// ==============================================================================
// Tipos de Domínio do Jogo 'Entre Nós' 💜
// Dinâmica: Espelhada / Simultânea com Avanço Não-Bloqueante
// ==============================================================================

export type PlayerIndex = 0 | 1;

export type GamePhase = 
  | 'lobby'       // Aguardando segunda jogadora
  | 'answering'   // Ambas respondem privadamente (avanço livre)
  | 'guessing'    // Ambas tentam adivinhar a resposta da outra (avanço livre)
  | 'reveal'      // Revelação simultânea das respostas e palpites
  | 'moment'      // Momento de conversa, aprofundamento e reações afetivas
  | 'finished';   // Fim das rodadas, memórias e resumo

export type CategoryKey = 
  | 'comecando' 
  | 'me-conheca' 
  | 'entre-nos' 
  | 'depois-das-23' 
  | 'nossa-historia';

export interface Question {
  id: number;
  category: CategoryKey;
  text: string;
  followUp?: string;
  isCustom?: boolean;
}

export interface ReactionPreset {
  id: string;
  text: string;
  emoji: string;
}

export interface SentReaction {
  id: string;
  fromPlayer: PlayerIndex;
  text: string;
  emoji: string;
  timestamp: number;
}

export interface RoundState {
  questionIndex: number;
  answer_p0?: string;
  answer_p1?: string;
  guess_p0?: string; // O que P0 acha que P1 respondeu
  guess_p1?: string; // O que P1 acha que P0 respondeu
  p0_submitted: boolean;
  p1_submitted: boolean;
  p0_guessed: boolean;
  p1_guessed: boolean;
  is_revealed: boolean;
}

export interface RoomState {
  id: string;
  code: string;
  names: [string, string];
  phase: GamePhase;
  currentQuestionIndex: number;
  rounds: Record<number, RoundState>;
  reactions: SentReaction[];
  discoveriesCount: number;
  lastUpdated: number;
}
