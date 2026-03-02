export interface User {
  id: string
  email: string
  full_name: string | null
  role: string
  is_active: boolean
  created_at: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: User
}

export interface SocialAccount {
  id: string
  platform: string
  account_name: string | null
  account_external_id: string | null
  expires_at: string | null
  is_active: boolean
}

export interface TelegramChannel {
  id: string
  channel_id: string
  channel_username: string | null
  channel_name: string | null
  is_active: boolean
  created_at: string
}

export interface PlatformPost {
  id: string
  platform: string
  publish_status: string
  external_post_id: string | null
  error_message: string | null
  published_at: string | null
}

export interface Post {
  id: string
  caption: string
  media_url: string | null
  media_type: string | null
  scheduled_time: string | null
  status: string
  created_at: string
  platform_posts: PlatformPost[]
}

export interface DashboardStats {
  total_posts: number
  published_posts: number
  scheduled_posts: number
  failed_posts: number
  draft_posts: number
  connected_platforms: number
  platforms: { platform: string; account_name: string }[]
}
