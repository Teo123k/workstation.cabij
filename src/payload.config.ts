import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Clients } from './collections/Clients'
import { BrandBriefs } from './collections/BrandBriefs'
import { BrandStrategies } from './collections/BrandStrategies'
import { BrandKits } from './collections/BrandKits'
import { BrandAssets } from './collections/BrandAssets'
import { BrandExports } from './collections/BrandExports'
import { BrandSocialStrategies } from './collections/BrandSocialStrategies'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Media,
    Clients,
    BrandBriefs,
    BrandStrategies,
    BrandKits,
    BrandAssets,
    BrandExports,
    BrandSocialStrategies
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    push: false,
  }),
  sharp,
  plugins: [],
})
