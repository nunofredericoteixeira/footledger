/*
  # Normalize player values

  Source CSV values were 100x the intended amount. This migration scales them down.
*/

UPDATE player_pool
SET value = value / 100;
