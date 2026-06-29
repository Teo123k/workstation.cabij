export type BrandAssetRole =
  | 'logo_ref'
  | 'moodboard'
  | 'color_board'
  | 'image_ref'
  | 'face_ref'
  | 'background_ref'
  | 'style_ref'
  | 'competitor_ref'
  | 'pdf_ref'

export const ROLE_OPTIONS: Array<{
  value: BrandAssetRole
  label: string
  description: string
  required?: boolean
}> = [
  {
    value: 'image_ref',
    label: 'Food, product, service',
    description: 'Photos that show what the client sells or delivers.',
    required: true,
  },
  {
    value: 'style_ref',
    label: 'Style reference',
    description: 'Moodboards, screenshots, or visuals showing the desired direction.',
    required: true,
  },
  {
    value: 'logo_ref',
    label: 'Logo or current brand',
    description: 'Logo, wordmark, old brand mark, or current identity files.',
  },
  {
    value: 'face_ref',
    label: 'Founder or team',
    description: 'Portraits for personal-led brands, chef brands, and service businesses.',
  },
  {
    value: 'background_ref',
    label: 'Location or event',
    description: 'Venue, restaurant, workspace, retreat, event, or environment photos.',
  },
  {
    value: 'competitor_ref',
    label: 'Competitor or reference brand',
    description: 'Competitor screenshots, market references, or brands to learn from.',
  },
  {
    value: 'pdf_ref',
    label: 'Old material or document',
    description: 'Menus, flyers, decks, PDFs, proposals, or previous marketing material.',
  },
  {
    value: 'moodboard',
    label: 'Moodboard',
    description: 'Curated board generated or approved for this project.',
  },
]

const ROLE_ALIASES: Record<string, BrandAssetRole> = {
  product_ref: 'image_ref',
  food_ref: 'image_ref',
  service_ref: 'image_ref',
  location_ref: 'background_ref',
  venue_ref: 'background_ref',
  event_ref: 'background_ref',
  material_ref: 'pdf_ref',
  old_material_ref: 'pdf_ref',
  team_ref: 'face_ref',
  founder_ref: 'face_ref',
  lifestyle_ref: 'background_ref',
  packaging_ref: 'image_ref',
  interior_ref: 'background_ref',
}

export function normalizeBrandAssetRole(role: string): BrandAssetRole {
  const cleanRole = role.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')

  if (ROLE_OPTIONS.some((option) => option.value === cleanRole)) {
    return cleanRole as BrandAssetRole
  }

  return ROLE_ALIASES[cleanRole] || 'image_ref'
}

export function getRoleLabel(role: string): string {
  const normalizedRole = normalizeBrandAssetRole(role)
  return ROLE_OPTIONS.find((option) => option.value === normalizedRole)?.label || normalizedRole
}

