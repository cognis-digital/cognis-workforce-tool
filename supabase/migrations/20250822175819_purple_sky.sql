-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- Organizations table
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- User profiles table
create table public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  org_id uuid references public.organizations(id) on delete cascade,
  display_name text,
  role text default 'member' check (role in ('admin', 'member')),
  tier text default 'free' check (tier in ('free', 'pro', 'enterprise')),
  trial_ends_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

-- Subscriptions table
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  tier text not null check (tier in ('free', 'pro', 'enterprise')),
  status text not null check (status in ('active', 'past_due', 'canceled', 'incomplete')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- AI Agents table
create table public.ai_agents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  role text not null,
  description text,
  status text default 'active' check (status in ('active', 'paused', 'training')),
  model_config jsonb default '{}'::jsonb,
  capabilities text[] default array[]::text[],
  tasks_completed integer default 0,
  accuracy numeric default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Knowledge bases table
create table public.knowledge_bases (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  size_bytes bigint default 0,
  status text default 'ready' check (status in ('ready', 'indexing', 'error')),
  accuracy numeric default 0,
  usage_count integer default 0,
  agents_connected integer default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Knowledge items table
create table public.knowledge_items (
  id uuid primary key default gen_random_uuid(),
  kb_id uuid references public.knowledge_bases(id) on delete cascade,
  name text not null,
  type text not null check (type in ('file', 'folder', 'image', 'url')),
  storage_path text,
  size_bytes bigint default 0,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Vector embeddings table
create table public.kb_embeddings (
  id bigserial primary key,
  kb_id uuid references public.knowledge_bases(id) on delete cascade,
  item_id uuid references public.knowledge_items(id) on delete cascade,
  chunk_text text not null,
  embedding vector(1536) not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Agent interactions table
create table public.agent_interactions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.ai_agents(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  prompt text not null,
  response text,
  tokens_used integer,
  duration_ms integer,
  blockchain_tx_hash text,
  created_at timestamptz default now()
);

-- Leads table
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  company text not null,
  contact_name text,
  contact_title text,
  email text,
  phone text,
  location text,
  industry text,
  score integer default 0,
  status text default 'new' check (status in ('new', 'contacted', 'qualified', 'proposal', 'closed')),
  potential_value numeric default 0,
  metadata jsonb default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Blockchain transactions table
create table public.blockchain_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  chain_id integer not null,
  tx_hash text not null,
  contract_address text,
  function_name text,
  event_type text not null,
  metadata jsonb default '{}'::jsonb,
  gas_used bigint,
  gas_price bigint,
  status text default 'pending' check (status in ('pending', 'confirmed', 'failed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create indexes for better performance
create index idx_user_profiles_user_id on public.user_profiles(user_id);
create index idx_user_profiles_org_id on public.user_profiles(org_id);
create index idx_ai_agents_org_id on public.ai_agents(org_id);
create index idx_knowledge_bases_org_id on public.knowledge_bases(org_id);
create index idx_knowledge_items_kb_id on public.knowledge_items(kb_id);
create index idx_kb_embeddings_kb_id on public.kb_embeddings(kb_id);
create index idx_kb_embeddings_embedding on public.kb_embeddings using ivfflat (embedding vector_cosine_ops);
create index idx_agent_interactions_agent_id on public.agent_interactions(agent_id);
create index idx_agent_interactions_user_id on public.agent_interactions(user_id);
create index idx_leads_org_id on public.leads(org_id);
create index idx_blockchain_transactions_user_id on public.blockchain_transactions(user_id);
create index idx_blockchain_transactions_chain_id on public.blockchain_transactions(chain_id);

-- Enable Row Level Security
alter table public.organizations enable row level security;
alter table public.user_profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.ai_agents enable row level security;
alter table public.knowledge_bases enable row level security;
alter table public.knowledge_items enable row level security;
alter table public.kb_embeddings enable row level security;
alter table public.agent_interactions enable row level security;
alter table public.leads enable row level security;
alter table public.blockchain_transactions enable row level security;

-- RLS Policies
-- Organizations
create policy "Users can view their organization" on public.organizations
  for select using (
    id in (select org_id from public.user_profiles where user_id = auth.uid())
  );

-- User profiles
create policy "Users can view their own profile" on public.user_profiles
  for select using (user_id = auth.uid());

create policy "Users can update their own profile" on public.user_profiles
  for update using (user_id = auth.uid());

-- Subscriptions
create policy "Users can view their org subscriptions" on public.subscriptions
  for select using (
    org_id in (select org_id from public.user_profiles where user_id = auth.uid())
  );

-- AI Agents
create policy "Users can view their org agents" on public.ai_agents
  for select using (
    org_id in (select org_id from public.user_profiles where user_id = auth.uid())
  );

create policy "Pro users can create agents" on public.ai_agents
  for insert with check (
    org_id in (
      select up.org_id from public.user_profiles up
      where up.user_id = auth.uid() and up.tier in ('pro', 'enterprise')
    )
  );

create policy "Users can update their org agents" on public.ai_agents
  for update using (
    org_id in (select org_id from public.user_profiles where user_id = auth.uid())
  );

-- Knowledge bases
create policy "Users can view their org knowledge bases" on public.knowledge_bases
  for select using (
    org_id in (select org_id from public.user_profiles where user_id = auth.uid())
  );

create policy "Users can create knowledge bases" on public.knowledge_bases
  for insert with check (
    org_id in (select org_id from public.user_profiles where user_id = auth.uid())
  );

create policy "Users can update their org knowledge bases" on public.knowledge_bases
  for update using (
    org_id in (select org_id from public.user_profiles where user_id = auth.uid())
  );

-- Knowledge items
create policy "Users can view their org knowledge items" on public.knowledge_items
  for select using (
    kb_id in (
      select kb.id from public.knowledge_bases kb
      join public.user_profiles up on kb.org_id = up.org_id
      where up.user_id = auth.uid()
    )
  );

create policy "Users can create knowledge items" on public.knowledge_items
  for insert with check (
    kb_id in (
      select kb.id from public.knowledge_bases kb
      join public.user_profiles up on kb.org_id = up.org_id
      where up.user_id = auth.uid()
    )
  );

-- Embeddings
create policy "Users can view their org embeddings" on public.kb_embeddings
  for select using (
    kb_id in (
      select kb.id from public.knowledge_bases kb
      join public.user_profiles up on kb.org_id = up.org_id
      where up.user_id = auth.uid()
    )
  );

-- Agent interactions
create policy "Users can view their interactions" on public.agent_interactions
  for select using (user_id = auth.uid());

create policy "Users can create interactions" on public.agent_interactions
  for insert with check (user_id = auth.uid());

-- Leads
create policy "Users can view their org leads" on public.leads
  for select using (
    org_id in (select org_id from public.user_profiles where user_id = auth.uid())
  );

create policy "Users can create leads" on public.leads
  for insert with check (
    org_id in (select org_id from public.user_profiles where user_id = auth.uid())
  );

create policy "Users can update their org leads" on public.leads
  for update using (
    org_id in (select org_id from public.user_profiles where user_id = auth.uid())
  );

-- Blockchain transactions
create policy "Users can view their transactions" on public.blockchain_transactions
  for select using (user_id = auth.uid());

create policy "Users can create transactions" on public.blockchain_transactions
  for insert with check (user_id = auth.uid());

-- Functions
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_org_id uuid;
begin
  -- Create organization
  insert into public.organizations (name)
  values (coalesce(new.raw_user_meta_data->>'org_name', 'My Organization'))
  returning id into new_org_id;

  -- Create user profile
  insert into public.user_profiles (
    user_id,
    org_id,
    display_name,
    role,
    tier,
    trial_ends_at
  ) values (
    new.id,
    new_org_id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'admin',
    'free',
    now() + interval '7 days'
  );

  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add updated_at triggers
create trigger handle_updated_at before update on public.organizations
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.user_profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.subscriptions
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.ai_agents
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.knowledge_bases
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.knowledge_items
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.leads
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.blockchain_transactions
  for each row execute procedure public.handle_updated_at();