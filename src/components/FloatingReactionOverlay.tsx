import React, { useEffect, useState } from 'react';
import { PlayerIndex, SentReaction } from '../types/game';
import confetti from 'canvas-confetti';

interface FloatingReactionOverlayProps {
  reactions: SentReaction[];
  myPlayerIndex: PlayerIndex | null;
  partnerName: string;
}

export const FloatingReactionOverlay: React.FC<FloatingReactionOverlayProps> = ({
  reactions,
  myPlayerIndex,
  partnerName,
}) => {
  const [activeToast, setActiveToast] = useState<SentReaction | null>(null);

  useEffect(() => {
    if (!reactions || reactions.length === 0 || myPlayerIndex === null) return;

    const latest = reactions[reactions.length - 1];
    // Se a reação veio da parceira e foi recente (últimos 4 segundos)
    if (latest.fromPlayer !== myPlayerIndex && Date.now() - latest.timestamp < 4000) {
      setActiveToast(latest);

      // Dispara confete romântico sutil se for reação com coração ou girassol
      if (latest.emoji === '💜' || latest.emoji === '🌻' || latest.emoji === '✨') {
        confetti({
          particleCount: 25,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#7c3aed', '#ec4899', '#f59e0b'],
        });
      }

      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [reactions, myPlayerIndex]);

  if (!activeToast) return null;

  return (
    <div className="floating-reaction">
      <span style={{ fontSize: '20px' }}>{activeToast.emoji}</span>
      <div>
        <span style={{ opacity: 0.8, fontSize: '11px', display: 'block' }}>{partnerName} te enviou:</span>
        <span>{activeToast.text}</span>
      </div>
    </div>
  );
};
