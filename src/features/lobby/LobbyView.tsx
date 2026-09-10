import React, { useState } from 'react';
import { RoomState } from '../../types/game';
import { Heart, Copy, Check, Share2, Sparkles, ArrowRight, BookOpen } from 'lucide-react';

interface LobbyViewProps {
  room: RoomState | null;
  loading: boolean;
  error: string | null;
  onCreateRoom: (code: string, name: string) => void;
  onJoinRoom: (code: string, name: string) => void;
  onStartGame: () => void;
  onOpenMemories: () => void;
}

function generateRandomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  room,
  loading,
  error,
  onCreateRoom,
  onJoinRoom,
  onStartGame,
  onOpenMemories,
}) => {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState<'home' | 'join'>('home');
  const [copied, setCopied] = useState(false);

  // Se a sala já foi criada e estamos aguardando a parceira
  if (room && room.phase === 'lobby') {
    const isPartnerConnected = room.names[1] !== 'Aguardando...';

    const handleCopy = () => {
      navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = () => {
      if (navigator.share) {
        navigator.share({
          title: 'Entre Nós 💜',
          text: `Vem jogar comigo! Entra com o código da nossa sala: ${room.code}`,
          url: window.location.href,
        }).catch(() => {});
      } else {
        handleCopy();
      }
    };

    return (
      <main className="app-shell">
        <section className="card center-text">
          <div className="hero-emoji">💜</div>
          <div
            className="category-badge"
            style={{
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.12), rgba(236, 72, 153, 0.12))',
              color: '#7c3aed',
              alignSelf: 'center',
              border: '1px solid rgba(124, 58, 237, 0.2)',
            }}
          >
            SALA CRIADA COM CARINHO 🌈
          </div>

          <h2>Aguardando sua parceira...</h2>
          <p className="subtitle">Mande esse código para ela entrar pelo próprio celular:</p>

          <div
            style={{
              fontSize: '38px',
              fontWeight: '900',
              letterSpacing: '0.18em',
              background: 'linear-gradient(180deg, #faf5ff 0%, #fff1f2 100%)',
              border: '2px dashed #f472b6',
              borderRadius: '24px',
              padding: '18px',
              margin: '16px 0',
              color: '#db2777',
              boxShadow: '0 8px 25px rgba(244, 114, 182, 0.15)',
            }}
          >
            {room.code}
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button type="button" className="btn-secondary" onClick={handleCopy}>
              {copied ? <Check size={18} color="#10b981" /> : <Copy size={18} />}
              <span>{copied ? 'Copiado!' : 'Copiar código'}</span>
            </button>
            <button type="button" className="btn-secondary" onClick={handleShare}>
              <Share2 size={18} />
              <span>Compartilhar</span>
            </button>
          </div>

          <div className={`status-pill ${isPartnerConnected ? 'status-ready' : 'status-waiting'}`} style={{ justifyContent: 'center' }}>
            <div className="pulse-dot" />
            <span>
              {isPartnerConnected
                ? `Ela entrou: ${room.names[1]} 🥰`
                : 'Aguardando ela conectar do celular dela...'}
            </span>
          </div>

          {isPartnerConnected && (
            <button type="button" className="btn-primary" onClick={onStartGame} style={{ marginTop: '10px' }}>
              <span>Começar o nosso jogo 💜</span>
              <ArrowRight size={18} />
            </button>
          )}

          <p className="hint" style={{ marginTop: '16px' }}>
            Vocês podem estar em casas diferentes. O jogo sincroniza as duas em tempo real! 🌻
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="card center-text" style={{ marginTop: '2vh' }}>
        <div className="hero-emoji">🌻 🌈 💜</div>
        
        <div
          className="category-badge"
          style={{
            background: 'linear-gradient(90deg, #ff4b7218, #facc1518, #0ea5e918, #ec489918)',
            color: '#db2777',
            alignSelf: 'center',
            border: '1.5px solid #fbcfe8',
            fontSize: '12px',
          }}
        >
          DUAS CASAS · DOIS CELULARES · UMA CONEXÃO
        </div>

        <h1>Entre Nós 💜</h1>
        <p className="subtitle">
          Um jogo afetivo para vocês se conhecerem de um jeito mais profundo, íntimo e colorido — cada uma no seu celular.
        </p>

        {mode === 'home' ? (
          <div>
            <div style={{ textAlign: 'left', marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '6px' }}>
                Seu nome ou apelido
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Como ela te chama?"
                autoFocus
              />
            </div>

            <button
              type="button"
              className="btn-primary"
              disabled={loading || !name.trim()}
              onClick={() => onCreateRoom(generateRandomCode(), name)}
            >
              <Heart size={18} fill="white" />
              <span>Criar nossa sala 💜</span>
            </button>

            <div style={{ margin: '18px 0 10px', color: '#94a3b8', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ flex: 1, height: '1.5px', background: '#e2e8f0' }} />
              <span style={{ fontWeight: 700 }}>ou</span>
              <span style={{ flex: 1, height: '1.5px', background: '#e2e8f0' }} />
            </div>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => setMode('join')}
            >
              <Sparkles size={18} />
              <span>Já tenho o código da sala</span>
            </button>
          </div>
        ) : (
          <div>
            <div style={{ textAlign: 'left', marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '6px' }}>
                Seu nome ou apelido
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Como ela te chama?"
                autoFocus
              />
            </div>

            <div style={{ textAlign: 'left', marginBottom: '18px' }}>
              <label style={{ fontSize: '13px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '6px' }}>
                Código da sala (5 dígitos)
              </label>
              <input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Ex: A7K92"
                maxLength={6}
                style={{ textAlign: 'center', fontSize: '22px', fontWeight: 900, letterSpacing: '0.12em', color: '#7c3aed' }}
              />
            </div>

            <button
              type="button"
              className="btn-primary"
              disabled={loading || !name.trim() || !roomCode.trim()}
              onClick={() => onJoinRoom(roomCode, name)}
            >
              <span>Entrar na sala com ela 🥰</span>
              <ArrowRight size={18} />
            </button>

            <button
              type="button"
              className="btn-ghost"
              onClick={() => setMode('home')}
              style={{ marginTop: '10px' }}
            >
              ← Voltar para criar sala
            </button>
          </div>
        )}

        {/* Botão de Memórias Permanentes no Lobby */}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1.5px dashed #f1f5f9' }}>
          <button
            type="button"
            onClick={onOpenMemories}
            style={{
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.08), rgba(124, 58, 237, 0.08))',
              border: '1.5px solid #fbcfe8',
              borderRadius: '999px',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 800,
              color: '#db2777',
              width: '100%',
              boxShadow: '0 2px 8px rgba(236, 72, 153, 0.08)',
            }}
          >
            <BookOpen size={16} />
            <span>📖 Ver nosso Álbum de Memórias 🌈</span>
          </button>
        </div>

        {error && (
          <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '16px', background: '#fef2f2', padding: '12px', borderRadius: '12px', fontWeight: 600 }}>
            {error}
          </p>
        )}
      </section>
    </main>
  );
};
