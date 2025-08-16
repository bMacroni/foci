-- Migration: Add 'completed' column to steps table
ALTER TABLE steps ADD COLUMN completed BOOLEAN DEFAULT false;
-- Optionally, update all existing steps to set completed to false (if needed)
UPDATE steps SET completed = false WHERE completed IS NULL;


