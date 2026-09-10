import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GamePhase, PlayerIndex, RoomState, SentReaction } from '../../types/game';
import { GameSyncAdapter } from './adapter';

export class SupabaseGameAdapter implements GameSyncAdapter {
  private client: SupabaseClient | null = null;
  private currentRoomId: string | null = null;
  private currentCode: string | null = null;
  private channel: any = null;

  constructor(url?: string, key?: string) {
    if (url && key && url.startsWith('http')) {
      this.client = createClient(url, key);
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async createRoom(code: string, hostName: string): Promise<RoomState> {
    if (!this.client) throw new Error('Supabase não configurado');
    const formattedCode = code.trim().toUpperCase();
    this.currentCode = formattedCode;

    // Chama a RPC create_room_with_host
    const sessionId = crypto.randomUUID();
    const { data, error } = await this.client.rpc('create_room_with_host', {
      p_code: formattedCode,
      p_host_name: hostName.trim(),
      p_session_id: sessionId,
    });

    if (error) throw error;
    this.currentRoomId = data.room_id;

    return {
      id: data.room_id,
      code: formattedCode,
      names: [hostName.trim(), 'Aguardando...'],
      phase: 'lobby',
      currentQuestionIndex: 0,
      rounds: { 0: { questionIndex: 0, p0_submitted: false, p1_submitted: false, p0_guessed: false, p1_guessed: false, is_revealed: false } },
      reactions: [],
      discoveriesCount: 0,
      lastUpdated: Date.now(),
    };
  }

  async joinRoom(code: string, guestName: string): Promise<RoomState> {
    if (!this.client) throw new Error('Supabase não configurado');
    const formattedCode = code.trim().toUpperCase();
    this.currentCode = formattedCode;

    const sessionId = crypto.randomUUID();
    const { data, error } = await this.client.rpc('join_room_as_guest', {
      p_code: formattedCode,
      p_guest_name: guestName.trim(),
      p_session_id: sessionId,
    });

    if (error) throw error;
    this.currentRoomId = data.room_id;

    const state = await this.getRoomState(formattedCode);
    if (!state) throw new Error('Erro ao buscar estado da sala');
    return state;
  }

  async getRoomState(code: string): Promise<RoomState | null> {
    if (!this.client) return null;
    const formattedCode = code.trim().toUpperCase();

    const { data: room, error: roomErr } = await this.client
      .from('rooms')
      .select('*, room_players(*), games(*, rounds(*))')
      .eq('code', formattedCode)
      .single();

    if (roomErr || !room) return null;

    const players = room.room_players || [];
    const p0 = players.find((p: any) => p.player_index === 0);
    const p1 = players.find((p: any) => p.player_index === 1);
    const game = room.games?.[0] || {};
    const roundsList = game.rounds || [];

    const roundsMap: Record<number, any> = {};
    roundsList.forEach((r: any) => {
      roundsMap[r.question_index] = {
        questionIndex: r.question_index,
        answer_p0: r.answer_p0,
        answer_p1: r.answer_p1,
        guess_p0: r.guess_p0,
        guess_p1: r.guess_p1,
        p0_submitted: r.p0_submitted,
        p1_submitted: r.p1_submitted,
        p0_guessed: r.p0_guessed,
        p1_guessed: r.p1_guessed,
        is_revealed: r.is_revealed,
      };
    });

    return {
      id: room.id,
      code: room.code,
      names: [p0?.name || 'Jogadora 1', p1?.name || 'Aguardando...'],
      phase: game.phase || 'lobby',
      currentQuestionIndex: game.current_question_index || 0,
      rounds: roundsMap,
      reactions: [],
      discoveriesCount: game.discoveries_count || 0,
      lastUpdated: Date.now(),
    };
  }

  async submitAnswer(playerIndex: PlayerIndex, answer: string): Promise<void> {
    if (!this.client || !this.currentRoomId) return;

    // Atualiza tabela rounds diretamente ou via broadcast
    const state = await this.getRoomState(this.currentCode || '');
    if (!state) return;

    const qIdx = state.currentQuestionIndex;
    const payload = playerIndex === 0
      ? { answer_p0: answer, p0_submitted: true }
      : { answer_p1: answer, p1_submitted: true };

    await this.client
      .from('rounds')
      .update(payload)
      .eq('question_index', qIdx);

    // Também emite via broadcast no canal para reação imediata
    this.channel?.send({
      type: 'broadcast',
      event: 'answer_submitted',
      payload: { playerIndex, qIdx },
    });
  }

  async submitGuess(playerIndex: PlayerIndex, guess: string): Promise<void> {
    if (!this.client || !this.currentRoomId) return;

    const state = await this.getRoomState(this.currentCode || '');
    if (!state) return;

    const qIdx = state.currentQuestionIndex;
    const payload = playerIndex === 0
      ? { guess_p0: guess, p0_guessed: true }
      : { guess_p1: guess, p1_guessed: true };

    await this.client
      .from('rounds')
      .update(payload)
      .eq('question_index', qIdx);

    this.channel?.send({
      type: 'broadcast',
      event: 'guess_submitted',
      payload: { playerIndex, qIdx },
    });
  }

  async advancePhase(nextPhase: GamePhase): Promise<void> {
    if (!this.client || !this.currentRoomId) return;

    await this.client
      .from('games')
      .update({ phase: nextPhase, updated_at: new Date().toISOString() })
      .eq('room_id', this.currentRoomId);

    this.channel?.send({
      type: 'broadcast',
      event: 'phase_changed',
      payload: { nextPhase },
    });
  }

  async sendReaction(fromPlayer: PlayerIndex, text: string, emoji: string): Promise<void> {
    if (!this.channel) return;

    const reaction: SentReaction = {
      id: crypto.randomUUID(),
      fromPlayer,
      text,
      emoji,
      timestamp: Date.now(),
    };

    this.channel.send({
      type: 'broadcast',
      event: 'reaction_sent',
      payload: reaction,
    });
  }

  async nextQuestion(): Promise<void> {
    if (!this.client || !this.currentRoomId) return;

    const state = await this.getRoomState(this.currentCode || '');
    if (!state) return;

    const nextIdx = state.currentQuestionIndex + 1;

    await this.client
      .from('games')
      .update({
        current_question_index: nextIdx,
        phase: 'answering',
        updated_at: new Date().toISOString(),
      })
      .eq('room_id', this.currentRoomId);

    this.channel?.send({
      type: 'broadcast',
      event: 'next_question',
      payload: { nextIdx },
    });
  }

  async resetRoom(): Promise<void> {
    if (!this.client || !this.currentRoomId) return;

    await this.client
      .from('games')
      .update({
        current_question_index: 0,
        phase: 'answering',
        discoveries_count: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('room_id', this.currentRoomId);

    this.channel?.send({
      type: 'broadcast',
      event: 'reset_game',
      payload: {},
    });
  }

  subscribe(code: string, callback: (state: RoomState) => void): () => void {
    if (!this.client) return () => {};
    const formattedCode = code.trim().toUpperCase();
    this.currentCode = formattedCode;

    // Inscreve no canal de broadcast da sala para sincronização em tempo real
    this.channel = this.client.channel(`room_${formattedCode}`, {
      config: { broadcast: { self: true } },
    });

    this.channel
      .on('broadcast', { event: '*' }, async () => {
        const fresh = await this.getRoomState(formattedCode);
        if (fresh) callback(fresh);
      })
      .subscribe();

    // Emite estado inicial
    this.getRoomState(formattedCode).then((state) => {
      if (state) callback(state);
    });

    return () => {
      if (this.channel) {
        this.client?.removeChannel(this.channel);
        this.channel = null;
      }
    };
  }
}
