import React, { useState } from 'react';
import { Question } from '../../types/game';
import { CATEGORIES } from '../../questions/catalog';
import { Lock, Send, ArrowRight, SkipForward } from 'lucide-react';

interface AnsweringViewProps {
  question: Question;
  myName: string;
  partnerName: string;
  hasMyAnswer: boolean;
  hasPartnerAnswer: boolean;
  mySavedAnswer: string;
  onSubmitAnswer: (text: string) => void;
  onAdvanceToGuessing: () => void;
  onSkipQuestion: () => void;
}

export const AnsweringView: React.FC<AnsweringViewProps> = ({
  question,
  myName,
  partnerName,
  hasMyAnswer,
  hasPartnerAnswer,
  mySavedAnswer,
  onSubmitAnswer,
  onAdvanceToGuessing,
  onSkipQuestion,
}) => {
  const [text, setText] = useState(mySavedAnswer || '');
  const cat = CATEGORIES[question.category] || CATEGORIES.comecando;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmitAnswer(text.trim());
    }
  };

  return (
    <div className="card">
      <div
        className="category-badge"
        style={{ background: `${cat.color}15`, color: cat.color }}
      >
        <span>{cat.emoji}</span>
        <span>{cat.label}</span>
      </div>

      <h2>{question.text}</h2>
      <p className="hint">
        Responda no seu celular com sinceridade. Sua parceira não conseguirá ler até a hora da revelação! 👀
      </p>

      {/* Status da parceira */}
      <div className={`status-pill ${hasPartnerAnswer ? 'status-ready' : 'status-waiting'}`}>
        <div className="pulse-dot" />
        <span>
          {hasPartnerAnswer
            ? `${partnerName} já terminou a resposta dela! 💜`
            : `${partnerName} está escrevendo no celular dela... ✍️`}
        </span>
      </div>

      {!hasMyAnswer ? (
        <form onSubmit={handleSubmit}>
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escreva sua resposta aqui com calma..."
            rows={4}
          />

          <button
            type="submit"
            className="btn-primary"
            disabled={!text.trim()}
            style={{ marginTop: '14px' }}
          >
            <Lock size={16} />
            <span>Guardar minha resposta 🔒</span>
          </button>
        </form>
      ) : (
        <div style={{ background: '#f8fafc', border: '1px solid #ede9fe', borderRadius: '16px', padding: '16px', margin: '10px 0' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#7c3aed', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={13} />
            <span>Sua resposta está guardada:</span>
          </div>
          <p style={{ fontStyle: 'italic', color: '#334155' }}>"{text || mySavedAnswer}"</p>
        </div>
      )}

      {/* Regra não-bloqueante: botões para avançar a qualquer momento */}
      <div style={{ marginTop: '12px' }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={onAdvanceToGuessing}
          style={{ marginTop: '8px' }}
        >
          <span>Ir para a fase de palpites</span>
          <ArrowRight size={16} />
        </button>

        <button
          type="button"
          className="btn-skip"
          onClick={onSkipQuestion}
        >
          <SkipForward size={14} />
          <span>Pular esta pergunta sem responder</span>
        </button>
      </div>
    </div>
  );
};
