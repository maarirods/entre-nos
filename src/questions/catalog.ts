import { CategoryKey, Question } from '../types/game';

export interface CategoryInfo {
  key: CategoryKey;
  label: string;
  emoji: string;
  color: string;
  description: string;
}

export const CATEGORIES: Record<CategoryKey, CategoryInfo> = {
  comecando: {
    key: 'comecando',
    label: 'Começando',
    emoji: '🌱',
    color: '#10b981',
    description: 'Leve, curioso e divertido para quebrar o gelo.',
  },
  'me-conheca': {
    key: 'me-conheca',
    label: 'Me Conheça',
    emoji: '💗',
    color: '#ec4899',
    description: 'Vulnerabilidade, sentimentos e como gostamos de ser cuidadas.',
  },
  'entre-nos': {
    key: 'entre-nos',
    label: 'Entre Nós',
    emoji: '🫶',
    color: '#8b5cf6',
    description: 'Sobre a relação, carinho, sintonia e descobertas mútuas.',
  },
  'depois-das-23': {
    key: 'depois-das-23',
    label: 'Depois das 23h',
    emoji: '🌙',
    color: '#6366f1',
    description: 'Intimidade, toque, romance e coisas que dão frio na barriga 👀',
  },
  'nossa-historia': {
    key: 'nossa-historia',
    label: 'Nossa História',
    emoji: '🌻',
    color: '#f59e0b',
    description: 'Momentos especiais, lembranças e os marcos de vocês duas.',
  },
};

export const INITIAL_QUESTIONS: Question[] = [
  // 1. Começando 🌱
  {
    id: 1,
    category: 'comecando',
    text: 'Qual coisa pequena consegue melhorar o seu dia imediatamente?',
    followUp: 'Tem alguma vez recente que isso aconteceu?',
  },
  {
    id: 2,
    category: 'comecando',
    text: 'Qual é uma mania ou hábito seu que quase ninguém conhece?',
    followUp: 'Quando foi a última vez que você se pegou fazendo isso?',
  },
  {
    id: 3,
    category: 'comecando',
    text: 'Qual memória da sua infância você guarda com mais carinho no peito?',
    followUp: 'Quem estava com você nesse dia?',
  },

  // 2. Me Conheça 💗
  {
    id: 4,
    category: 'me-conheca',
    text: 'O que faz você se sentir verdadeiramente segura e acolhida com alguém?',
    followUp: 'E como uma pessoa percebe que você baixou a guarda com ela?',
  },
  {
    id: 5,
    category: 'me-conheca',
    text: 'O que você gostaria que uma parceira percebesse sobre você sem você precisar pedir?',
    followUp: 'É difícil para você expressar essa necessidade?',
  },
  {
    id: 6,
    category: 'me-conheca',
    text: 'Qual parte sua você demora mais para mostrar quando começa a gostar de alguém?',
    followUp: 'Você já mostrou essa parte para mim?',
  },

  // 3. Entre Nós 🫶
  {
    id: 7,
    category: 'entre-nos',
    text: 'Quando você percebeu que o que estava acontecendo entre a gente era especial e diferente?',
    followUp: 'O que você sentiu exatamente naquele momento?',
  },
  {
    id: 8,
    category: 'entre-nos',
    text: 'O que você mais gosta na forma como a gente se trata e se cuida?',
    followUp: 'Tem algum momento específico que representa muito isso para você?',
  },
  {
    id: 9,
    category: 'entre-nos',
    text: 'Tem alguma coisa em mim que te surpreendeu bastante conforme fomos nos conhecendo?',
    followUp: 'Era muito diferente da primeira impressão?',
  },

  // 4. Depois das 23h 🌙
  {
    id: 10,
    category: 'depois-das-23',
    text: 'O que faz você se sentir verdadeiramente desejada por uma parceira?',
    followUp: 'Um olhar, uma palavra, um toque sutil... o que mais mexe com você?',
  },
  {
    id: 11,
    category: 'depois-das-23',
    text: 'Qual tipo de carinho e toque você mais gosta de receber quando estamos juntinhas?',
    followUp: 'Tem algum lugar ou jeitinho que te desconcerta na hora?',
  },
  {
    id: 12,
    category: 'depois-das-23',
    text: 'O que deixa um momento a dois inesquecível e com aquela química que fica no ar?',
    followUp: 'Tem alguma memória nossa que te dá essa sensação?',
  },

  // 5. Nossa História 🌻
  {
    id: 13,
    category: 'nossa-historia',
    text: 'Qual momento nosso você guarda com mais carinho e sorriso no rosto até agora?',
    followUp: 'Se você pudesse reviver esses minutos agora, o que faria?',
  },
  {
    id: 14,
    category: 'nossa-historia',
    text: 'O que você acha que está descobrindo sobre você mesma desde que me conheceu?',
    followUp: 'Essa descoberta te assustou ou te fez bem?',
  },
  {
    id: 15,
    category: 'nossa-historia',
    text: 'Qual é uma coisa sobre você que você gostaria muito que eu conhecesse, mas ainda não teve oportunidade de contar?',
    followUp: 'Pode contar agora com calma, sem pressa. Eu quero ouvir. 💜',
  },
];
