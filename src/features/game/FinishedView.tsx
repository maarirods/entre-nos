import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Heart, RefreshCw, Home, BookOpen } from 'lucide-react';
import { MemoriesModal } from '../memories/MemoriesModal';

interface FinishedViewProps {
  names: [string, string];
  discoveriesCount: number;
  onPlayAgain: () => void;
  onExit: () => void;
}

export const FinishedView: React.FC<FinishedViewProps> = ({
  names,
  discoveriesCount,
  onPlayAgain,
  onExit,
}) => {
  const [showMemories, setShowMemories] = useState(false);

  useEffect(() => {
    confetti({
      particleCount: 80,
      spread: 120,
      origin: { y: 0.5 },
      colors: ['#ff2a6d', '#ff7a00', '#ffc400', '#00d26a', '#00a8ff', '#7c3aed', '#f72585'],
    });
  }, []);

  return (
    <div className="card center-text">
      <MemoriesModal isOpen={showMemories} onClose={() => setShowMemories(false)} />

      <div className="hero-emoji">🥹🌈💜</div>
      <div
        className="category-badge"
        style={{
          background: 'linear-gradient(90deg, #ff4b7218, #facc1518, #0ea5e918, #ec489918)',
          color: '#db2777',
          alignSelf: 'center',
          border: '1.5px solid #fbcfe8',
        }}
      >
        FIM DA NOSSA RODADA
      </div>

      <h1>Vocês descobriram {discoveriesCount} coisas novas hoje!</h1>
      <p className="subtitle" style={{ fontSize: '16px', lineHeight: 1.6 }}>
        Entre <strong>{names[0]}</strong> e <strong>{names[1]}</strong>, existem momentos, risadas e conversas que agora pertencem só a vocês duas.
      </p>

      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 42, 109, 0.08), rgba(124, 58, 237, 0.08), rgba(0, 168, 255, 0.08))',
        border: '2px solid rgba(236, 72, 153, 0.25)',
        borderRadius: '24px',
        padding: '24px 16px',
        margin: '20px 0',
      }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🌻 🫶 🌈 🌙</div>
        <p style={{ fontSize: '14px', color: '#334155', fontStyle: 'italic', lineHeight: 1.5, fontWeight: 600 }}>
          "O que importa não é adivinhar tudo certo, é a vontade de continuar conhecendo uma à outra todos os dias."
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          type="button"
          onClick={() => setShowMemories(true)}
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
            color: '#ffffff',
            boxShadow: '0 8px 22px rgba(236, 72, 153, 0.35)',
          }}
        >
          <BookOpen size={16} />
          <span>Abrir nosso Álbum de Memórias 📖🌈</span>
        </button>

        <button
          type="button"
          className="btn-secondary"
          onClick={onPlayAgain}
        >
          <RefreshCw size={16} />
          <span>Jogar novamente desde a 1ª pergunta</span>
        </button>

        <button
          type="button"
          className="btn-ghost"
          onClick={onExit}
        >
          <Home size={16} />
          <span>Voltar ao início</span>
        </button>
      </div>
    </div>
  );
};
