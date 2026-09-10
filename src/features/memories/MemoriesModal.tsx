import React, { useState, useEffect } from 'react';
import { loadMemories } from '../../lib/memories';
import { SavedMemory } from '../../types/memories';
import { CATEGORIES } from '../../questions/catalog';
import { CategoryKey } from '../../types/game';
import { X, BookOpen, Heart, Calendar, Search } from 'lucide-react';

interface MemoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MemoriesModal: React.FC<MemoriesModalProps> = ({ isOpen, onClose }) => {
  const [memories, setMemories] = useState<SavedMemory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMemories(loadMemories());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredMemories = memories.filter((m) => {
    const matchCat = selectedCategory === 'all' || m.category === selectedCategory;
    const matchSearch =
      m.questionText.toLowerCase().includes(search.toLowerCase()) ||
      m.answerP0.toLowerCase().includes(search.toLowerCase()) ||
      m.answerP1.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(8px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        background: '#ffffff',
        width: 'min(580px, 100%)',
        maxHeight: '90dvh',
        borderRadius: '28px',
        boxShadow: '0 25px 60px rgba(236, 72, 153, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '2px solid rgba(236, 72, 153, 0.2)',
      }}>
        {/* Header com gradiente arco-íris */}
        <div style={{
          background: 'linear-gradient(135deg, #ff4b72, #f97316, #facc15, #10b981, #0ea5e9, #8b5cf6, #ec4899)',
          padding: '20px 24px',
          color: '#ffffff',
          position: 'relative',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'rgba(255,255,255,0.25)', padding: '8px', borderRadius: '12px' }}>
                <BookOpen size={22} color="#ffffff" />
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                  Nosso Álbum de Memórias 📖🌈
                </h2>
                <span style={{ fontSize: '12px', opacity: 0.9 }}>
                  {memories.length} {memories.length === 1 ? 'pergunta eternizada' : 'perguntas eternizadas'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.25)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                minHeight: 'auto',
                padding: 0,
                color: '#ffffff',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar em nossas respostas..."
              style={{
                paddingLeft: '40px',
                paddingTop: '10px',
                paddingBottom: '10px',
                fontSize: '14px',
                borderRadius: '999px',
                background: '#ffffff',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                minHeight: 'auto',
                borderRadius: '999px',
                background: selectedCategory === 'all' ? 'linear-gradient(135deg, #7c3aed, #ec4899)' : '#ffffff',
                color: selectedCategory === 'all' ? '#ffffff' : '#64748b',
                border: '1px solid #e2e8f0',
                whiteSpace: 'nowrap',
              }}
            >
              🌈 Todas
            </button>
            {Object.values(CATEGORIES).map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                style={{
                  padding: '6px 14px',
                  fontSize: '12px',
                  minHeight: 'auto',
                  borderRadius: '999px',
                  background: selectedCategory === cat.key ? cat.color : '#ffffff',
                  color: selectedCategory === cat.key ? '#ffffff' : '#64748b',
                  border: '1px solid #e2e8f0',
                  whiteSpace: 'nowrap',
                }}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Memórias */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {filteredMemories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📖✨</div>
              <h3 style={{ fontSize: '18px', color: '#475569', fontWeight: 700, marginBottom: '6px' }}>
                Nenhuma memória encontrada
              </h3>
              <p style={{ fontSize: '14px', lineHeight: 1.5 }}>
                Conforme vocês forem jogando e revelando as respostas, elas ficarão guardadas aqui para sempre, mesmo se criarem salas novas!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredMemories.map((mem) => {
                const cat = CATEGORIES[mem.category] || CATEGORIES.comecando;
                const formattedDate = new Date(mem.timestamp).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                });

                return (
                  <div
                    key={mem.id}
                    style={{
                      border: '1.5px solid #ede9fe',
                      borderRadius: '20px',
                      padding: '18px',
                      background: '#ffffff',
                      boxShadow: '0 4px 14px rgba(124, 58, 237, 0.05)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '4px 10px',
                          borderRadius: '999px',
                          background: `${cat.color}15`,
                          color: cat.color,
                        }}
                      >
                        {cat.emoji} {cat.label}
                      </span>
                      <span style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} />
                        {formattedDate}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '15px', color: '#1e1b4b', fontWeight: 700, marginBottom: '14px', lineHeight: 1.4 }}>
                      {mem.questionText}
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {/* Resposta P0 */}
                      <div style={{ background: '#faf5ff', borderRadius: '14px', padding: '12px 14px', borderLeft: '3px solid #8b5cf6' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#7c3aed', marginBottom: '4px' }}>
                          {mem.nameP0.toUpperCase()}:
                        </div>
                        <p style={{ fontSize: '14px', color: '#334155', fontStyle: 'italic', margin: 0 }}>
                          "{mem.answerP0 || 'Guardou para depois 👀'}"
                        </p>
                      </div>

                      {/* Resposta P1 */}
                      <div style={{ background: '#fdf2f8', borderRadius: '14px', padding: '12px 14px', borderLeft: '3px solid #ec4899' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#db2777', marginBottom: '4px' }}>
                          {mem.nameP1.toUpperCase()}:
                        </div>
                        <p style={{ fontSize: '14px', color: '#334155', fontStyle: 'italic', margin: 0 }}>
                          "{mem.answerP1 || 'Guardou para depois 👀'}"
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
