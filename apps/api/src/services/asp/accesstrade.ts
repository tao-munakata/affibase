// AccessTrade Publisher API client
// Real API docs: https://accesstrade.ne.jp/web/publisher/api/
// Auth: X-API-KEY header
// Base: https://api.accesstrade.ne.jp/v2/

export interface ATProgram {
  program_id: string
  program_name: string
  genre: string
  reward: number
  approve_rate: number
  url: string
  tracking_url: string
  epc: number
  status: 'active' | 'paused' | 'terminated'
}

export interface ATPerformance {
  date: string       // YYYY-MM-DD
  program_id: string
  click_count: number
  cv_count: number
  approve_count: number
  reward: number
}

const MOCK_PROGRAMS: ATProgram[] = [
  { program_id: 'AT001', program_name: 'doda（デューダ）',      genre: '転職', reward: 5000,  approve_rate: 72.5, epc: 85.0,  url: 'https://doda.jp',        tracking_url: 'https://affiliate.accesstrade.ne.jp/link/AT001', status: 'active' },
  { program_id: 'AT002', program_name: 'リクルートエージェント', genre: '転職', reward: 8000,  approve_rate: 68.0, epc: 120.0, url: 'https://r-agent.com',     tracking_url: 'https://affiliate.accesstrade.ne.jp/link/AT002', status: 'active' },
  { program_id: 'AT003', program_name: 'マイナビ転職',          genre: '転職', reward: 4500,  approve_rate: 75.0, epc: 78.0,  url: 'https://tenshoku.mynavi.jp', tracking_url: 'https://affiliate.accesstrade.ne.jp/link/AT003', status: 'active' },
  { program_id: 'AT004', program_name: 'ビズリーチ',            genre: '転職', reward: 10000, approve_rate: 60.0, epc: 150.0, url: 'https://www.bizreach.jp',  tracking_url: 'https://affiliate.accesstrade.ne.jp/link/AT004', status: 'active' },
  { program_id: 'AT005', program_name: 'ライザップ英語',        genre: 'オンライン学習', reward: 6000, approve_rate: 55.0, epc: 90.0, url: 'https://www.rizap.jp/eigo', tracking_url: 'https://affiliate.accesstrade.ne.jp/link/AT005', status: 'active' },
]

function mockPerformance(days = 30): ATPerformance[] {
  const records: ATPerformance[] = []
  const programs = ['AT001', 'AT002']
  for (let i = 0; i < days; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const date = d.toISOString().slice(0, 10)
    for (const pid of programs) {
      const clicks = Math.floor(Math.random() * 50) + 10
      const cv = Math.max(1, Math.floor(clicks * 0.05))
      const approved = Math.max(1, Math.floor(cv * 0.8))
      const program = MOCK_PROGRAMS.find((p) => p.program_id === pid)!
      records.push({ date, program_id: pid, click_count: clicks, cv_count: cv, approve_count: approved, reward: approved * program.reward })
    }
  }
  return records
}

export async function fetchATPrograms(): Promise<ATProgram[]> {
  const apiKey = process.env.ACCESSTRADE_API_KEY
  if (!apiKey) {
    console.warn('[accesstrade] API key not set — using mock data')
    return MOCK_PROGRAMS
  }
  const res = await fetch('https://api.accesstrade.ne.jp/v2/programs?limit=200&status=active', {
    headers: { 'X-API-KEY': apiKey, 'Accept': 'application/json' },
  })
  if (!res.ok) throw new Error(`AccessTrade API error: ${res.status} ${await res.text()}`)
  const data = await res.json() as { programs: ATProgram[] }
  return data.programs
}

export async function fetchATPerformance(fromDate: string, toDate: string): Promise<ATPerformance[]> {
  const apiKey = process.env.ACCESSTRADE_API_KEY
  if (!apiKey) {
    console.warn('[accesstrade] API key not set — using mock performance data')
    return mockPerformance(30)
  }
  const params = new URLSearchParams({ from: fromDate, to: toDate, limit: '500' })
  const res = await fetch(`https://api.accesstrade.ne.jp/v2/performance/daily?${params}`, {
    headers: { 'X-API-KEY': apiKey, 'Accept': 'application/json' },
  })
  if (!res.ok) throw new Error(`AccessTrade performance error: ${res.status}`)
  const data = await res.json() as { data: ATPerformance[] }
  return data.data
}
