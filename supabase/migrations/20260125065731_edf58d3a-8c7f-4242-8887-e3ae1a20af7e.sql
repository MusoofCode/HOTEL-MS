-- Enable realtime for activity logs so the header notifications can update live
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;