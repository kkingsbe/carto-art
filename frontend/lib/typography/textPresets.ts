import type { PosterConfig } from '@/types/poster';

export interface TextPreset {
  id: string;
  name: string;
  description: string;
  settings: Partial<PosterConfig['typography']>;
}

export const TEXT_PRESETS: TextPreset[] = [
  {
    id: 'modern-bold',
    name: 'Modern Bold',
    description: 'Large, confident sans-serif with strong presence',
    settings: {
      titleFont: 'Inter',
      titleSize: 8,
      titleWeight: 700,
      titleLetterSpacing: -0.02,
      titleAllCaps: true,
      subtitleFont: 'Inter',
      subtitleSize: 2.5,
      subtitleWeight: 400,
      subtitleLetterSpacing: 0.05,
      textBackdrop: 'subtle',
      showTitle: true,
      showSubtitle: true,
    }
  },
  {
    id: 'classic-serif',
    name: 'Classic Serif',
    description: 'Elegant traditional typography with refined contrast',
    settings: {
      titleFont: 'Playfair Display',
      titleSize: 7.5,
      titleWeight: 600,
      titleLetterSpacing: 0,
      titleAllCaps: false,
      subtitleFont: 'Montserrat',
      subtitleSize: 2,
      subtitleWeight: 300,
      subtitleLetterSpacing: 0.08,
      textBackdrop: 'gradient',
      backdropHeight: 40,
      backdropSharpness: 60,
      showTitle: true,
      showSubtitle: true,
    }
  },
  {
    id: 'minimal-clean',
    name: 'Minimal Clean',
    description: 'Simple, understated design with maximum clarity',
    settings: {
      titleFont: 'Inter',
      titleSize: 6,
      titleWeight: 400,
      titleLetterSpacing: 0.02,
      titleAllCaps: false,
      subtitleFont: 'Inter',
      subtitleSize: 1.8,
      subtitleWeight: 300,
      subtitleLetterSpacing: 0.1,
      textBackdrop: 'none',
      showTitle: true,
      showSubtitle: true,
    }
  },
  {
    id: 'editorial-strong',
    name: 'Editorial Strong',
    description: 'Magazine-style layout with dramatic hierarchy',
    settings: {
      titleFont: 'Montserrat',
      titleSize: 9.5,
      titleWeight: 900,
      titleLetterSpacing: -0.04,
      titleAllCaps: true,
      subtitleFont: 'Crimson Text',
      subtitleSize: 2.2,
      subtitleWeight: 400,
      subtitleLetterSpacing: 0.03,
      textBackdrop: 'strong',
      backdropHeight: 45,
      showTitle: true,
      showSubtitle: true,
    }
  },
  {
    id: 'vintage-elegant',
    name: 'Vintage Elegant',
    description: 'Classic book-style typography with timeless appeal',
    settings: {
      titleFont: 'Crimson Text',
      titleSize: 7,
      titleWeight: 600,
      titleLetterSpacing: 0.01,
      titleAllCaps: false,
      subtitleFont: 'Crimson Text',
      subtitleSize: 2.5,
      subtitleWeight: 400,
      subtitleLetterSpacing: 0.12,
      textBackdrop: 'subtle',
      backdropHeight: 30,
      showTitle: true,
      showSubtitle: true,
    }
  },
  {
    id: 'technical-mono',
    name: 'Technical Mono',
    description: 'Monospace precision for a technical aesthetic',
    settings: {
      titleFont: 'JetBrains Mono',
      titleSize: 6.5,
      titleWeight: 700,
      titleLetterSpacing: 0,
      titleAllCaps: true,
      subtitleFont: 'JetBrains Mono',
      subtitleSize: 1.5,
      subtitleWeight: 400,
      subtitleLetterSpacing: 0.05,
      textBackdrop: 'none',
      showTitle: true,
      showSubtitle: true,
    }
  },
  {
    id: 'geometric-modern',
    name: 'Geometric Modern',
    description: 'Contemporary sans-serif with geometric precision',
    settings: {
      titleFont: 'Poppins',
      titleSize: 8.5,
      titleWeight: 600,
      titleLetterSpacing: -0.01,
      titleAllCaps: false,
      subtitleFont: 'Poppins',
      subtitleSize: 2.3,
      subtitleWeight: 300,
      subtitleLetterSpacing: 0.06,
      textBackdrop: 'gradient',
      backdropHeight: 35,
      backdropSharpness: 40,
      showTitle: true,
      showSubtitle: true,
    }
  },
  {
    id: 'condensed-impact',
    name: 'Condensed Impact',
    description: 'Tall, narrow letterforms for maximum impact',
    settings: {
      titleFont: 'Montserrat',
      titleSize: 10,
      titleWeight: 800,
      titleLetterSpacing: -0.03,
      titleAllCaps: true,
      subtitleFont: 'Inter',
      subtitleSize: 1.6,
      subtitleWeight: 400,
      subtitleLetterSpacing: 0.15,
      textBackdrop: 'strong',
      backdropHeight: 50,
      showTitle: true,
      showSubtitle: true,
    }
  },
];

/**
 * Check if current typography settings match a preset
 */
export function getActivePreset(
  typography: PosterConfig['typography'],
  presets: TextPreset[] = TEXT_PRESETS
): TextPreset | null {
  for (const preset of presets) {
    let matches = true;

    // Check key fields that define the preset
    const keyFields: (keyof typeof preset.settings)[] = [
      'titleFont',
      'titleSize',
      'titleWeight',
      'subtitleFont',
      'subtitleSize',
    ];

    for (const field of keyFields) {
      if (preset.settings[field] !== typography[field]) {
        matches = false;
        break;
      }
    }

    if (matches) return preset;
  }

  return null;
}
