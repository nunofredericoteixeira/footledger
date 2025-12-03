/*
  # Add League Column to Teams

  1. Changes
    - Add league column to teams table
    - Update all existing teams with their respective leagues

  2. Updates
    - Set league for all 97 teams from spreadsheet
*/

-- Add league column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'league'
  ) THEN
    ALTER TABLE teams ADD COLUMN league text;
  END IF;
END $$;

-- Update teams with their leagues
UPDATE teams SET league = 'La Liga' WHERE name IN (
  'Real Madrid CF', 'FC Barcelona', 'Atlético Madrid', 'Athletic Club', 
  'Real Sociedad', 'Real Betis', 'Valencia CF', 'Girona FC', 'Celta Vigo',
  'Sevilla FC', 'RCD Espanyol', 'CA Osasuna', 'RCD Mallorca', 'Rayo Vallecano',
  'Deportivo Alavés', 'Elche CF', 'Getafe CF', 'Levante UD', 'Real Oviedo', 'Villarreal CF'
);

UPDATE teams SET league = 'Premier League' WHERE name IN (
  'FC Arsenal', 'Manchester City FC', 'Liverpool FC', 'Chelsea FC',
  'Tottenham Hotspur', 'Manchester United FC', 'Newcastle United',
  'Nottingham Forest', 'Aston Villa FC', 'Brighton & Hove Albion',
  'Crystal Palace FC', 'Brentford FC', 'AFC Bournemouth', 'West Ham United',
  'FC Everton', 'FC Fulham', 'Wolverhampton Wanderers', 'Leeds United FC',
  'AFC Sunderland', 'FC Burnley'
);

UPDATE teams SET league = 'Serie A' WHERE name IN (
  'Inter Milan', 'Juventus FC', 'Napoli', 'AC Milan', 'Atalanta BC',
  'AS Roma', 'ACF Fiorentina', 'SS Lazio', 'Bologna FC', 'Como 1907',
  'Torino FC', 'Parma Calcio 1913', 'US Sassuolo', 'Udinese Calcio',
  'Genoa CFC', 'Pisa SC', 'Hellas Verona', 'Cagliari Calcio',
  'US Cremonese', 'US Lecce'
);

UPDATE teams SET league = 'Bundesliga' WHERE name IN (
  'FC Bayern Munich', 'Borussia Dortmund', 'Bayer 04 Leverkusen',
  'RB Leipzig', 'Eintracht Frankfurt', 'VfB Stuttgart', 'VfL Wolfsburg',
  'Werder Bremen', 'TSG 1899 Hoffenheim', 'Borussia Mönchengladbach',
  'SC Freiburg', '1.FSV Mainz 05', 'FC Augsburg', '1.FC Union Berlin',
  'Hamburger SV', '1.FC Köln', '1.FC Heidenheim 1846', 'FC St. Pauli'
);

UPDATE teams SET league = 'Ligue 1' WHERE name IN (
  'FC Paris Saint-Germain', 'Olympique Marseille', 'AS Monaco',
  'RC Strasbourg', 'LOSC Lille', 'OGC Nice', 'Stade Rennais FC',
  'Olympique Lyon', 'Paris FC', 'RC Lens', 'Stade Brestois 29',
  'FC Toulouse', 'FC Lorient', 'FC Nantes', 'AJ Auxerre', 'FC Metz'
);

UPDATE teams SET league = 'Liga Portugal' WHERE name IN (
  'Sporting CP', 'FC Porto', 'SL Benfica', 'SC Braga', 'FC Famalicão'
);
