-- Create the user_visits table (user_profiles already exists)
create table if not exists user_visits (
  id uuid default uuid_generate_v4() primary key,
  user_id text not null,
  visit_time timestamp with time zone default timezone('utc'::text, now()) not null,
  visit_data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
