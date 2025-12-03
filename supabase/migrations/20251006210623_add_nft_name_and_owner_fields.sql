/*
  # Add NFT Name and Owner Address Fields

  1. Changes to user_profiles
    - Add `dragon_nft_name` (text) - Name of the Dragon NFT
    - Add `dragon_nft_owner_address` (text) - Wallet address of the NFT owner

  2. Notes
    - These fields complement existing NFT verification
    - Users need to provide NFT name, number, collection address, and owner address
*/

-- Add NFT name and owner address columns to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'dragon_nft_name'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN dragon_nft_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'dragon_nft_owner_address'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN dragon_nft_owner_address text;
  END IF;
END $$;