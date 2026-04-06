export type StepType = 'whatsapp' | 'voice' | 'delay';

export interface CampaignStep {
  id: string;
  type: StepType;
  content: string;
  delay_value?: number;
  delay_unit?: 'minutes' | 'hours' | 'days';
  voice_id?: string;
  metadata?: Record<string, any>;
}

export interface CampaignVariant {
  id: string;
  campaign_id: string;
  name: string;
  content: string;
  steps: CampaignStep[];
  prompt_config: Record<string, any>;
  is_control: boolean;
  traffic_weight: number;
  created_at: string;
}

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  description: string;
  agent_type: string;
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
  is_ab_test: boolean;
  target_segment: Record<string, any>;
  config: Record<string, any>;
  scheduled_for?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  campaign_variants?: CampaignVariant[];
}

export type RecipientStatus = 'pending' | 'queued' | 'sent' | 'delivered' | 'failed' | 'converted';

export interface CampaignRecipient {
  id: string;
  campaign_id: string;
  variant_id: string;
  contact_id: string;
  status: RecipientStatus;
  sent_at?: string;
  delivered_at?: string;
  error_message?: string;
  metadata: Record<string, any>;
  created_at: string;
}
