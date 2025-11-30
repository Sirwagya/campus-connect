-- Function to increment participant count
CREATE OR REPLACE FUNCTION increment_participant_count(event_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.events
  SET participants_count = participants_count + 1
  WHERE id = event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement participant count
CREATE OR REPLACE FUNCTION decrement_participant_count(event_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.events
  SET participants_count = GREATEST(0, participants_count - 1)
  WHERE id = event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
