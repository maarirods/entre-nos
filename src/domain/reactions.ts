import { ReactionPreset } from '../types/game';

export const REACTION_PRESETS: ReactionPreset[] = [
  { id: 'loved', text: 'Amei essa resposta 🥹💜', emoji: '💜' },
  { id: 'surprised', text: 'Você me surpreendeu demais! 🥰', emoji: '✨' },
  { id: 'so_you', text: 'Isso é tão a sua cara! 😂', emoji: '🥰' },
  { id: 'butterflies', text: 'Fiquei com borboletas no estômago... 🦋', emoji: '🦋' },
  { id: 'pillow_talk', text: 'Quero falar mais disso no travesseiro 👀', emoji: '👀' },
  { id: 'sunflower', text: 'Ganhou meu coração de novo 🌻', emoji: '🌻' },
  { id: 'falling_more', text: 'Me apaixonei mais um pouquinho 🙈', emoji: '🔥' },
  { id: 'tell_more', text: 'Promete que me conta mais? 🥺', emoji: '🥹' },
];

export const FLOATING_EMOJIS = ['💜', '🌻', '🥹', '✨', '🔥', '🦋', '🥰', '👀'];
