-- Trigger: send email notification when a peer review request is created
-- Uses pg_net (available on all Supabase projects) to call the notify-reviewer Edge Function

create or replace function notify_reviewer_on_insert()
returns trigger
language plpgsql
security definer
as $$
begin
  perform net.http_post(
    url := 'https://nkxkyjuiwvwwxuefsgxg.supabase.co/functions/v1/notify-reviewer',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'review_requests',
      'record', row_to_json(NEW)
    )
  );
  return NEW;
end;
$$;

create trigger on_review_request_created
  after insert on review_requests
  for each row execute function notify_reviewer_on_insert();
