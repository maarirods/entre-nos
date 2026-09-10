import React, { useState } from 'react';
import { useGameRoom } from './hooks/useGameRoom';
import { LobbyView } from './features/lobby/LobbyView';
import { AnsweringView } from './features/game/AnsweringView';
import { GuessingView } from './features/game/GuessingView';
import { RevealView } from './features/game/RevealView';
import { MomentView } from './features/game/MomentView';
import { FinishedView } from './features/game/FinishedView';
import { FloatingReactionOverlay } from './components/FloatingReactionOverlay';
import { MemoriesModal } from './features/memories/MemoriesModal';
import { INITIAL_QUESTIONS } from './questions/catalog';
import { Heart, LogOut, BookOpen } from 'lucide-react';
import './styles.css';

export function App() {
  const [showMemories, setShowMemories] = useState(false);

  const {
    room,
    loading,
    error,
    myPlayerIndex,
    myName,
    partnerName,
    currentQuestion,
    hasMyAnswer,
    hasPartnerAnswer,
    hasMyGuess,
    hasPartnerGuess,
    myAnswerText,
    partnerAnswerText,
    myGuessText,
    partnerGuessText,
    createRoom,
    joinRoom,
    submitAnswer,
    submitGuess,
    advancePhase,
    sendReaction,
    nextQuestion,
    resetGame,
    leaveRoom,
  } = useGameRoom();

  // Se não estiver em nenhuma sala ou estiver aguardando no lobby
  if (!room || room.phase === 'lobby') {
    return (
      <>
        <LobbyView
          room={room}
          loading={loading}
          error={error}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          onStartGame={() => advancePhase('answering')}
          onOpenMemories={() => setShowMemories(true)}
        />
        <MemoriesModal
          isOpen={showMemories}
          onClose={() => setShowMemories(false)}
        />
      </>
    );
  }

  const currentIdx = room.currentQuestionIndex;
  const totalQuestions = INITIAL_QUESTIONS.length;
  const progressPercent = Math.min(100, Math.round(((currentIdx + 1) / totalQuestions) * 100));
  const isLast = currentIdx >= totalQuestions - 1;

  return (
    <div className="app-shell">
      {/* Toast Flutuante de Reações em Tempo Real */}
      <FloatingReactionOverlay
        reactions={room.reactions || []}
        myPlayerIndex={myPlayerIndex}
        partnerName={partnerName}
      />

      {/* Modal do Álbum de Memórias Permanente */}
      <MemoriesModal
        isOpen={showMemories}
        onClose={() => setShowMemories(false)}
      />

      {/* Barra de Topo Limpa e Legível */}
      <header className="top-bar">
        <div className="brand-badge">
          <Heart size={18} fill="#7c3aed" color="#7c3aed" />
          <span>Entre Nós 💜</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn-memories-pill"
            onClick={() => setShowMemories(true)}
            title="Abrir nosso álbum de memórias"
          >
            <BookOpen size={13} />
            <span>Memórias</span>
          </button>

          <span className="room-tag">SALA {room.code}</span>
          <span className="players-indicator">
            {currentIdx + 1}/{totalQuestions}
          </span>
          <button
            type="button"
            onClick={leaveRoom}
            title="Sair da sala"
            style={{ background: 'transparent', minHeight: 'auto', padding: '4px 6px', color: '#94a3b8' }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Barra de Progresso com Gradiente Arco-Íris Animado */}
      <div className="progress-bar-container">
        <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      {/* Roteamento de Fases com Avanço Não-Bloqueante */}
      {room.phase === 'answering' && (
        <AnsweringView
          question={currentQuestion}
          myName={myName}
          partnerName={partnerName}
          hasMyAnswer={hasMyAnswer}
          hasPartnerAnswer={hasPartnerAnswer}
          mySavedAnswer={myAnswerText}
          onSubmitAnswer={submitAnswer}
          onAdvanceToGuessing={() => advancePhase('guessing')}
          onSkipQuestion={nextQuestion}
        />
      )}

      {room.phase === 'guessing' && (
        <GuessingView
          question={currentQuestion}
          myName={myName}
          partnerName={partnerName}
          hasMyGuess={hasMyGuess}
          hasPartnerGuess={hasPartnerGuess}
          mySavedGuess={myGuessText}
          onSubmitGuess={submitGuess}
          onAdvanceToReveal={() => advancePhase('reveal')}
          onSkipQuestion={nextQuestion}
        />
      )}

      {room.phase === 'reveal' && (
        <RevealView
          question={currentQuestion}
          myName={myName}
          partnerName={partnerName}
          myAnswerText={myAnswerText}
          partnerAnswerText={partnerAnswerText}
          myGuessText={myGuessText}
          partnerGuessText={partnerGuessText}
          onSendReaction={sendReaction}
          onAdvanceToMoment={() => advancePhase('moment')}
          onNextQuestion={nextQuestion}
        />
      )}

      {room.phase === 'moment' && (
        <MomentView
          question={currentQuestion}
          partnerName={partnerName}
          onSendReaction={sendReaction}
          onNextQuestion={nextQuestion}
          isLastQuestion={isLast}
          onFinishGame={() => advancePhase('finished')}
        />
      )}

      {room.phase === 'finished' && (
        <FinishedView
          names={room.names}
          discoveriesCount={room.discoveriesCount}
          onPlayAgain={resetGame}
          onExit={leaveRoom}
        />
      )}
    </div>
  );
}

export default App;
