// OpenAI System and User Prompt Templates for Branding OS

export const BRIEF_EXTRACTION_PROMPT = `
You are a brand strategist. Extract structured brand brief data from the following client input.

Client input:
"""
{{raw_brief_text}}
"""

Return a JSON object with these exact fields. Use null for any field not mentioned:
{
  "business_name": "string or null",
  "industry": "string or null",
  "target_audience": "string or null",
  "location": "string or null",
  "offer": "string or null — what they sell or provide",
  "price_level": "string or null — budget, mid-range, premium, luxury",
  "competitors": "string or null — comma-separated competitor names",
  "website_url": "string or null",
  "instagram_url": "string or null",
  "desired_feeling": "string or null — how they want the brand to feel",
  "visual_references": "string or null",
  "things_to_avoid": "string or null"
}

Return ONLY the JSON object. No explanation. No markdown code fences.
`;

export const STRATEGY_GENERATION_PROMPT = `
You are an elite brand strategist at a premium digital marketing agency.
Generate a comprehensive brand strategy based on the following brand brief.

BRAND BRIEF:
"""
{{extracted_brief_json}}
"""

CLIENT NAME: {{client_name}}

Generate a brand strategy with the following EXACT fields. Return as a JSON object:
{
  "positioning": "2-3 sentence brand positioning statement. Define the unique space this brand occupies in the market.",
  "audience_profile": "Detailed target audience profile. Include demographics, psychographics, pain points, aspirations, media consumption habits, and buying behavior.",
  "brand_personality": "3-5 brand personality traits with brief explanations. Example: 'Confident — speaks with authority without arrogance'",
  "tone_of_voice": "Describe the brand's tone of voice with do and don't examples. Include: formality level, humor level, vocabulary style, sentence structure.",
  "visual_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "competitor_gap": "Analysis of where competitors fall short and where this brand can win. Be specific about the unoccupied territory.",
  "social_media_direction": "High-level social media approach: content themes, engagement style, platform priority, content frequency."
}

Return ONLY the JSON object. No explanation. No markdown code fences.
`;

export const KIT_GENERATION_PROMPT = `
You are a creative director at a premium branding agency.
Generate exactly 3 distinct brand kit directions based on the brand strategy below.

BRAND STRATEGY:
"""
{{strategy_json}}
"""

BRAND BRIEF:
"""
{{extracted_brief_json}}
"""

CLIENT NAME: {{client_name}}

Generate exactly 3 directions. Each direction must be meaningfully different.

Direction A: Premium / Minimal — sophisticated, clean, high-end
Direction B: Warm / Lifestyle — approachable, authentic, human
Direction C: Bold / Social-First — energetic, attention-grabbing, digital-native

For EACH direction, return this exact JSON structure:
[
  {
    "direction_name": "Direction A — Premium Minimal",
    "colors_json": [
      {"name": "Primary", "hex": "#HEXCODE", "usage": "backgrounds, headers"},
      {"name": "Secondary", "hex": "#HEXCODE", "usage": "body text, accents"},
      {"name": "Accent", "hex": "#HEXCODE", "usage": "CTAs, highlights"},
      {"name": "Neutral Light", "hex": "#HEXCODE", "usage": "backgrounds"},
      {"name": "Neutral Dark", "hex": "#HEXCODE", "usage": "text"}
    ],
    "typography_json": {
      "heading_font": "Font Name",
      "heading_weight": "weight",
      "body_font": "Font Name",
      "body_weight": "weight",
      "accent_font": "Font Name or null",
      "rationale": "why this pairing works"
    },
    "logo_direction": "description of logo style, mark type, wordmark approach",
    "photography_style": "description of photo mood, lighting, composition, subject matter",
    "social_media_vibe": "description of social presence feeling",
    "instagram_grid_style": "description of grid layout pattern",
    "ad_content_style": "description of ad creative approach",
    "content_rules_json": {
      "do_rules": ["rule 1", "rule 2", "rule 3", "rule 4", "rule 5"],
      "dont_rules": ["rule 1", "rule 2", "rule 3", "rule 4", "rule 5"]
    }
  },
  { ... Direction B ... },
  { ... Direction C ... }
]

Rules:
- Use REAL hex color codes that work well together.
- Use REAL font names from Google Fonts.
- Make each direction genuinely distinct in mood and visual identity.
- Return ONLY the JSON array. No explanation. No markdown code fences.
`;

export const KIT_REVISION_PROMPT = `
You are a creative director at a premium branding agency.
Revise the following brand kit direction based on client feedback.

CURRENT BRAND KIT:
"""
{{full_brand_kit_json}}
"""

CLIENT FEEDBACK:
"""
{{feedback_text}}
"""

Generate a revised version of this brand kit that incorporates the feedback.
Keep everything the client didn't mention. Only change what they asked for.
Return the same JSON structure as the original kit.

Return ONLY the JSON object. No explanation. No markdown code fences.
`;

export const SOCIAL_STRATEGY_PROMPT = `
You are a senior social media strategist at a premium digital marketing agency.
Generate a comprehensive, platform-specific social media strategy based on the approved brand kit.

BRAND KIT:
"""
{{full_brand_kit_json}}
"""

BRAND STRATEGY:
"""
{{strategy_json}}
"""

CLIENT: {{client_name}}
INDUSTRY: {{industry}}

Generate a strategy with the following EXACT JSON structure:
{
  "instagram": {
    "grid_layout_style": "description of grid pattern (e.g., 3-column theme, alternating, checkerboard)",
    "post_types": ["carousel", "single image", "reel", "story"],
    "content_pillars": [
      {"name": "pillar name", "description": "what this pillar covers", "frequency": "posts per week"}
    ],
    "hashtag_strategy": {
      "branded": ["#hashtag1", "#hashtag2"],
      "community": ["#hashtag1", "#hashtag2"],
      "trending_approach": "how to use trending hashtags"
    },
    "reel_concepts": [
      {"hook": "attention-grabbing first line", "concept": "what the reel shows", "cta": "call to action"}
    ],
    "story_engagement": "polls, Q&A, behind-scenes cadence",
    "posting_schedule": {"days": ["Mon", "Wed", "Fri"], "times": ["10:00", "18:00"], "frequency": "3x/week"}
  },
  "tiktok": {
    "content_themes": ["educational", "entertainment", "trending"],
    "video_formats": ["duet-worthy", "stitch-worthy", "original"],
    "hook_templates": ["hook 1", "hook 2", "hook 3", "hook 4", "hook 5"],
    "sound_strategy": "trending audio vs. original",
    "posting_schedule": {"days": ["Tue", "Thu", "Sat"], "times": ["12:00", "20:00"], "frequency": "3x/week"}
  },
  "linkedin": {
    "content_types": ["thought leadership", "case study", "company culture"],
    "post_formats": ["text", "carousel document", "video", "article"],
    "engagement_strategy": "comment approach, DM outreach",
    "posting_schedule": {"days": ["Tue", "Thu"], "times": ["08:00", "12:00"], "frequency": "2x/week"}
  },
  "cross_platform": {
    "content_repurposing_map": "which content adapts to which platform",
    "platform_priority_ranking": ["instagram", "tiktok", "linkedin"],
    "thirty_day_calendar": [
      {"day": 1, "platform": "instagram", "content_type": "carousel", "topic": "topic", "pillar": "pillar name"},
      {"day": 2, "platform": "tiktok", "content_type": "reel", "topic": "topic", "pillar": "pillar name"}
    ]
  }
}

The thirty_day_calendar must have exactly 30 entries (one per day).
Return ONLY the JSON object. No explanation. No markdown code fences.
`;
