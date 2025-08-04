/*
  # Event Registration System Database Schema

  1. New Tables
    - `registrations`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `phone` (text, required)
      - `email` (text, required)
      - `payment_screenshot_url` (text, optional)
      - `raffle_number` (integer, optional)
      - `status` (text, default 'pending')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `registrations` table
    - Add policy for public insert (user registration)
    - Add policy for authenticated read (admin dashboard)

  3. Storage
    - Create bucket for payment screenshots
    - Enable public access for file uploads
*/

-- Create registrations table
CREATE TABLE IF NOT EXISTS registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  payment_screenshot_url text,
  raffle_number integer UNIQUE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Allow public insert for user registrations
CREATE POLICY "Anyone can register"
  ON registrations
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow read access for authenticated users (admin)
CREATE POLICY "Authenticated users can read all registrations"
  ON registrations
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow update for authenticated users (admin)
CREATE POLICY "Authenticated users can update registrations"
  ON registrations
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create storage bucket for payment screenshots
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-screenshots', 'payment-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public upload to payment screenshots bucket
CREATE POLICY "Anyone can upload payment screenshots"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'payment-screenshots');

-- Allow public read access to payment screenshots
CREATE POLICY "Anyone can view payment screenshots"
  ON storage.objects
  FOR SELECT
  TO anon
  USING (bucket_id = 'payment-screenshots');

-- Allow authenticated users to update payment screenshots
CREATE POLICY "Authenticated users can update payment screenshots"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'payment-screenshots');