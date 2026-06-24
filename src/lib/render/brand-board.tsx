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

interface BrandBoardProps {
  clientName: string;
  brandKit: BrandKit;
}

export const BrandBoard: React.FC<BrandBoardProps> = ({ clientName, brandKit }) => {
  const colors = brandKit.colors_json || [];
  const typo = brandKit.typography_json || {
    heading_font: 'Inter',
    heading_weight: '700',
    body_font: 'Inter',
    body_weight: '400',
    accent_font: '',
    rationale: '',
  };
  const rules = brandKit.content_rules_json || { do_rules: [], dont_rules: [] };

  return (
    <div
      style={{
        fontFamily: `'${typo.body_font}', sans-serif`,
        color: '#1a1a1a',
        backgroundColor: '#fbfbfb',
        padding: '60px',
        maxWidth: '1200px',
        margin: '0 auto',
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
        borderRadius: '16px',
        border: '1px solid #eaeaea',
      }}
    >
      {/* Google Fonts Link */}
      <link
        href={`https://fonts.googleapis.com/css2?family=${typo.heading_font.replace(
          /\s+/g,
          '+'
        )}:wght@400;700&family=${typo.body_font.replace(/\s+/g, '+')}:wght@400;700&display=swap`}
        rel="stylesheet"
      />

      {/* Header */}
      <div
        style={{
          borderBottom: '2px solid #eaeaea',
          paddingBottom: '30px',
          marginBottom: '50px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        <div>
          <span
            style={{
              textTransform: 'uppercase',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '3px',
              color: '#8c8c8c',
              display: 'block',
              marginBottom: '8px',
            }}
          >
            Brand Identity Board
          </span>
          <h1
            style={{
              fontFamily: `'${typo.heading_font}', serif`,
              fontSize: '48px',
              fontWeight: 700,
              margin: 0,
              letterSpacing: '-1px',
            }}
          >
            {clientName}
          </h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#1a1a1a',
            }}
          >
            {brandKit.direction_name}
          </span>
        </div>
      </div>

      {/* Colors Section */}
      <div style={{ marginBottom: '60px' }}>
        <h2
          style={{
            fontFamily: `'${typo.heading_font}', serif`,
            fontSize: '24px',
            fontWeight: 700,
            marginBottom: '24px',
            borderBottom: '1px solid #eee',
            paddingBottom: '10px',
          }}
        >
          01 / Color Palette
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '20px',
          }}
        >
          {colors.map((color, index) => (
            <div key={index} style={{ textAlign: 'left' }}>
              <div
                style={{
                  backgroundColor: color.hex,
                  height: '140px',
                  borderRadius: '12px',
                  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
                  marginBottom: '12px',
                }}
              />
              <span style={{ fontWeight: 700, display: 'block', fontSize: '14px' }}>
                {color.name}
              </span>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: '#666',
                  display: 'block',
                  margin: '4px 0',
                }}
              >
                {color.hex}
              </span>
              <span style={{ fontSize: '11px', color: '#888', lineHeight: '1.4' }}>
                {color.usage}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Typography Section */}
      <div style={{ marginBottom: '60px' }}>
        <h2
          style={{
            fontFamily: `'${typo.heading_font}', serif`,
            fontSize: '24px',
            fontWeight: 700,
            marginBottom: '24px',
            borderBottom: '1px solid #eee',
            paddingBottom: '10px',
          }}
        >
          02 / Typography
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '40px',
          }}
        >
          <div>
            <div style={{ marginBottom: '24px' }}>
              <span style={{ fontSize: '12px', color: '#8c8c8c', fontWeight: 700 }}>HEADING FONT</span>
              <h3
                style={{
                  fontFamily: `'${typo.heading_font}', serif`,
                  fontSize: '36px',
                  margin: '8px 0',
                }}
              >
                {typo.heading_font}
              </h3>
              <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
                ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />
                abcdefghijklmnopqrstuvwxyz<br />
                1234567890 (!@#$%)
              </p>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#8c8c8c', fontWeight: 700 }}>BODY FONT</span>
              <h3
                style={{
                  fontFamily: `'${typo.body_font}', sans-serif`,
                  fontSize: '28px',
                  margin: '8px 0',
                }}
              >
                {typo.body_font}
              </h3>
              <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
                ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />
                abcdefghijklmnopqrstuvwxyz<br />
                1234567890 (!@#$%)
              </p>
            </div>
          </div>
          <div
            style={{
              backgroundColor: '#f1f1f1',
              padding: '30px',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 700 }}>Design Rationale</h4>
            <p style={{ fontSize: '14px', color: '#444', lineHeight: '1.6', margin: 0 }}>
              {typo.rationale}
            </p>
          </div>
        </div>
      </div>

      {/* Brand Directives */}
      <div style={{ marginBottom: '60px' }}>
        <h2
          style={{
            fontFamily: `'${typo.heading_font}', serif`,
            fontSize: '24px',
            fontWeight: 700,
            marginBottom: '24px',
            borderBottom: '1px solid #eee',
            paddingBottom: '10px',
          }}
        >
          03 / Brand System Direction
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '30px',
          }}
        >
          <div style={{ border: '1px solid #eee', padding: '24px', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700 }}>Logo & Visual Mark</h3>
            <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.6', margin: 0 }}>
              {brandKit.logo_direction}
            </p>
          </div>
          <div style={{ border: '1px solid #eee', padding: '24px', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700 }}>Photography Style</h3>
            <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.6', margin: 0 }}>
              {brandKit.photography_style}
            </p>
          </div>
          <div style={{ border: '1px solid #eee', padding: '24px', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700 }}>Social Media Vibe</h3>
            <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.6', margin: 0 }}>
              {brandKit.social_media_vibe}
            </p>
          </div>
          <div style={{ border: '1px solid #eee', padding: '24px', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700 }}>Ad Creative Vibe</h3>
            <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.6', margin: 0 }}>
              {brandKit.ad_content_style}
            </p>
          </div>
        </div>
      </div>

      {/* Brand Rules (Do's and Don'ts) */}
      <div>
        <h2
          style={{
            fontFamily: `'${typo.heading_font}', serif`,
            fontSize: '24px',
            fontWeight: 700,
            marginBottom: '24px',
            borderBottom: '1px solid #eee',
            paddingBottom: '10px',
          }}
        >
          04 / Content Rules
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '40px',
          }}
        >
          <div
            style={{
              backgroundColor: '#eef8f2',
              padding: '30px',
              borderRadius: '12px',
              borderLeft: '4px solid #34a853',
            }}
          >
            <h3 style={{ margin: '0 0 15px 0', color: '#2b7842', fontSize: '18px', fontWeight: 700 }}>
              DO — Best Practices
            </h3>
            <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '14px', color: '#2b7842', lineHeight: '1.8' }}>
              {rules.do_rules.map((rule, index) => (
                <li key={index} style={{ marginBottom: '8px' }}>
                  {rule}
                </li>
              ))}
            </ul>
          </div>
          <div
            style={{
              backgroundColor: '#fdf3f2',
              padding: '30px',
              borderRadius: '12px',
              borderLeft: '4px solid #ea4335',
            }}
          >
            <h3 style={{ margin: '0 0 15px 0', color: '#b32a1f', fontSize: '18px', fontWeight: 700 }}>
              AVOID — Do Not Rules
            </h3>
            <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '14px', color: '#b32a1f', lineHeight: '1.8' }}>
              {rules.dont_rules.map((rule, index) => (
                <li key={index} style={{ marginBottom: '8px' }}>
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
