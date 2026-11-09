-- SOKOL GAMES: setup for EXISTING leaderboard table.
-- Safe to run more than once. No DROP TABLE and no loss of existing records.
CREATE TABLE IF NOT EXISTS public.leaderboard (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 game_id text NOT NULL,
 player_name text NOT NULL,
 score integer NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS leaderboard_game_score_idx
 ON public.leaderboard (game_id, score DESC);
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.leaderboard FROM anon, authenticated;
GRANT SELECT ON public.leaderboard TO anon, authenticated;
DROP POLICY IF EXISTS "Public leaderboard" ON public.leaderboard;
CREATE POLICY "Public leaderboard" ON public.leaderboard
 FOR SELECT TO anon, authenticated USING (true);
-- Revoke any older policies which might have permitted anyone to insert/update/delete.
DROP POLICY IF EXISTS "Anyone can insert" ON public.leaderboard;
DROP POLICY IF EXISTS "Allow public inserts" ON public.leaderboard;
-- Run this query and examine other policies in Table Editor if you had previously added any.

-- Single controlled write entry point; it never grants INSERT to browsers.
CREATE OR REPLACE FUNCTION public.submit_game_score(
  p_game_id text,
  p_player_name text,
  p_score integer
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  cleaned text;
  existing_id bigint;
  existing_score integer;
  last_time timestamptz;
BEGIN
  cleaned := btrim(regexp_replace(coalesce(p_player_name, ''), '[[:space:]]+', ' ', 'g'));
  IF p_game_id NOT IN ('apple-catcher','pong-arena','space-runner','neon-dodge')
    OR char_length(cleaned) NOT BETWEEN 1 AND 20
    OR p_score IS NULL OR p_score < 1 OR p_score > 1000000
    OR cleaned ~ '[[:cntrl:]]'
  THEN RAISE EXCEPTION 'Invalid game, player or score'; END IF;

  -- Prevent overlapping submissions for one player name in one game.
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(p_game_id || ':' || lower(cleaned)));
  SELECT id, score, created_at INTO existing_id, existing_score, last_time
  FROM public.leaderboard
  WHERE game_id = p_game_id AND lower(player_name) = lower(cleaned)
  ORDER BY score DESC, id DESC LIMIT 1;

  -- Allow an improved personal record, subject to a short cooldown.
  IF existing_id IS NOT NULL THEN
    IF last_time > now() - interval '5 seconds' THEN
      RAISE EXCEPTION 'Please wait before submitting another score';
    END IF;
    IF p_score <= existing_score THEN RETURN false; END IF;
    UPDATE public.leaderboard SET score = p_score, player_name = cleaned, created_at = now()
      WHERE id = existing_id;
  ELSE
    INSERT INTO public.leaderboard (game_id, player_name, score)
    VALUES (p_game_id, cleaned, p_score);
  END IF;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_game_score(text,text,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_game_score(text,text,integer) TO anon, authenticated;

-- Verify the tables and policies using Table Editor after running.
-- NOTE: This is a friendly competition leaderboard, not a cheat-proof scoring system.
