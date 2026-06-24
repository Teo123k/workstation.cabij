import React from 'react';

interface Color {
  name: string;
  hex: string;
  usage: string;
}

interface Typography {
  heading_font: string;
  heading_weight: string;
  body_font: string;
  body_weight: string;
  accent_font?: string | null;
  rationale: string;
}

interface BrandKit {
  direction_name: string;
  colors_json: Color[];
  typography_json: Typography;
  logo_direction: string;
  photography_style: string;
  social_media_vibe: string;
  instagram_grid_style: string;
  ad_content_style: string;
  content_rules_json: {
    do_rules: string[];
    dont_rules: string[];
  };
}

interface BrandStrategy {
  positioning: string;
  audience_profile: string;
  brand_personality: string;
  tone_of_voice: string;
  competitor_gap: string;
  social_media_direction: string;
}

interface BrandGuidelinesProps {
  clientName: string;
  brandKit: BrandKit;
  brandStrategy: BrandStrategy;
}

export const BrandGuidelines: React.FC<BrandGuidelinesProps> = ({
  clientName,
  brandKit,
  brandStrategy,
}) => {
  const typo = brandKit.typography_json || {
    heading_font: 'Inter',
    heading_weight: '700',
    body_font: 'Inter',
    body_weight: '400',
    accent_font: '',
    rationale: '',
  };
  const colors = brandKit.colors_json || [];

  return (
    <div
      style={{
        fontFamily: `'${typo.body_font}', sans-serif`,
        color: '#1a1a1a',
        backgroundColor: '#ffffff',
        padding: '0',
        maxWidth: '900px',
        margin: '0 auto',
      }}
    >
      <link
        href={`https://fonts.googleapis.com/css2?family=${typo.heading_font.replace(
          /\s+/g,
          '+'
        )}:wght@400;700&family=${typo.body_font.replace(/\s+/g, '+')}:wght@400;700&display=swap`}
        rel="stylesheet"
      />

      {/* PAGE 1: COVER */}
      <div
        className="page"
        style={{
          height: '1100px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          boxSizing: 'border-box',
          backgroundColor: colors[0]?.hex || '#1a1a1a',
          color: colors[3]?.hex || '#ffffff',
          marginBottom: '50px',
          pageBreakAfter: 'always',
        }}
      >
        <div>
          <span style={{ letterSpacing: '4px', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase' }}>
            Brand Guidelines
          </span>
        </div>
        <div>
          <h1
            style={{
              fontFamily: `'${typo.heading_font}', serif`,
              fontSize: '64px',
              fontWeight: 700,
              margin: '0 0 20px 0',
              lineHeight: '1.1',
            }}
          >
            {clientName}
          </h1>
          <p style={{ fontSize: '20px', margin: 0, opacity: 0.8 }}>
            Brand Strategy & Visual Guidelines
          </p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', opacity: 0.6 }}>
          <span>Version 1.0</span>
          <span>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</span>
        </div>
      </div>

      {/* PAGE 2: BRAND POSITIONING */}
      <div
        className="page"
        style={{
          height: '1100px',
          padding: '80px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          marginBottom: '50px',
          pageBreakAfter: 'always',
        }}
      >
        <span style={{ fontSize: '12px', color: '#888', fontWeight: 700, letterSpacing: '2px' }}>01 / BRAND STRATEGY</span>
        <h2 style={{ fontFamily: `'${typo.heading_font}', serif`, fontSize: '36px', margin: '15px 0 30px 0' }}>
          Brand Positioning
        </h2>
        <div style={{ fontSize: '18px', lineHeight: '1.8', color: '#333', marginBottom: '40px' }}>
          <p style={{ fontWeight: 700, fontSize: '22px', color: '#000', lineHeight: '1.6' }}>
            {brandStrategy.positioning}
          </p>
        </div>
        <div>
          <h4 style={{ margin: '0 0 10px 0', textTransform: 'uppercase', fontSize: '14px', color: '#666' }}>
            Competitor Advantage
          </h4>
          <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#555', margin: 0 }}>
            {brandStrategy.competitor_gap}
          </p>
        </div>
      </div>

      {/* PAGE 3: BRAND PERSONALITY & TONE */}
      <div
        className="page"
        style={{
          height: '1100px',
          padding: '80px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          marginBottom: '50px',
          pageBreakAfter: 'always',
        }}
      >
        <span style={{ fontSize: '12px', color: '#888', fontWeight: 700, letterSpacing: '2px' }}>02 / BRAND IDENTITY</span>
        <h2 style={{ fontFamily: `'${typo.heading_font}', serif`, fontSize: '36px', margin: '15px 0 30px 0' }}>
          Voice & Personality
        </h2>
        <div style={{ marginBottom: '40px' }}>
          <h4 style={{ margin: '0 0 12px 0', textTransform: 'uppercase', fontSize: '14px', color: '#666' }}>
            Personality Traits
          </h4>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#333', margin: 0 }}>
            {brandStrategy.brand_personality}
          </p>
        </div>
        <div>
          <h4 style={{ margin: '0 0 12px 0', textTransform: 'uppercase', fontSize: '14px', color: '#666' }}>
            Tone of Voice Guidelines
          </h4>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#333', margin: 0 }}>
            {brandStrategy.tone_of_voice}
          </p>
        </div>
      </div>
    </div>
  );
};
