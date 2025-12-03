/*
  # Add Missing 14 Teams

  1. Data Import
    - Adds 14 missing teams from the spreadsheet
    - Includes teams from Ligue 1 and Liga Portugal
    - Completes the full list of 113 teams
*/

-- Insert missing teams
INSERT INTO teams (name, team_value, league, founded_year) VALUES
('Le Havre AC', 44350000, 'Ligue 1', 1872),
('Rio Ave FC', 42230000, 'Liga Portugal', 1931),
('CD Santa Clara', 40980000, 'Liga Portugal', 1921),
('GD Estoril Praia', 39580000, 'Liga Portugal', 1939),
('Casa Pia AC', 27850000, 'Liga Portugal', 1920),
('FC Alverca', 26780000, 'Liga Portugal', 1939),
('Angers SCO', 25700000, 'Ligue 1', 1919),
('Vitória SC', 25650000, 'Liga Portugal', 1922),
('Gil Vicente FC', 24450000, 'Liga Portugal', 1924),
('FC Arouca', 24250000, 'Liga Portugal', 1951),
('Moreirense FC', 23750000, 'Liga Portugal', 1938),
('CD Tondela', 18430000, 'Liga Portugal', 1933),
('CD Nacional', 17680000, 'Liga Portugal', 1910),
('CF Estrela Amadora', 15200000, 'Liga Portugal', 1932),
('Avs - Futebol SAD', 13900000, 'Liga Portugal', 1930)
ON CONFLICT (name) DO NOTHING;
