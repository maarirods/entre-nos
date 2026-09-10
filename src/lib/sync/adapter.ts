import { GamePhase, PlayerIndex, RoomState, SentReaction } from '../../types/game';

export interface GameSyncAdapter {
  createRoom(code: string, hostName: string): Promise<RoomState>;
  joinRoom(code: string, guestName: string): Promise<RoomState>;
  getRoomState(code: string): Promise<RoomState | null>;
  submitAnswer(playerIndex: PlayerIndex, answer: string): Promise<void>;
  submitGuess(playerIndex: PlayerIndex, guess: string): Promise<void>;
  advancePhase(nextPhase: GamePhase): Promise<void>;
  sendReaction(fromPlayer: PlayerIndex, text: string, emoji: string): Promise<void>;
  nextQuestion(): Promise<void>;
  resetRoom(): Promise<void>;
  subscribe(code: string, callback: (state: RoomState) => void): () => void;
}
