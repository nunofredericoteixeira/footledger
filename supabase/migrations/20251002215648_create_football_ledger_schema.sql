/*
  # Football Ledger Database Schema

  1. New Tables
    - `teams`
      - `id` (uuid, primary key)
      - `name` (text, unique, not null)
      - `logo_url` (text, optional)
      - `founded_year` (integer, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `players`
      - `id` (uuid, primary key)
      - `team_id` (uuid, foreign key to teams)
      - `name` (text, not null)
      - `position` (text, not null)
      - `jersey_number` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `matches`
      - `id` (uuid, primary key)
      - `home_team_id` (uuid, foreign key to teams)
      - `away_team_id` (uuid, foreign key to teams)
      - `home_score` (integer, default 0)
      - `away_score` (integer, default 0)
      - `match_date` (timestamptz, not null)
      - `location` (text)
      - `status` (text, default 'scheduled')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `player_stats`
      - `id` (uuid, primary key)
      - `match_id` (uuid, foreign key to matches)
      - `player_id` (uuid, foreign key to players)
      - `goals` (integer, default 0)
      - `assists` (integer, default 0)
      - `yellow_cards` (integer, default 0)
      - `red_cards` (integer, default 0)
      - `minutes_played` (integer, default 0)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access (this is a demo app)
    - Add policies for authenticated users to manage data

  3. Indexes
    - Add indexes on foreign keys for better query performance
    - Add index on match_date for sorting and filtering
*/

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  logo_url text,
  founded_year integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create players table
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  position text NOT NULL,
  jersey_number integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  away_team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  home_score integer DEFAULT 0,
  away_score integer DEFAULT 0,
  match_date timestamptz NOT NULL,
  location text,
  status text DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT different_teams CHECK (home_team_id != away_team_id)
);

-- Create player_stats table
CREATE TABLE IF NOT EXISTS player_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  player_id uuid REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  goals integer DEFAULT 0,
  assists integer DEFAULT 0,
  yellow_cards integer DEFAULT 0,
  red_cards integer DEFAULT 0,
  minutes_played integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(match_id, player_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_matches_home_team ON matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_team ON matches(away_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date DESC);
CREATE INDEX IF NOT EXISTS idx_player_stats_match ON player_stats(match_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_player ON player_stats(player_id);

-- Enable Row Level Security
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teams
CREATE POLICY "Anyone can view teams"
  ON teams FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert teams"
  ON teams FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update teams"
  ON teams FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete teams"
  ON teams FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for players
CREATE POLICY "Anyone can view players"
  ON players FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert players"
  ON players FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update players"
  ON players FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete players"
  ON players FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for matches
CREATE POLICY "Anyone can view matches"
  ON matches FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert matches"
  ON matches FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update matches"
  ON matches FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete matches"
  ON matches FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for player_stats
CREATE POLICY "Anyone can view player stats"
  ON player_stats FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert player stats"
  ON player_stats FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update player stats"
  ON player_stats FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete player stats"
  ON player_stats FOR DELETE
  TO authenticated
  USING (true);