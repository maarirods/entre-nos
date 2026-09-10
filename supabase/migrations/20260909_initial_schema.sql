-- ==============================================================================
-- ENTRE NÓS 💜 - SCHEMA INICIAL POSTGRESQL / SUPABASE
-- Data: 09/09/2026
-- Dinâmica: Espelhada / Simultânea com Avanço Não-Bloqueante & Reações Afetivas
-- ==============================================================================

-- Habilita UUID caso ainda não esteja habilitado
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE SALAS (ROOMS)
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(6) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'waiting', -- 'waiting', 'playing', 'finished'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_rooms_code ON public.rooms(code);

-- 2. TABELA DE JOGADORAS NA SALA (ROOM_PLAYERS)
CREATE TABLE IF NOT EXISTS public.room_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    session_id VARCHAR(64) NOT NULL,
    name VARCHAR(50) NOT NULL,
    player_index INT NOT NULL CHECK (player_index IN (0, 1)),
    is_online BOOLEAN NOT NULL DEFAULT TRUE,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(room_id, player_index),
    UNIQUE(room_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_room_players_room_id ON public.room_players(room_id);

-- 3. TABELA DE ESTADO DO JOGO (GAMES)
CREATE TABLE IF NOT EXISTS public.games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID UNIQUE NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    current_question_index INT NOT NULL DEFAULT 0,
    phase VARCHAR(20) NOT NULL DEFAULT 'answering', 
    -- 'answering' (respostas privadas)
    -- 'guessing' (palpites mútuos)
    -- 'reveal' (revelação conjunta)
    -- 'moment' (diálogo e reações rápidas)
    -- 'finished' (final da partida)
    discoveries_count INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABELA DE RODADAS E RESPOSTAS (ROUNDS)
-- Campos são opcionais (nullable) para garantir avanço flexível e não-bloqueante
CREATE TABLE IF NOT EXISTS public.rounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    question_index INT NOT NULL,
    answer_p0 TEXT NULL,
    answer_p1 TEXT NULL,
    guess_p0 TEXT NULL, -- O que P0 acha que P1 respondeu
    guess_p1 TEXT NULL, -- O que P1 acha que P0 respondeu
    p0_submitted BOOLEAN NOT NULL DEFAULT FALSE,
    p1_submitted BOOLEAN NOT NULL DEFAULT FALSE,
    p0_guessed BOOLEAN NOT NULL DEFAULT FALSE,
    p1_guessed BOOLEAN NOT NULL DEFAULT FALSE,
    is_revealed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(game_id, question_index)
);

CREATE INDEX IF NOT EXISTS idx_rounds_game_q ON public.rounds(game_id, question_index);

-- 5. TABELA DE REAÇÕES PROGRAMADAS E EMOJIS (ROUND_REACTIONS)
CREATE TABLE IF NOT EXISTS public.round_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    question_index INT NOT NULL,
    from_player INT NOT NULL CHECK (from_player IN (0, 1)),
    text VARCHAR(100) NULL,
    emoji VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- SEGURANÇA: VIEW PROTEGIDA ANTI-SPOILER
-- ==============================================================================
-- Durante a fase de 'answering' e 'guessing', a parceira não pode ver a resposta da outra.
-- Somente quando 'is_revealed' for TRUE as respostas completas são expostas na View.

CREATE OR REPLACE VIEW public.safe_rounds AS
SELECT 
    r.id,
    r.game_id,
    r.question_index,
    r.p0_submitted,
    r.p1_submitted,
    r.p0_guessed,
    r.p1_guessed,
    r.is_revealed,
    r.created_at,
    r.updated_at,
    CASE WHEN r.is_revealed THEN r.answer_p0 ELSE NULL END AS answer_p0_revealed,
    CASE WHEN r.is_revealed THEN r.answer_p1 ELSE NULL END AS answer_p1_revealed,
    CASE WHEN r.is_revealed THEN r.guess_p0 ELSE NULL END AS guess_p0_revealed,
    CASE WHEN r.is_revealed THEN r.guess_p1 ELSE NULL END AS guess_p1_revealed
FROM public.rounds r;

-- ==============================================================================
-- PROCEDURES / FUNÇÕES RPC TRANSACIONAIS
-- ==============================================================================

-- Função para criar sala e jogador 0
CREATE OR REPLACE FUNCTION public.create_room_with_host(
    p_code VARCHAR(6),
    p_host_name VARCHAR(50),
    p_session_id VARCHAR(64)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_room_id UUID;
    v_game_id UUID;
    v_result JSONB;
BEGIN
    -- Cria a sala
    INSERT INTO public.rooms (code, status)
    VALUES (UPPER(p_code), 'waiting')
    RETURNING id INTO v_room_id;

    -- Registra o host (player 0)
    INSERT INTO public.room_players (room_id, session_id, name, player_index)
    VALUES (v_room_id, p_session_id, p_host_name, 0);

    -- Cria o registro do jogo
    INSERT INTO public.games (room_id, phase, current_question_index)
    VALUES (v_room_id, 'waiting', 0)
    RETURNING id INTO v_game_id;

    -- Cria primeira rodada
    INSERT INTO public.rounds (game_id, question_index)
    VALUES (v_game_id, 0);

    SELECT jsonb_build_object(
        'room_id', v_room_id,
        'game_id', v_game_id,
        'code', UPPER(p_code),
        'player_index', 0
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- Função para entrar na sala (jogador 1)
CREATE OR REPLACE FUNCTION public.join_room_as_guest(
    p_code VARCHAR(6),
    p_guest_name VARCHAR(50),
    p_session_id VARCHAR(64)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_room public.rooms%ROWTYPE;
    v_player_count INT;
    v_existing_player public.room_players%ROWTYPE;
    v_result JSONB;
BEGIN
    SELECT * INTO v_room FROM public.rooms WHERE code = UPPER(p_code) AND status != 'finished';
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sala não encontrada ou já encerrada.';
    END IF;

    -- Checa se já está na sala com essa sessão
    SELECT * INTO v_existing_player FROM public.room_players 
    WHERE room_id = v_room.id AND session_id = p_session_id;

    IF FOUND THEN
        SELECT jsonb_build_object(
            'room_id', v_room.id,
            'code', v_room.code,
            'player_index', v_existing_player.player_index
        ) INTO v_result;
        RETURN v_result;
    END IF;

    -- Checa se já tem 2 pessoas
    SELECT COUNT(*) INTO v_player_count FROM public.room_players WHERE room_id = v_room.id;
    IF v_player_count >= 2 THEN
        RAISE EXCEPTION 'Esta sala já está cheia (duas parceiras conectadas).';
    END IF;

    -- Insere como player 1
    INSERT INTO public.room_players (room_id, session_id, name, player_index)
    VALUES (v_room.id, p_session_id, p_guest_name, 1);

    -- Atualiza status da sala
    UPDATE public.rooms SET status = 'playing', updated_at = NOW() WHERE id = v_room.id;
    UPDATE public.games SET phase = 'answering', updated_at = NOW() WHERE room_id = v_room.id;

    SELECT jsonb_build_object(
        'room_id', v_room.id,
        'code', v_room.code,
        'player_index', 1
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- Habilita Realtime no Supabase para as tabelas necessárias
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.round_reactions;
