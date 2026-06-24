// WCAG contrast and brand quality check rules

export interface Color {
  name: string;
  hex: string;
  usage: string;
}

export interface Typography {
  heading_font: string;
  heading_weight: string;
  body_font: string;
  body_weight: string;
  accent_font?: string | null;
  rationale: string;
}

export interface QualityCheckResult {
  passed: boolean;
  score: number; // 0 to 100
  details: string[];
}

// Simple hex to RGB converter
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// Formula for relative luminance
function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map((val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Formula for contrast ratio
export function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 1;

  const l1 = relativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = relativeLuminance(rgb2.r, rgb2.g, rgb2.b);

  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);

  return (brightest + 0.05) / (darkest + 0.05);
}

export function performQualityCheck(colors: Color[], typography: Typography): QualityCheckResult {
  const details: string[] = [];
  let passed = true;
  let score = 100;

  // 1. Color Contrast Checks (Primary vs Light Background, Text vs Dark Background, etc.)
  const primaryColor = colors.find((c) => c.name.toLowerCase() === 'primary')?.hex || colors[0]?.hex;
  const secondaryColor = colors.find((c) => c.name.toLowerCase() === 'secondary')?.hex || colors[1]?.hex;
  const neutralLight = colors.find((c) => c.name.toLowerCase().includes('light'))?.hex || '#ffffff';
  const neutralDark = colors.find((c) => c.name.toLowerCase().includes('dark'))?.hex || '#000000';

  if (primaryColor && neutralLight) {
    const contrast = getContrastRatio(primaryColor, neutralLight);
    if (contrast < 4.5) {
      passed = false;
      score -= 20;
      details.push(`Low contrast between Primary (${primaryColor}) and Light Background (${neutralLight}): ${contrast.toFixed(2)}:1 (Min 4.5:1 required for WCAG AA).`);
    } else {
      details.push(`Primary to Light Background contrast is good: ${contrast.toFixed(2)}:1.`);
    }
  }

  if (neutralDark && neutralLight) {
    const contrast = getContrastRatio(neutralDark, neutralLight);
    if (contrast < 7.0) {
      score -= 10;
      details.push(`Neutral text-to-background contrast is ${contrast.toFixed(2)}:1 (Ideally 7+:1 for AAA).`);
    }
  }

  // 2. Typography Pairings Checks
  if (typography.heading_font === typography.body_font) {
    score -= 15;
    details.push(`Warning: Heading font and body font are identical (${typography.heading_font}). Try pairing a serif with a sans-serif or distinct weights for stronger hierarchy.`);
  } else {
    details.push(`Font pairing detected: Heading [${typography.heading_font}] and Body [${typography.body_font}].`);
  }

  if (typography.heading_weight === 'normal' || typography.heading_weight === '400') {
    score -= 10;
    details.push(`Warning: Heading weight is light/normal. Bold weights (e.g. 700) are recommended for title hierarchy.`);
  }

  // 3. Palette Polish
  if (colors.length < 3) {
    passed = false;
    score -= 30;
    details.push('Error: Brand palette must contain at least 3 colors (Primary, Secondary, Accent).');
  }

  return {
    passed: passed && score >= 70,
    score: Math.max(0, score),
    details,
  };
}
