import { Pool } from 'pg'

const globalForResearchDb = globalThis as typeof globalThis & {
  researchPool?: Pool
}

export const getResearchPool = () => {
  if (!globalForResearchDb.researchPool) {
    globalForResearchDb.researchPool = new Pool({
      connectionString: process.env.DATABASE_URL,
    })
  }

  return globalForResearchDb.researchPool
}
