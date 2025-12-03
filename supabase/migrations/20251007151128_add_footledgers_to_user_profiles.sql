/*
  # Add FootLedgers to User Profiles

  1. Changes
    - Add `footledgers` column to `user_profiles` table to track user's FootLedgers balance
    - Add `nft_verified` column to track if user has verified NFT (for creating leagues)
    
  2. Notes
    - Default footledgers is 0
    - Default nft_verified is false
    - Users need verified NFT to create leagues
*/

-- Add footledgers column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'footledgers'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN footledgers integer DEFAULT 0;
  END IF;
END $$;

-- Add nft_verified column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'nft_verified'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN nft_verified boolean DEFAULT false;
  END IF;
END $$;