-- Create pos_agents table
CREATE TABLE public.pos_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_code VARCHAR(20) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  location JSONB NOT NULL,
  bank_account_number VARCHAR(20) NOT NULL,
  bank_code VARCHAR(10) NOT NULL,
  account_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 10.0,
  total_artisans_onboarded INTEGER NOT NULL DEFAULT 0,
  total_commission_earned DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pos_agents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "pos_agents_own_data" ON public.pos_agents
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "pos_agents_admin_access" ON public.pos_agents
  FOR ALL USING (is_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_pos_agents_updated_at
  BEFORE UPDATE ON public.pos_agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_pos_agents_user_id ON public.pos_agents(user_id);
CREATE INDEX idx_pos_agents_agent_code ON public.pos_agents(agent_code);

-- Update agent_referrals table to properly link to pos_agents
ALTER TABLE public.agent_referrals 
  ADD CONSTRAINT fk_agent_referrals_agent_id 
  FOREIGN KEY (agent_id) REFERENCES public.pos_agents(id) ON DELETE CASCADE;

-- Update commission_transactions table to properly link to pos_agents  
ALTER TABLE public.commission_transactions
  ADD CONSTRAINT fk_commission_transactions_agent_id
  FOREIGN KEY (agent_id) REFERENCES public.pos_agents(id) ON DELETE CASCADE;