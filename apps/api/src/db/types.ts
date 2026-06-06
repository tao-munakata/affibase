export type UserPlan = 'free' | 'pro' | 'business'
export type UserStatus = 'active' | 'suspended' | 'deleted'
export type SiteStatus = 'generating' | 'active' | 'paused' | 'error'
export type ArticleStatus = 'draft' | 'published' | 'archived'
export type OfferStatus = 'active' | 'paused' | 'terminated'
export type JobType = 'site_init' | 'article_generate' | 'aeo_refresh' | 'offer_sync'
export type JobStatus = 'queued' | 'running' | 'done' | 'failed'
export type CompetitionLevel = 'low' | 'medium' | 'high'
export type AeoPotential = 'high' | 'medium' | 'low'

export interface User {
  id: string
  email: string
  name: string | null
  plan: UserPlan
  status: UserStatus
  created_at: Date
  updated_at: Date
}

export interface Theme {
  id: string
  name: string
  slug: string
  description: string | null
  genre: string
  monthly_searches: number | null
  competition_level: CompetitionLevel | null
  avg_affiliate_price: number | null
  aeo_potential: AeoPotential | null
  difficulty_score: number | null
  is_active: boolean
  created_at: Date
}

export interface Site {
  id: string
  user_id: string
  theme_id: string
  subdomain: string
  custom_domain: string | null
  status: SiteStatus
  site_config: Record<string, unknown>
  aeo_config: Record<string, unknown>
  build_log: string | null
  published_at: Date | null
  created_at: Date
  updated_at: Date
}

export interface Offer {
  id: string
  asp: string
  external_id: string | null
  name: string
  description: string | null
  genre: string
  commission: number | null
  approval_rate: number | null
  epc: number | null
  affiliate_url: string | null
  product_url: string | null
  logo_url: string | null
  status: OfferStatus
  metadata: Record<string, unknown>
  created_at: Date
  updated_at: Date
}

export interface Article {
  id: string
  site_id: string
  title: string
  slug: string
  content: string | null
  meta_description: string | null
  focus_keyword: string | null
  category: string | null
  faq_data: Array<{ q: string; a: string }> | null
  json_ld: Record<string, unknown> | null
  status: ArticleStatus
  search_rank: number | null
  pv_count: number
  published_at: Date | null
  created_at: Date
  updated_at: Date
}

export interface DiagnosisPattern {
  id: string
  theme_id: string
  pattern_key: string
  result_title: string
  result_description: string | null
  result_icon: string | null
  recommended_offers: string[]
  aeo_faq: Array<{ q: string; a: string }> | null
  created_at: Date
}

export interface GenerationJob {
  id: string
  site_id: string
  type: JobType
  status: JobStatus
  payload: Record<string, unknown>
  result: Record<string, unknown> | null
  error: string | null
  started_at: Date | null
  finished_at: Date | null
  created_at: Date
}
