-- Create the table
create table user_profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id text not null,
  job_title text,
  job_description text,
  gender text,
  address text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
