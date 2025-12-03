/*
  # Player Auction System

  ## Overview
  This migration creates a complete auction system for special players that can be won
  and used once per week in the "Eleven of the Week" selection.

  ## New Tables
  
  ### 1. `auction_players`
  Stores special players available for auction
  - `id` (uuid, primary key)
  - `name` (text) - Player name
  - `position` (text) - Player position
  - `club` (text) - Current club
  - `league` (text) - Current league
  - `value` (numeric) - Estimated market value
  - `image_url` (text) - Player photo URL
  - `description` (text) - Special attributes/description
  - `created_at` (timestamptz)

  ### 2. `auctions`
  Manages active and past auctions
  - `id` (uuid, primary key)
  - `auction_player_id` (uuid, FK to auction_players)
  - `start_date` (timestamptz) - When auction starts
  - `end_date` (timestamptz) - When auction ends
  - `starting_bid` (numeric) - Minimum bid amount
  - `current_bid` (numeric) - Current highest bid
  - `winner_user_id` (uuid, FK to auth.users) - User who won
  - `status` (text) - 'active', 'completed', 'cancelled'
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `auction_bids`
  Records all bids placed on auctions
  - `id` (uuid, primary key)
  - `auction_id` (uuid, FK to auctions)
  - `user_id` (uuid, FK to auth.users)
  - `bid_amount` (numeric) - Bid amount
  - `created_at` (timestamptz)

  ### 4. `user_auction_wins`
  Tracks won players and their usage status
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK to auth.users)
  - `auction_id` (uuid, FK to auctions)
  - `auction_player_id` (uuid, FK to auction_players)
  - `won_at` (timestamptz) - When user won the auction
  - `used_in_week` (date, nullable) - Week when player was used
  - `is_used` (boolean) - Whether player has been used
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can view all auctions and auction players
  - Users can only place bids for themselves
  - Users can view their own wins
  - Only admins can create/manage auctions
*/

-- Create auction_players table
CREATE TABLE IF NOT EXISTS auction_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  position text NOT NULL,
  club text NOT NULL,
  league text NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  image_url text,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create auctions table
CREATE TABLE IF NOT EXISTS auctions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_player_id uuid NOT NULL REFERENCES auction_players(id) ON DELETE CASCADE,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  starting_bid numeric NOT NULL DEFAULT 0,
  current_bid numeric DEFAULT 0,
  winner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create auction_bids table
CREATE TABLE IF NOT EXISTS auction_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id uuid NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bid_amount numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create user_auction_wins table
CREATE TABLE IF NOT EXISTS user_auction_wins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  auction_id uuid NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  auction_player_id uuid NOT NULL REFERENCES auction_players(id) ON DELETE CASCADE,
  won_at timestamptz DEFAULT now(),
  used_in_week date,
  is_used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE auction_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_auction_wins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for auction_players
CREATE POLICY "Anyone can view auction players"
  ON auction_players FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert auction players"
  ON auction_players FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Only admins can update auction players"
  ON auction_players FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Only admins can delete auction players"
  ON auction_players FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- RLS Policies for auctions
CREATE POLICY "Anyone can view auctions"
  ON auctions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert auctions"
  ON auctions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Only admins can update auctions"
  ON auctions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Only admins can delete auctions"
  ON auctions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- RLS Policies for auction_bids
CREATE POLICY "Users can view all bids"
  ON auction_bids FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can place their own bids"
  ON auction_bids FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_auction_wins
CREATE POLICY "Users can view their own wins"
  ON user_auction_wins FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Only admins can insert auction wins"
  ON user_auction_wins FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Users can update their own wins usage status"
  ON user_auction_wins FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);
CREATE INDEX IF NOT EXISTS idx_auctions_end_date ON auctions(end_date);
CREATE INDEX IF NOT EXISTS idx_auction_bids_auction_id ON auction_bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_auction_bids_user_id ON auction_bids(user_id);
CREATE INDEX IF NOT EXISTS idx_user_auction_wins_user_id ON user_auction_wins(user_id);
CREATE INDEX IF NOT EXISTS idx_user_auction_wins_is_used ON user_auction_wins(is_used);