/*
  # Allow Admin to Make Multiple Selections

  1. Changes
    - Remove unique constraint on user_id in user_tactic_selection
    - This allows users (especially admins) to change their tactic selection multiple times
    - Update will be handled by deleting old selection and inserting new one in the app

  2. Notes
    - This enables testing and experimentation for admins
    - Regular users can also update their selections now
*/

-- Drop the unique constraint on user_id
ALTER TABLE user_tactic_selection 
DROP CONSTRAINT IF EXISTS user_tactic_selection_user_id_key;

-- Add a comment to the table
COMMENT ON TABLE user_tactic_selection IS 'Stores user tactic selections. Users can update their selection by deleting old records and inserting new ones.';
