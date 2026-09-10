import React, { useState } from 'react';
import { REACTION_PRESETS } from '../domain/reactions';
import { ReactionPreset } from '../types/game';
import { Sparkles, Heart } from 'lucide-react';

interface ReactionBarProps {
  onSendReaction: (preset: ReactionPreset) => void;
  partnerName: string;
}

export const ReactionBar: React.FC<ReactionBarProps> = ({ onSendReaction, partnerName }) => {
  const [sentId, setSentId] = useState<string | null>(null);

  const handleClick = (preset: ReactionPreset) => {
    onSendReaction(preset);
    setSentId(preset.id);
    setTimeout(() => setSentId(null), 2500);
  };

  return (
    <div className="reaction-bar">
      <div className="reaction-bar-title">
        <Sparkles size={14} />
        <span>Reações com carinho para {partnerName}</span>
      </div>

      <div className="reaction-chips">
        {REACTION_PRESETS.map((preset) => {
          const isJustSent = sentId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              className="reaction-chip"
              onClick={() => handleClick(preset)}
              style={isJustSent ? { borderColor: '#7c3aed', background: '#f5f3ff', color: '#7c3aed' } : {}}
            >
              <span>{preset.emoji}</span>
              <span>{preset.text}</span>
              {isJustSent && <Heart size={13} fill="#7c3aed" color="#7c3aed" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
