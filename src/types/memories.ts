import { CategoryKey } from './game';

export interface SavedMemory {
  id: string;
  questionId: number;
  questionText: string;
  category: CategoryKey;
  nameP0: string;
  nameP1: string;
  answerP0: string;
  answerP1: string;
  guessP0?: string;
  guessP1?: string;
  timestamp: number;
}
