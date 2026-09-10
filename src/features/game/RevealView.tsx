import React, { useEffect } from 'react';
import { Question, ReactionPreset } from '../../types/game';
import { ReactionBar } from '../../components/ReactionBar';
import confetti from 'canvas-confetti';
import { Heart, Sparkles, ArrowRight } from 'lucide-react';

interface RevealViewProps {
  question: Question;
  myName: string;
  partnerName: string;
  myAnswerText: string;
  partnerAnswerText: string;
  myGuessText: string;
  partnerGuessText: string;
  onSendReaction: (preset: ReactionPreset) => void;
  onAdvanceToMoment: () => void;
  onNextQuestion: () => void;
}

export const RevealView: React.FC<RevealViewProps> = ({
  question,
  myName,
  partnerName,
  myAnswerText,
  partnerAnswerText,
  myGuessText,
  partnerGuessText,
  onSendReaction,
  onAdvanceToMoment,
  onNextQuestion,
}) => {
  useEffect(() => {
    // Efeito de confete carinhoso na abertura da revelação
    confetti({
      particleCount: 35,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#7c3aed', '#ec4899', '#f59e0b'],
    });
  }, []);

  return (
    <div className="card">
      <div className="category-badge" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
        ✨ HORA DA REVELAÇÃO
      </div>

      <h2 style={{ fontSize: '18px', color: '#64748b', fontWeight: 600 }}>{question.text}</h2>

      <div className="reveal-grid">
        {/* Bloco 1: A resposta dela e o que você achou */}
        <div className="reveal-card highlight">
          <div className="reveal-header">
            <span>{partnerName.toUpperCase()} RESPONDEU:</span>
            <Heart size={14} color="#ec4899" fill="#ec4899" />
          </div>
          <div className="reveal-text">
            {partnerAnswerText ? `“${partnerAnswerText}”` : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Guardou para depois 👀</span>}
          </div>

          <div className="reveal-guess-badge">
            <span style={{ fontWeight: 700 }}>Seu palpite: </span>
            <span>{myGuessText || 'Não palpitou'}</span>
          </div>
        </div>

        {/* Bloco 2: A sua resposta e o que ela achou */}
        <div className="reveal-card">
          <div className="reveal-header">
            <span>VOCÊ RESPONDEU:</span>
            <Heart size={14} color="#7c3aed" fill="#7c3aed" />
          </div>
          <div className="reveal-text">
            {myAnswerText ? `“${myAnswerText}”` : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Guardou para depois 👀</span>}
          </div>

          <div className="reveal-guess-badge">
            <span style={{ fontWeight: 700 }}>Palpite dela: </span>
            <span>{partnerGuessText || 'Não palpitou'}</span>
          </div>
        </div>
      </div>

      {/* Barra de Reações e Respostas Programadas */}
      <ReactionBar onSendReaction={onSendReaction} partnerName={partnerName} />

      <div style={{ marginTop: '16px' }}>
        <button
          type="button"
          className="btn-primary"
          onClick={onAdvanceToMoment}
        >
          <Sparkles size={16} />
          <span>Ver o momento de conexão 💜</span>
        </button>

        <button
          type="button"
          className="btn-ghost"
          onClick={onNextQuestion}
          style={{ marginTop: '8px' }}
        >
          <span>Ir direto para a próxima pergunta</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
