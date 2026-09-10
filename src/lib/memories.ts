import { SavedMemory } from '../types/memories';

const MEMORIES_STORAGE_KEY = 'entre_nos_album_memorias_persistente';

export function loadMemories(): SavedMemory[] {
  try {
    const raw = localStorage.getItem(MEMORIES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Erro ao carregar memórias:', err);
    return [];
  }
}

export function saveMemory(memoryData: Omit<SavedMemory, 'id' | 'timestamp'>): SavedMemory {
  const existingList = loadMemories();
  
  // Verifica se já existe uma memória para essa mesma pergunta
  const existingIdx = existingList.findIndex(
    (m) => m.questionText.trim().toLowerCase() === memoryData.questionText.trim().toLowerCase()
  );

  const newEntry: SavedMemory = {
    ...memoryData,
    id: existingIdx >= 0 ? existingList[existingIdx].id : crypto.randomUUID(),
    timestamp: Date.now(),
  };

  let updated: SavedMemory[];
  if (existingIdx >= 0) {
    updated = [...existingList];
    updated[existingIdx] = newEntry;
  } else {
    updated = [newEntry, ...existingList];
  }

  try {
    localStorage.setItem(MEMORIES_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Erro ao salvar no storage de memórias:', err);
  }

  return newEntry;
}

export function clearMemories(): void {
  localStorage.removeItem(MEMORIES_STORAGE_KEY);
}
