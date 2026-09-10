import { useEffect, useState, useCallback, useMemo } from 'react';
import { GamePhase, PlayerIndex, RoomState, ReactionPreset } from '../types/game';
import { syncAdapter } from '../lib/sync';
import { INITIAL_QUESTIONS } from '../questions/catalog';
import { saveMemory } from '../lib/memories';

const STORAGE_SESSION_KEY = 'entre_nos_player_session';

interface PlayerSession {
  code: string;
  name: string;
  playerIndex: PlayerIndex;
}

export function useGameRoom() {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [session, setSession] = useState<PlayerSession | null>(() => {
    const saved = sessionStorage.getItem(STORAGE_SESSION_KEY);
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inscreve no adapter quando houver código de sala
  useEffect(() => {
    if (!session?.code) return;

    const unsubscribe = syncAdapter.subscribe(session.code, (updatedState) => {
      setRoom(updatedState);
    });

    return () => {
      unsubscribe();
    };
  }, [session?.code]);

  // Salva no Álbum de Memórias permanente automaticamente assim que a revelação acontecer
  useEffect(() => {
    if (!room) return;
    const qIdx = room.currentQuestionIndex;
    const round = room.rounds[qIdx];
    if (round && round.is_revealed) {
      const q = INITIAL_QUESTIONS[qIdx % INITIAL_QUESTIONS.length];
      saveMemory({
        questionId: q.id,
        questionText: q.text,
        category: q.category,
        nameP0: room.names[0] || 'Jogadora 1',
        nameP1: room.names[1] || 'Jogadora 2',
        answerP0: round.answer_p0 || '',
        answerP1: round.answer_p1 || '',
        guessP0: round.guess_p0 || '',
        guessP1: round.guess_p1 || '',
      });
    }
  }, [room?.currentQuestionIndex, room?.rounds, room?.names]);

  // Salva a sessão na sessionStorage (específica por aba)
  const saveSession = useCallback((sess: PlayerSession | null) => {
    setSession(sess);
    if (sess) {
      sessionStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(sess));
    } else {
      sessionStorage.removeItem(STORAGE_SESSION_KEY);
    }
  }, []);

  const createRoom = useCallback(async (code: string, hostName: string) => {
    try {
      setLoading(true);
      setError(null);
      const cleanCode = code.trim().toUpperCase();
      const state = await syncAdapter.createRoom(cleanCode, hostName);
      setRoom(state);
      saveSession({ code: cleanCode, name: hostName.trim(), playerIndex: 0 });
    } catch (err: any) {
      setError(err?.message || 'Erro ao criar sala');
    } finally {
      setLoading(false);
    }
  }, [saveSession]);

  const joinRoom = useCallback(async (code: string, guestName: string) => {
    try {
      setLoading(true);
      setError(null);
      const cleanCode = code.trim().toUpperCase();
      const state = await syncAdapter.joinRoom(cleanCode, guestName);
      setRoom(state);
      saveSession({ code: cleanCode, name: guestName.trim(), playerIndex: 1 });
    } catch (err: any) {
      setError(err?.message || 'Erro ao entrar na sala');
    } finally {
      setLoading(false);
    }
  }, [saveSession]);

  const submitAnswer = useCallback(async (answer: string) => {
    if (session?.playerIndex === undefined) return;
    try {
      await syncAdapter.submitAnswer(session.playerIndex, answer);
    } catch (err: any) {
      setError(err?.message || 'Erro ao enviar resposta');
    }
  }, [session?.playerIndex]);

  const submitGuess = useCallback(async (guess: string) => {
    if (session?.playerIndex === undefined) return;
    try {
      await syncAdapter.submitGuess(session.playerIndex, guess);
    } catch (err: any) {
      setError(err?.message || 'Erro ao enviar palpite');
    }
  }, [session?.playerIndex]);

  const advancePhase = useCallback(async (nextPhase: GamePhase) => {
    try {
      await syncAdapter.advancePhase(nextPhase);
    } catch (err: any) {
      setError(err?.message || 'Erro ao avançar fase');
    }
  }, []);

  const sendReaction = useCallback(async (preset: ReactionPreset) => {
    if (session?.playerIndex === undefined) return;
    try {
      await syncAdapter.sendReaction(session.playerIndex, preset.text, preset.emoji);
    } catch (err: any) {
      console.warn('Erro ao enviar reação:', err);
    }
  }, [session?.playerIndex]);

  const nextQuestion = useCallback(async () => {
    try {
      await syncAdapter.nextQuestion();
    } catch (err: any) {
      setError(err?.message || 'Erro ao ir para a próxima pergunta');
    }
  }, []);

  const resetGame = useCallback(async () => {
    try {
      await syncAdapter.resetRoom();
    } catch (err: any) {
      setError(err?.message || 'Erro ao reiniciar jogo');
    }
  }, []);

  const leaveRoom = useCallback(() => {
    saveSession(null);
    setRoom(null);
  }, [saveSession]);

  // Propriedades computadas
  const currentRound = useMemo(() => {
    if (!room) return null;
    return room.rounds[room.currentQuestionIndex] || null;
  }, [room]);

  const currentQuestion = useMemo(() => {
    if (!room) return INITIAL_QUESTIONS[0];
    const idx = room.currentQuestionIndex % INITIAL_QUESTIONS.length;
    return INITIAL_QUESTIONS[idx];
  }, [room]);

  const myPlayerIndex = session?.playerIndex ?? null;
  const partnerPlayerIndex: PlayerIndex | null = myPlayerIndex !== null ? (myPlayerIndex === 0 ? 1 : 0) : null;

  const myName = useMemo(() => {
    if (!room || myPlayerIndex === null) return session?.name || 'Você';
    return room.names[myPlayerIndex] || 'Você';
  }, [room, myPlayerIndex, session?.name]);

  const partnerName = useMemo(() => {
    if (!room || partnerPlayerIndex === null) return 'Sua parceira';
    const name = room.names[partnerPlayerIndex];
    return name === 'Aguardando...' ? 'Sua parceira' : name;
  }, [room, partnerPlayerIndex]);

  const hasMyAnswer = useMemo(() => {
    if (!currentRound || myPlayerIndex === null) return false;
    return myPlayerIndex === 0 ? currentRound.p0_submitted : currentRound.p1_submitted;
  }, [currentRound, myPlayerIndex]);

  const hasPartnerAnswer = useMemo(() => {
    if (!currentRound || partnerPlayerIndex === null) return false;
    return partnerPlayerIndex === 0 ? currentRound.p0_submitted : currentRound.p1_submitted;
  }, [currentRound, partnerPlayerIndex]);

  const hasMyGuess = useMemo(() => {
    if (!currentRound || myPlayerIndex === null) return false;
    return myPlayerIndex === 0 ? currentRound.p0_guessed : currentRound.p1_guessed;
  }, [currentRound, myPlayerIndex]);

  const hasPartnerGuess = useMemo(() => {
    if (!currentRound || partnerPlayerIndex === null) return false;
    return partnerPlayerIndex === 0 ? currentRound.p0_guessed : currentRound.p1_guessed;
  }, [currentRound, partnerPlayerIndex]);

  const myAnswerText = useMemo(() => {
    if (!currentRound || myPlayerIndex === null) return '';
    return myPlayerIndex === 0 ? (currentRound.answer_p0 || '') : (currentRound.answer_p1 || '');
  }, [currentRound, myPlayerIndex]);

  const partnerAnswerText = useMemo(() => {
    if (!currentRound || partnerPlayerIndex === null) return '';
    return partnerPlayerIndex === 0 ? (currentRound.answer_p0 || '') : (currentRound.answer_p1 || '');
  }, [currentRound, partnerPlayerIndex]);

  const myGuessText = useMemo(() => {
    if (!currentRound || myPlayerIndex === null) return '';
    return myPlayerIndex === 0 ? (currentRound.guess_p0 || '') : (currentRound.guess_p1 || '');
  }, [currentRound, myPlayerIndex]);

  const partnerGuessText = useMemo(() => {
    if (!currentRound || partnerPlayerIndex === null) return '';
    return partnerPlayerIndex === 0 ? (currentRound.guess_p0 || '') : (currentRound.guess_p1 || '');
  }, [currentRound, partnerPlayerIndex]);

  return {
    room,
    session,
    loading,
    error,
    myPlayerIndex,
    partnerPlayerIndex,
    myName,
    partnerName,
    currentQuestion,
    currentRound,
    hasMyAnswer,
    hasPartnerAnswer,
    hasMyGuess,
    hasPartnerGuess,
    myAnswerText,
    partnerAnswerText,
    myGuessText,
    partnerGuessText,
    createRoom,
    joinRoom,
    submitAnswer,
    submitGuess,
    advancePhase,
    sendReaction,
    nextQuestion,
    resetGame,
    leaveRoom,
  };
}
