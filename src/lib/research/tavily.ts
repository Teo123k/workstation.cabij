type TavilySearchResult = {
  title?: string
  url: string
  content?: string
  raw_content?: string | null
  score?: number
  favicon?: string
}

type TavilySearchResponse = {
  query: string
  answer?: string
  results: TavilySearchResult[]
  auto_parameters?: {
    topic?: string
    search_depth?: string
  }
  usage?: {
    credits?: number
  }
  request_id?: string
}

type TavilyExtractResult = {
  url: string
  raw_content?: string | null
  favicon?: string
}

type TavilyExtractResponse = {
  results: TavilyExtractResult[]
  failed_results?: Array<{ url?: string; error?: string }>
  usage?: {
    credits?: number
  }
  request_id?: string
}

const tavilyFetch = async <T>(path: string, body: Record<string, unknown>) => {
  const apiKey = process.env.TAVILY_API_KEY

  if (!apiKey) {
    throw new Error('Missing TAVILY_API_KEY')
  }

  const response = await fetch(`https://api.tavily.com/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Tavily ${path} failed: ${response.status} ${errorText}`)
  }

  return (await response.json()) as T
}

export const tavilySearch = async (input: {
  query: string
  searchDepth?: 'basic' | 'advanced' | 'fast' | 'ultra-fast'
  maxResults?: number
  topic?: 'general' | 'news' | 'finance'
  includeDomains?: string[]
  excludeDomains?: string[]
  country?: string
}) =>
  tavilyFetch<TavilySearchResponse>('search', {
    query: input.query,
    search_depth: input.searchDepth ?? 'basic',
    max_results: input.maxResults ?? 5,
    topic: input.topic ?? 'general',
    include_domains: input.includeDomains,
    exclude_domains: input.excludeDomains,
    include_answer: false,
    include_favicon: true,
    include_usage: true,
    country: input.country,
  })

export const tavilyExtract = async (input: {
  urls: string[]
  query: string
  extractDepth?: 'basic' | 'advanced'
}) =>
  tavilyFetch<TavilyExtractResponse>('extract', {
    urls: input.urls,
    query: input.query,
    extract_depth: input.extractDepth ?? 'basic',
    format: 'markdown',
    include_favicon: true,
    include_usage: true,
    chunks_per_source: 3,
  })

export const compactText = (value: string | null | undefined, maxLength = 700) => {
  const normalized = String(value || '')
    .replace(/\s+/g, ' ')
    .trim()

  if (!normalized) {
    return ''
  }

  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 3)}...` : normalized
}
