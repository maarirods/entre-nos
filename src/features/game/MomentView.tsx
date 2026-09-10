import React from 'react';
import { Question, ReactionPreset } from '../../types/game';
import { ReactionBar } from '../../components/ReactionBar';
import { Sparkles, MessageCircle, ArrowRight } from 'lucide-react';

interface MomentViewProps {
  question: Question;
  partnerName: string;
  onSendReaction: (preset: ReactionPreset) => void;
  onNextQuestion: () => void;
  isLastQuestion: boolean;
  onFinishGame: () => void;
}

export const MomentView: React.FC<MomentViewProps> = ({
  question,
  partnerName,
  onSendReaction,
  onNextQuestion,
  isLastQuestion,
  onFinishGame,
}) => {
  return (
    <div className="card center-text">
      <div className="hero-emoji">✨</div>
      <div className="category-badge" style={{ background: '#fef3c7', color: '#b45309', alignSelf: 'center' }}>
        MOMENTO DE CONEXÃO
      </div>

      <h2>Vocês descobriram algo novo hoje.</h2>
      <p className="subtitle">
        A pergunta era sobre: <strong>"{question.text}"</strong>
      </p>

      {question.followUp && (
        <div style={{
          background: '#fffbeb',
          borderLeft: '4px solid #f59e0b',
          borderRadius: '12px',
          padding: '16px',
          margin: '18px 0',
          textAlign: 'left',
          boxShadow: '0 2px 8px rgba(245, 158, 11, 0.08)'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#b45309', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MessageCircle size={14} />
            <span>PERGUNTA PARA APROFUNDAR A CONVERSA:</span>
          </div>
          <p style={{ fontSize: '15px', color: '#78350f', lineHeight: 1.5, fontWeight: 600 }}>
            {question.followUp}
          </p>
        </div>
      )}

      <div style={{
        background: '#f8fafc',
        borderRadius: '16px',
        padding: '14px',
        margin: '16px 0',
        color: '#64748b',
        fontSize: '13px',
        lineHeight: 1.5
      }}>
        💬 <em>"Se essa resposta rendeu assunto, pausem o jogo agora e conversem. O jogo pode esperar; a conexão de vocês é o que importa."</em> 🥰
      </div>

      {/* Barra de Reações e Afetos */}
      <ReactionBar onSendReaction={onSendReaction} partnerName={partnerName} />

      <div style={{ marginTop: '20px' }}>
        {isLastQuestion ? (
          <button
            type="button"
            className="btn-primary"
            onClick={onFinishGame}
          >
            <span>Ver nosso resumo de hoje 🥹💜</span>
            <Sparkles size={16} />
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary"
            onClick={onNextQuestion}
          >
            <span>Próxima pergunta 🌻</span>
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
