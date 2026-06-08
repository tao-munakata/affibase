// A8.net Publisher API client
// Real API docs: https://support.a8.net/as/api/
// Auth: X-API-KEY header
// Base: https://api.a8.net/as/v1/

export interface A8Program {
  program_id: string
  program_name: string
  category: string
  reward_amount: number
  approval_rate: number
  program_url: string
  affiliate_link: string
  epc: number
  status: 'active' | 'paused' | 'terminated'
}

export interface A8Transaction {
  date: string       // YYYY-MM-DD
  program_id: string
  click_count: number
  approved_count: number
  pending_count: number
  reward_amount: number
}

const MOCK_PROGRAMS: A8Program[] = [
  { program_id: 'A8001', program_name: 'クラウドワークス',     category: '副業',           reward_amount: 2000, approval_rate: 81.0, epc: 45.0, program_url: 'https://crowdworks.jp',        affiliate_link: 'https://px.a8.net/A8001', status: 'active' },
  { program_id: 'A8002', program_name: 'ランサーズ',           category: '副業',           reward_amount: 1500, approval_rate: 79.5, epc: 38.0, program_url: 'https://www.lancers.jp',       affiliate_link: 'https://px.a8.net/A8002', status: 'active' },
  { program_id: 'A8003', program_name: 'Udemy（ユーデミー）',  category: 'オンライン学習', reward_amount: 1200, approval_rate: 88.0, epc: 25.0, program_url: 'https://www.udemy.com/ja',     affiliate_link: 'https://px.a8.net/A8003', status: 'active' },
  { program_id: 'A8004', program_name: 'ChatGPT Plus',         category: 'AIツール',       reward_amount: 2500, approval_rate: 65.0, epc: 55.0, program_url: 'https://chat.openai.com',     affiliate_link: 'https://px.a8.net/A8004', status: 'active' },
  { program_id: 'A8005', program_name: 'スキルハックス',       category: '副業',           reward_amount: 3000, approval_rate: 74.0, epc: 65.0, program_url: 'https://skillhacks.jp',       affiliate_link: 'https://px.a8.net/A8005', status: 'active' },
  { program_id: 'A8006', program_name: 'ストアカ',             category: 'オンライン学習', reward_amount: 800,  approval_rate: 85.0, epc: 20.0, program_url: 'https://www.street-academy.com', affiliate_link: 'https://px.a8.net/A8006', status: 'active' },
  { program_id: 'A8007', program_name: 'Notion（日本語版）',   category: 'AIツール',       reward_amount: 1800, approval_rate: 70.0, epc: 40.0, program_url: 'https://www.notion.so/ja-jp', affiliate_link: 'https://px.a8.net/A8007', status: 'active' },
]

function mockTransactions(days = 30): A8Transaction[] {
  const txns: A8Transaction[] = []
  const programs = ['A8001', 'A8002', 'A8005']
  for (let i = 0; i < days; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const date = d.toISOString().slice(0, 10)
    for (const pid of programs) {
      const clicks = Math.floor(Math.random() * 30) + 5
      const approved = Math.max(1, Math.floor(clicks * 0.06))
      const program = MOCK_PROGRAMS.find((p) => p.program_id === pid)!
      txns.push({ date, program_id: pid, click_count: clicks, approved_count: approved, pending_count: Math.floor(approved * 0.2), reward_amount: approved * program.reward_amount })
    }
  }
  return txns
}

export async function fetchA8Programs(): Promise<A8Program[]> {
  const apiKey = process.env.A8_API_KEY
  if (!apiKey) {
    console.warn('[a8] API key not set — using mock data')
    return MOCK_PROGRAMS
  }
  const res = await fetch('https://api.a8.net/as/v1/programs?page=1&size=200&status=active', {
    headers: { 'X-API-KEY': apiKey, 'Accept': 'application/json' },
  })
  if (!res.ok) throw new Error(`A8 API error: ${res.status} ${await res.text()}`)
  const data = await res.json() as { programs: A8Program[] }
  return data.programs
}

export async function fetchA8Transactions(fromDate: string, toDate: string): Promise<A8Transaction[]> {
  const apiKey = process.env.A8_API_KEY
  if (!apiKey) {
    console.warn('[a8] API key not set — using mock transaction data')
    return mockTransactions(30)
  }
  const params = new URLSearchParams({ from: fromDate, to: toDate, size: '500' })
  const res = await fetch(`https://api.a8.net/as/v1/transactions?${params}`, {
    headers: { 'X-API-KEY': apiKey, 'Accept': 'application/json' },
  })
  if (!res.ok) throw new Error(`A8 transactions error: ${res.status}`)
  const data = await res.json() as { transactions: A8Transaction[] }
  return data.transactions
}
