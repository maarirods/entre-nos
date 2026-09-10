import React, { useState } from 'react';
import { Question } from '../../types/game';
import { CATEGORIES } from '../../questions/catalog';
import { Sparkles, Send, ArrowRight, SkipForward } from 'lucide-react';

interface GuessingViewProps {
  question: Question;
  myName: string;
  partnerName: string;
  hasMyGuess: boolean;
  hasPartnerGuess: boolean;
  mySavedGuess: string;
  onSubmitGuess: (guess: string) => void;
  onAdvanceToReveal: () => void;
  onSkipQuestion: () => void;
}

export const GuessingView: React.FC<GuessingViewProps> = ({
  question,
  myName,
  partnerName,
  hasMyGuess,
  hasPartnerGuess,
  mySavedGuess,
  onSubmitGuess,
  onAdvanceToReveal,
  onSkipQuestion,
}) => {
  const [guess, setGuess] = useState(mySavedGuess || '');
  const cat = CATEGORIES[question.category] || CATEGORIES.comecando;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guess.trim()) {
      onSubmitGuess(guess.trim());
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

      <p style={{ fontSize: '12px', fontWeight: 800, color: '#7c3aed', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        Hora do palpite 👀
      </p>
      <h2>O que você acha que {partnerName} respondeu?</h2>
      <p className="subtitle" style={{ fontStyle: 'italic', marginBottom: '16px' }}>
        "{question.text}"
      </p>

      {/* Status de envio do palpite da parceira */}
      <div className={`status-pill ${hasPartnerGuess ? 'status-ready' : 'status-waiting'}`}>
        <div className="pulse-dot" />
        <span>
          {hasPartnerGuess
            ? `${partnerName} já enviou o palpite sobre você! 👀`
            : `${partnerName} está quebrando a cabeça para adivinhar o que você colocou... 😂`}
        </span>
      </div>

      {!hasMyGuess ? (
        <form onSubmit={handleSubmit}>
          <textarea
            autoFocus
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder={`Eu aposto que ela respondeu...`}
            rows={3}
          />

          <button
            type="submit"
            className="btn-primary"
            disabled={!guess.trim()}
            style={{ marginTop: '14px' }}
          >
            <Send size={16} />
            <span>Enviar meu palpite</span>
          </button>
        </form>
      ) : (
        <div style={{ background: '#faf5ff', border: '1px solid #ddd6fe', borderRadius: '16px', padding: '16px', margin: '10px 0' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#7c3aed', marginBottom: '4px' }}>
            Seu palpite sobre ela:
          </div>
          <p style={{ fontStyle: 'italic', color: '#1e1b4b' }}>"{guess || mySavedGuess}"</p>
        </div>
      )}

      {/* Botões de avanço livre */}
      <div style={{ marginTop: '12px' }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={onAdvanceToReveal}
          style={{ marginTop: '8px' }}
        >
          <Sparkles size={16} color="#7c3aed" />
          <span>Revelar respostas agora ✨</span>
        </button>

        <button
          type="button"
          className="btn-skip"
          onClick={onSkipQuestion}
        >
          <SkipForward size={14} />
          <span>Pular para a próxima pergunta</span>
        </button>
      </div>
    </div>
  );
};
