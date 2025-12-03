/*
  # Add NFT Verification for Auction Access

  1. Changes to user_profiles
    - Add `dragon_nft_address` (text) - OpenPlaza NFT collection address
    - Add `dragon_nft_number` (text) - Specific NFT # from The Dragon collection
    - Add `footlegers_token_verified` (boolean) - Whether user has FootLegers tokens
    - Add `nft_verified_at` (timestamptz) - When NFT was verified

  2. Security
    - Users can update their own NFT information
    - Admins can verify NFT ownership

  3. Notes
    - Users need to own a Dragon NFT from openplaza.io/marketplace to participate in auctions
    - FootLegers is the native Web3 token required for bidding
*/

-- Add NFT verification columns to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'dragon_nft_address'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN dragon_nft_address text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'dragon_nft_number'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN dragon_nft_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'footlegers_token_verified'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN footlegers_token_verified boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'nft_verified_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN nft_verified_at timestamptz;
  END IF;
END $$;

-- Create policy for users to update their NFT information
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' 
    AND policyname = 'Users can update own NFT information'
  ) THEN
    CREATE POLICY "Users can update own NFT information"
      ON user_profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;