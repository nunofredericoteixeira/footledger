import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Team = {
  id: string;
  name: string;
  logo_url: string | null;
  founded_year: number | null;
  team_value: number | null;
  league: string | null;
  created_at: string;
  updated_at: string;
};

export type Player = {
  id: string;
  team_id: string | null;
  name: string;
  position: string;
  jersey_number: number | null;
  created_at: string;
  updated_at: string;
};

export type Match = {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: number;
  away_score: number;
  match_date: string;
  location: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type PlayerStats = {
  id: string;
  match_id: string;
  player_id: string;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  minutes_played: number;
  created_at: string;
};

export type UserProfile = {
  id: string;
  selected_team_id: string | null;
  team_value: number;
  is_admin: boolean;
  remaining_budget: number;
  players_locked: boolean;
  position_requirements: Record<string, number> | null;
  position_groups: Record<string, PositionGroup> | null;
  created_at: string;
  updated_at: string;
};

export type PositionGroup = {
  positions: string[];
  count: number;
};

export type Tactic = {
  id: string;
  name: string;
  description: string;
  position_requirements: Record<string, number> | null;
  position_groups: Record<string, PositionGroup> | null;
  created_at: string;
};

export type PlayerPool = {
  id: string;
  name: string;
  league: string;
  club: string;
  position: string;
  value: number;
  url: string | null;
  created_at: string;
};

export type UserPlayerSelection = {
  id: string;
  user_id: string;
  player_id: string;
  created_at: string;
};
