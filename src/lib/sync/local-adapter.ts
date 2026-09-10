import { GamePhase, PlayerIndex, RoomState, RoundState, SentReaction } from '../../types/game';
import { GameSyncAdapter } from './adapter';

export class LocalGameAdapter implements GameSyncAdapter {
  private currentCode: string | null = null;
  private channel: BroadcastChannel | null = null;
  private eventSource: EventSource | null = null;
  private listeners: Set<(state: RoomState) => void> = new Set();
  private localCache: Map<string, RoomState> = new Map();

  private getStorageKey(code: string): string {
    return `entre_nos_room_${code.toUpperCase()}`;
  }

  private async fetchServerState(code: string): Promise<RoomState | null> {
    try {
      const res = await fetch(`/api/rooms/${code.toUpperCase()}`);
      if (res.ok) {
        const data = await res.json();
        return data as RoomState;
      }
    } catch {
      // Servidor de API local indisponível, segue para cache local
    }
    return null;
  }

  private async pushServerUpdate(state: RoomState): Promise<void> {
    try {
      await fetch('/api/rooms/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: state.code, state }),
      });
    } catch {
      // Ignora se estiver offline
    }
  }

  private load(code: string): RoomState | null {
    const fromCache = this.localCache.get(code.toUpperCase());
    if (fromCache) return fromCache;

    const data = localStorage.getItem(this.getStorageKey(code));
    if (!data) return null;
    try {
      return JSON.parse(data) as RoomState;
    } catch {
      return null;
    }
  }

  private saveAndBroadcast(state: RoomState): void {
    state.lastUpdated = Date.now();
    this.localCache.set(state.code, state);

    try {
      localStorage.setItem(this.getStorageKey(state.code), JSON.stringify(state));
    } catch {}

    // Notifica listeners desta aba
    this.notify(state);

    // Envia para o servidor local (compartilhado entre aba normal e anônima)
    this.pushServerUpdate(state);

    // Notifica outras abas no mesmo perfil via BroadcastChannel
    if (this.channel) {
      try {
        this.channel.postMessage({ type: 'SYNC_STATE', payload: state });
      } catch {}
    }
  }

  private notify(state: RoomState): void {
    this.localCache.set(state.code, state);
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.error('Error in room listener:', err);
      }
    });
  }

  async createRoom(code: string, hostName: string): Promise<RoomState> {
    const formattedCode = code.trim().toUpperCase();
    this.currentCode = formattedCode;

    const initialRound: RoundState = {
      questionIndex: 0,
      p0_submitted: false,
      p1_submitted: false,
      p0_guessed: false,
      p1_guessed: false,
      is_revealed: false,
    };

    const newState: RoomState = {
      id: crypto.randomUUID(),
      code: formattedCode,
      names: [hostName.trim(), 'Aguardando...'],
      phase: 'lobby',
      currentQuestionIndex: 0,
      rounds: { 0: initialRound },
      reactions: [],
      discoveriesCount: 0,
      lastUpdated: Date.now(),
    };

    // Salva no servidor local primeiro para ficar disponível para qualquer aba (mesmo anônima)
    try {
      await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: formattedCode, state: newState }),
      });
    } catch {}

    this.saveAndBroadcast(newState);
    return newState;
  }

  async joinRoom(code: string, guestName: string): Promise<RoomState> {
    const formattedCode = code.trim().toUpperCase();
    
    // Busca do servidor local compartilhado primeiro (garante que aba anônima ache a sala criada na normal!)
    let existing = await this.fetchServerState(formattedCode);
    if (!existing) {
      existing = this.load(formattedCode);
    }

    if (!existing) {
      throw new Error(`A sala ${formattedCode} não foi encontrada. Verifique o código digitado.`);
    }

    const updatedState: RoomState = {
      ...existing,
      names: [existing.names[0], guestName.trim()],
      phase: existing.phase === 'lobby' ? 'answering' : existing.phase,
    };

    this.currentCode = formattedCode;
    this.saveAndBroadcast(updatedState);
    return updatedState;
  }

  async getRoomState(code: string): Promise<RoomState | null> {
    const serverState = await this.fetchServerState(code);
    if (serverState) return serverState;
    return this.load(code.trim().toUpperCase());
  }

  async submitAnswer(playerIndex: PlayerIndex, answer: string): Promise<void> {
    if (!this.currentCode) return;
    const state = await this.getRoomState(this.currentCode);
    if (!state) return;

    const qIdx = state.currentQuestionIndex;
    const currentRound = state.rounds[qIdx] || {
      questionIndex: qIdx,
      p0_submitted: false,
      p1_submitted: false,
      p0_guessed: false,
      p1_guessed: false,
      is_revealed: false,
    };

    if (playerIndex === 0) {
      currentRound.answer_p0 = answer;
      currentRound.p0_submitted = true;
    } else {
      currentRound.answer_p1 = answer;
      currentRound.p1_submitted = true;
    }

    state.rounds[qIdx] = currentRound;

    // Regra: se ambas responderam, avança automaticamente para 'guessing'
    if (currentRound.p0_submitted && currentRound.p1_submitted) {
      state.phase = 'guessing';
    }

    this.saveAndBroadcast(state);
  }

  async submitGuess(playerIndex: PlayerIndex, guess: string): Promise<void> {
    if (!this.currentCode) return;
    const state = await this.getRoomState(this.currentCode);
    if (!state) return;

    const qIdx = state.currentQuestionIndex;
    const currentRound = state.rounds[qIdx] || {
      questionIndex: qIdx,
      p0_submitted: false,
      p1_submitted: false,
      p0_guessed: false,
      p1_guessed: false,
      is_revealed: false,
    };

    if (playerIndex === 0) {
      currentRound.guess_p0 = guess;
      currentRound.p0_guessed = true;
    } else {
      currentRound.guess_p1 = guess;
      currentRound.p1_guessed = true;
    }

    state.rounds[qIdx] = currentRound;

    // Se ambos enviaram palpite, avança para reveal
    if (currentRound.p0_guessed && currentRound.p1_guessed) {
      currentRound.is_revealed = true;
      state.phase = 'reveal';
      state.discoveriesCount += 1;
    }

    this.saveAndBroadcast(state);
  }

  async advancePhase(nextPhase: GamePhase): Promise<void> {
    if (!this.currentCode) return;
    const state = await this.getRoomState(this.currentCode);
    if (!state) return;

    const qIdx = state.currentQuestionIndex;
    const currentRound = state.rounds[qIdx] || {
      questionIndex: qIdx,
      p0_submitted: false,
      p1_submitted: false,
      p0_guessed: false,
      p1_guessed: false,
      is_revealed: false,
    };

    if (nextPhase === 'reveal' && !currentRound.is_revealed) {
      currentRound.is_revealed = true;
      state.discoveriesCount += 1;
    }

    state.phase = nextPhase;
    state.rounds[qIdx] = currentRound;
    this.saveAndBroadcast(state);
  }

  async sendReaction(fromPlayer: PlayerIndex, text: string, emoji: string): Promise<void> {
    if (!this.currentCode) return;
    const state = await this.getRoomState(this.currentCode);
    if (!state) return;

    const newReaction: SentReaction = {
      id: crypto.randomUUID(),
      fromPlayer,
      text,
      emoji,
      timestamp: Date.now(),
    };

    state.reactions = [...(state.reactions || []), newReaction].slice(-15);
    this.saveAndBroadcast(state);
  }

  async nextQuestion(): Promise<void> {
    if (!this.currentCode) return;
    const state = await this.getRoomState(this.currentCode);
    if (!state) return;

    const nextIdx = state.currentQuestionIndex + 1;
    state.currentQuestionIndex = nextIdx;
    state.phase = 'answering';
    state.rounds[nextIdx] = {
      questionIndex: nextIdx,
      p0_submitted: false,
      p1_submitted: false,
      p0_guessed: false,
      p1_guessed: false,
      is_revealed: false,
    };

    this.saveAndBroadcast(state);
  }

  async resetRoom(): Promise<void> {
    if (!this.currentCode) return;
    const state = await this.getRoomState(this.currentCode);
    if (!state) return;

    state.currentQuestionIndex = 0;
    state.phase = 'answering';
    state.rounds = {
      0: {
        questionIndex: 0,
        p0_submitted: false,
        p1_submitted: false,
        p0_guessed: false,
        p1_guessed: false,
        is_revealed: false,
      },
    };
    state.reactions = [];
    state.discoveriesCount = 0;

    this.saveAndBroadcast(state);
  }

  subscribe(code: string, callback: (state: RoomState) => void): () => void {
    const formattedCode = code.trim().toUpperCase();
    this.currentCode = formattedCode;
    this.listeners.add(callback);

    // 1. Conexão SSE com o servidor local (Permite comunicação instantânea entre Aba Normal e Aba Anônima!)
    try {
      this.eventSource?.close();
      const es = new EventSource(`/api/rooms/${formattedCode}/events`);
      this.eventSource = es;

      es.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as RoomState;
          if (parsed && parsed.code === formattedCode) {
            this.notify(parsed);
          }
        } catch {}
      };

      es.onerror = () => {
        // Se SSE falhar, mantemos BroadcastChannel e fallback
      };
    } catch {}

    // 2. BroadcastChannel para sincronização instantânea na mesma sessão
    if (typeof BroadcastChannel !== 'undefined') {
      if (!this.channel || this.channel.name !== `entre_nos_${formattedCode}`) {
        this.channel?.close();
        this.channel = new BroadcastChannel(`entre_nos_${formattedCode}`);
        this.channel.onmessage = (event) => {
          if (event.data?.type === 'SYNC_STATE' && event.data.payload) {
            this.notify(event.data.payload as RoomState);
          }
        };
      }
    }

    // 3. Storage event fallback
    const storageHandler = (e: StorageEvent) => {
      if (e.key === this.getStorageKey(formattedCode) && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          this.notify(parsed);
        } catch {}
      }
    };
    window.addEventListener('storage', storageHandler);

    // 4. Busca estado inicial (do servidor ou do storage local)
    this.getRoomState(formattedCode).then((state) => {
      if (state) callback(state);
    });

    return () => {
      this.listeners.delete(callback);
      window.removeEventListener('storage', storageHandler);
      if (this.listeners.size === 0) {
        this.channel?.close();
        this.channel = null;
        this.eventSource?.close();
        this.eventSource = null;
      }
    };
  }
}
