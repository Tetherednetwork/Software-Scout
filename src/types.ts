export interface Session {
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      [key: string]: any;
    };
  };
}

export interface User {
  id: string;
  email?: string;
  user_metadata?: {
    [key: string]: any;
  };
}

export interface GroundingChunk {
  web: {
    uri: string;
    title: string;
  };
}

export type Platform = 'windows' | 'macos' | 'linux' | 'android';

export interface Message {
  id: string | number; // Can be string for optimistic UI, number from DB/Firestore
  text: string;
  sender: 'user' | 'bot';
  groundingChunks?: GroundingChunk[];
  options?: string[];
  type?: 'software' | 'driver' | 'game' | 'driver-input-prompt' | 'standard' | 'installation-guide' | 'software-list' | 'driver-device-prompt' | 'driver-device-selection' | 'platform-prompt' | 'software-clarification-prompt' | 'question';
  platform?: Platform;
  // DB fields
  user_id?: string;
  created_at?: string;
}

export interface DownloadHistoryItem {
  id: string | number;
  software_name: string;
  version?: string;
  url: string;
  file_size?: string;
  icon_url?: string;
  timestamp: string; // ISO string
  type: 'software' | 'driver' | 'game';
  platform?: Platform;
  status?: 'verified' | 'failed';
  // DB fields
  user_id?: string;
}

export interface UserDevice {
  id: string | number;
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
  logo?: string;
  trend_reason?: string;
}

export const blogCategories = [
  'Security',
  'New Software',
  'Install/Deployments',
  'Awareneses',
  'Updates'
] as const;

export type BlogCategory = typeof blogCategories[number];

export interface BlogPost {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  image: string; // Corresponds to image_url in DB
  author: string;
  content: string;
  category: BlogCategory;
  // Populated by service
  comment_count?: number;
  like_count?: number;
  user_has_liked?: boolean;
  author_avatar_url?: string;
  // For upserting
  user_id?: string;
}

export interface BlogComment {
  id: number;
  created_at: string;
  user_id: string;
  post_id: string;
  content: string;
  author: {
    username: string;
    avatar_url: string;
    email: string;
  };
  like_count: number;
  user_has_liked: boolean;
  post_title?: string; // For admin view context
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

// Forum related types
export interface ForumPost {
  id: string | number;
  created_at: string;
  user_id: string;
  title: string;
  content: string;
  category: 'CyberSecurity' | 'New Softwares' | 'Install/Deployments' | 'Updates' | 'Trending' | 'Discussion';
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  image_url?: string | null;
  file_url?: string;
  file_name?: string;
  author: {
    username: string;
    avatar_url: string;
    email: string;
  };
  comment_count: number;
  like_count: number;
  user_has_liked: boolean;
}

export interface ForumComment {
  id: string | number;
  created_at: string;
  user_id: string;
  post_id: string | number;
  content: string;
  parent_comment_id: string | number | null;
  author: {
    username: string;
    avatar_url: string;
    email: string;
  };
  like_count: number;
  user_has_liked: boolean;
  post_title?: string; // For admin view context
  children?: ForumComment[]; // For nesting replies
}

export interface VerifiedSoftware {
  id: string | number;
  name: string;
  vendor?: string | null;
  description?: string | null;
  homepage_url: string;
  windows_url?: string | null;
  macos_url?: string | null;
  linux_url?: string | null;
  android_url?: string | null;
  created_at?: string;
}

export interface FullUserProfile {
  id: string;
  email?: string;
  role?: string;
  username?: string;
  avatar_url?: string;
  custom_avatar_url?: string;
  created_at?: string;
  testimonial?: Testimonial | null;
}

export interface Notification {
  id: string | number;
  created_at: string;
  recipient_user_id: string | null;
  actor_user_id: string | null;
  type: string;
  content: string;
  link_url: string | null;
  is_read: boolean;
  is_broadcast: boolean;
  related_entity_id: string | null;
  actor?: {
    username: string;
    avatar_url: string;
  } | null;
}

export interface Testimonial {
  id: string | number;
  user_id: string;
  rating: number;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  author?: {
    username: string;
    avatar_url: string;
  };
}

export interface UserFeedback {
  id: string | number;
  created_at: string;
  user_id?: string | null;
  name?: string | null;
  email?: string | null;
  category: 'Bug Report' | 'Feature Request' | 'General Feedback' | 'Software Request' | 'Other';
  message: string;
  is_resolved: boolean;
  author?: { // from a join with profiles
    username: string;
    email: string;
  } | null;
}

export type ContentView = 'blogPosts' | 'blogComments' | 'forumPosts' | 'forumComments' | 'pendingPosts' | 'testimonials' | 'userFeedback';

// FIX: Added missing AIProvider type.
export type AIProvider = 'gemini' | 'openai' | 'azure' | 'deepseek';

export type Page = 'home' | 'about' | 'forum' | 'blogs' | 'file-verifier' | 'blog-post' | 'admin' | 'forum-post';

export interface SoftwareCatalogItem {
  id?: string;
  name: string;
  keywords: string[];
  category: 'driver' | 'runtime' | 'game' | 'application' | 'game_platform';
  os_compatibility: string[];
  arch: string[];
  required_fields: string[];
  download_pattern: string;
  verified: boolean;
  manufacturer: string;
  logo?: string;
}