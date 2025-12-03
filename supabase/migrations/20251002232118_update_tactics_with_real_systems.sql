/*
  # Update Tactics with Real Systems

  1. Changes
    - Delete existing placeholder tactics
    - Insert 17 real tactical systems from spreadsheet
    - Each system represents a different formation strategy
  
  2. Notes
    - Systems include variations like Line, Diamond, Square configurations
    - Format follows goalkeeper-defenders-midfielders-forwards structure
*/

-- Delete existing placeholder tactics
DELETE FROM tactics;

-- Insert real tactical systems from spreadsheet
INSERT INTO tactics (name, description) VALUES
('1-3-5-2', 'Three defenders with five midfielders supporting two forwards'),
('1-3-4-3 Line', 'Three defenders, four midfielders in a line, three forwards'),
('1-3-4-3 Diamond', 'Three defenders, four midfielders in diamond shape, three forwards'),
('1-4-2-4', 'Four defenders, two midfielders, four forwards - very attacking'),
('1-4-3-3 Line', 'Four defenders, three midfielders in a line, three forwards'),
('1-4-3-3 (2-1)', 'Four defenders, three midfielders (two holding, one attacking), three forwards'),
('1-4-3-3 (1-2)', 'Four defenders, three midfielders (one holding, two attacking), three forwards'),
('1-4-4-2 Line', 'Four defenders, four midfielders in a line, two forwards'),
('1-4-4-2 Square', 'Four defenders, four midfielders in square formation, two forwards'),
('1-4-4-2 Diamond', 'Four defenders, four midfielders in diamond shape, two forwards'),
('1-4-4-2 (1-3)', 'Four defenders, four midfielders (one holding, three advanced), two forwards'),
('1-4-4-2 (3-1)', 'Four defenders, four midfielders (three holding, one advanced), two forwards'),
('1-5-4-1 Line', 'Five defenders, four midfielders in a line, one forward'),
('1-5-4-1 Diamond', 'Five defenders, four midfielders in diamond shape, one forward'),
('1-5-3-2 (2-1)', 'Five defenders, three midfielders (two holding, one attacking), two forwards'),
('1-5-3-2 (1-2)', 'Five defenders, three midfielders (one holding, two attacking), two forwards'),
('1-5-2-3', 'Five defenders, two midfielders, three forwards');
