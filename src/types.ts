import type { Session, User } from '@supabase/supabase-js';
export type { Session, User };

export interface GroundingChunk {
  web: {
    uri: string;
    title: string;
  };
}

export type Platform = 'windows' | 'macos' | 'linux' | 'android';

export interface Message {
  id: string | number; // Can be string for optimistic UI, number from DB
  text: string;
  sender: 'user' | 'bot';
  groundingChunks?: GroundingChunk[];
  type?: 'software' | 'driver' | 'game' | 'driver-input-prompt' | 'standard' | 'installation-guide' | 'software-list' | 'driver-device-prompt' | 'driver-device-selection';
  platform?: Platform;
  // DB fields
  user_id?: string;
  created_at?: string;
}

export interface DownloadHistoryItem {
  id: string | number;
  name: string;
  url: string;
  timestamp: string; // ISO string
  type: 'software' | 'driver' | 'game';
  platform?: Platform;
  status?: 'verified' | 'failed';
  // DB fields
  user_id?: string;
}

export interface UserDevice {
  id: number;
  user_id: string;
  device_name: string;
  manufacturer: string;
  model: string;
  serial_number?: string;
  os: string;
  created_at?: string;
}

export type SoftwareFilter = 'all' | 'free' | 'freemium' | 'paid';

export interface TrendingTopic {
  name: string;
  description: string;
  companyDomain: string;
  trend_reason?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  image: string;
  author: string;
  content: string; // Supports simple markdown
}

export type SafetyActionId = 
  | 'restore' 
  | 'clean' 
  | 'virus-scan' 
  | 'check-updates'
  | 'shortcuts'
  | 'new-user'
  | 'wipe-pc'
  | 'recover-password'
  | 'backup-onedrive'
  | 'mac-spotlight'
  | 'mac-screenshot'
  | 'mac-force-quit'
  | 'mac-check-updates'
  | 'mac-gatekeeper'
  | 'mac-time-machine'
  | 'mac-lock-screen'
  | 'mac-mission-control'
  | 'mac-airdrop'
  | 'mac-virus-scan';

export type AIProvider = 'gemini' | 'openai' | 'azure' | 'deepseek';