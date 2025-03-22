-- Create the profiles table
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  nombre text not null,
  apellido text not null,
  telefono text,
  dni text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table profiles enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Create indexes
create index profiles_id_index on profiles(id);
create index profiles_dni_index on profiles(dni);

-- Set up realtime
alter publication supabase_realtime add table profiles;

-- Create triggers for updated_at
create trigger handle_updated_at before update on profiles
  for each row execute procedure moddatetime (updated_at);
