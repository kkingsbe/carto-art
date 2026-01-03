import type { ColorPalette } from '@/types/poster';
import { isColorDark, hexToRgba } from '@/lib/utils/color';

interface SimplePaletteInput {
  name: string;
  background: string;
  text: string;
  water: string;
  mainRoad: string;
  accent?: string;
  greenSpace?: string;
  style?: string;
}

function createPalette(input: SimplePaletteInput, styleId: string): ColorPalette {
  const id = `${styleId}-${input.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
  const isDark = isColorDark(input.background);

  // Create a subtle landuse color based on background
  const landuse = input.background;

  // Create a subtle building color
  const buildings = isDark
    ? hexToRgba(input.text, 0.1)
    : hexToRgba(input.mainRoad, 0.05);

  return {
    id,
    name: input.name,
    style: styleId,
    background: input.background,
    text: input.text,
    border: input.text,
    roads: {
      motorway: input.mainRoad,
      trunk: input.mainRoad,
      primary: input.mainRoad,
      secondary: hexToRgba(input.mainRoad, 0.8),
      tertiary: hexToRgba(input.mainRoad, 0.7),
      residential: hexToRgba(input.mainRoad, 0.6),
      service: hexToRgba(input.mainRoad, 0.5),
    },
    water: input.water,
    waterLine: input.water,
    greenSpace: input.greenSpace || (isDark ? '#1A2F1A' : '#E8F0E8'),
    landuse,
    buildings,
    accent: input.accent || input.mainRoad,
  };
}

// Minimal Style Palettes
export const extraMinimalPalettes: ColorPalette[] = [
  // 10. Nordic / Scandinavian
  createPalette({ name: 'Fjord', background: '#E8EEF2', text: '#2C3E50', water: '#8FAABE', mainRoad: '#1A2530', accent: '#5D8AA8' }, 'minimal'),
  createPalette({ name: 'Arctic Dawn', background: '#F0F4F8', text: '#374151', water: '#B4C7D4', mainRoad: '#1F2937', accent: '#6B8E9F' }, 'minimal'),
  createPalette({ name: 'Hygge', background: '#FAF7F2', text: '#5C5046', water: '#C4CDD4', mainRoad: '#3D352E', accent: '#A89080' }, 'minimal'),
  createPalette({ name: 'Birch Forest', background: '#FAFBF9', text: '#4A5240', water: '#A8B8B0', mainRoad: '#2A3020', accent: '#7A8A70' }, 'minimal'),
  createPalette({ name: 'Midnight Sun', background: '#0D1520', text: '#E8DDD0', water: '#06101A', mainRoad: '#F5EBE0', accent: '#FFD4A0' }, 'minimal'),

  // 16. Japanese Aesthetic
  createPalette({ name: 'Wabi-Sabi', background: '#F5F0E8', text: '#4A4540', water: '#A8B0A8', mainRoad: '#2A2520', accent: '#8B7355' }, 'minimal'),
  createPalette({ name: 'Indigo & Rice', background: '#FAF9F5', text: '#1A3050', water: '#C8D4D8', mainRoad: '#0A2040', accent: '#26478D' }, 'minimal'),
  createPalette({ name: 'Cherry Blossom', background: '#FFF8F5', text: '#5A4048', water: '#C8D0D4', mainRoad: '#3A2028', accent: '#FFB7C5' }, 'minimal'),
  createPalette({ name: 'Zen Garden', background: '#E8E4DC', text: '#3A3830', water: '#98A098', mainRoad: '#1A1810', accent: '#6A6860' }, 'minimal'),
  createPalette({ name: 'Ukiyo-e', background: '#F0E8D8', text: '#1A2838', water: '#6890A8', mainRoad: '#0A1828', accent: '#D4403A' }, 'minimal'),

  // 17. Monochrome Extremes
  createPalette({ name: 'Pure White', background: '#FFFFFF', text: '#1A1A1A', water: '#F0F0F0', mainRoad: '#000000', accent: '#404040' }, 'minimal'),
  createPalette({ name: 'Void', background: '#000000', text: '#FFFFFF', water: '#0A0A0A', mainRoad: '#F0F0F0', accent: '#808080' }, 'minimal'),
  createPalette({ name: 'Blue Mono', background: '#E8F0F8', text: '#1A3050', water: '#C8D8E8', mainRoad: '#0A2040', accent: '#3060A0' }, 'minimal'),
  createPalette({ name: 'Sepia Mono', background: '#F0E4D0', text: '#4A3420', water: '#D8C8B0', mainRoad: '#2A1A10', accent: '#7A5A40' }, 'minimal'),
];

// Atmospheric Style Palettes (New Style)
export const atmosphericPalettes: ColorPalette[] = [
  // 9. Golden Hour / Sunset
  createPalette({ name: 'Desert Dusk', background: '#2A1B2D', text: '#E8C4A0', water: '#1A1020', mainRoad: '#F4D4B0', accent: '#D4845C' }, 'atmospheric'),
  createPalette({ name: 'California Gold', background: '#FBF4E9', text: '#8B4513', water: '#D4A574', mainRoad: '#5C3317', accent: '#E8963C' }, 'atmospheric'),
  createPalette({ name: 'Peach Horizon', background: '#FFF5EB', text: '#6B4D4D', water: '#E8BFA0', mainRoad: '#4A3535', accent: '#FF9666' }, 'atmospheric'),
  createPalette({ name: 'Amber Glow', background: '#1F1408', text: '#F5D4A0', water: '#140C04', mainRoad: '#FFE4B5', accent: '#FFA040' }, 'atmospheric'),

  // 15. Atmospheric / Fog
  createPalette({ name: 'Morning Mist', background: '#E8EAEC', text: '#5A6068', water: '#C0C8D0', mainRoad: '#3A4048', accent: '#7888A0' }, 'atmospheric'),
  createPalette({ name: 'London Fog', background: '#D8DCD8', text: '#404540', water: '#A8B0B0', mainRoad: '#282C28', accent: '#607068' }, 'atmospheric'),
  createPalette({ name: 'Overcast', background: '#E0E4E8', text: '#4A5058', water: '#B0B8C0', mainRoad: '#2A3038', accent: '#6A7888' }, 'atmospheric'),
  createPalette({ name: 'Smoke', background: '#F0EDEA', text: '#58524A', water: '#C4C0B8', mainRoad: '#38342C', accent: '#8A8478' }, 'atmospheric'),
  createPalette({ name: 'Ethereal', background: '#F5F0F8', text: '#605070', water: '#C8C0D8', mainRoad: '#403050', accent: '#9080A8' }, 'atmospheric'),
];

// Organic Style Palettes (New Style)
export const organicPalettes: ColorPalette[] = [
  // 11. Ocean Depths
  createPalette({ name: 'Abyss', background: '#030810', text: '#4AC8E8', water: '#010408', mainRoad: '#60D8F8', accent: '#20A0C0' }, 'organic'),
  createPalette({ name: 'Coral Reef', background: '#E8F4F8', text: '#1E5F74', water: '#40B0C8', mainRoad: '#0D3D4D', accent: '#FF7F6B' }, 'organic'),
  createPalette({ name: 'Pacific', background: '#F0F8FA', text: '#0F4C5C', water: '#2E8B98', mainRoad: '#083040', accent: '#00A5B5' }, 'organic'),
  createPalette({ name: 'Tidal', background: '#EBF4F0', text: '#2D4A5E', water: '#6BA3B4', mainRoad: '#1A3040', accent: '#3D8494' }, 'organic'),
  createPalette({ name: 'Deep Current', background: '#0A1628', text: '#7DC4D4', water: '#050D1A', mainRoad: '#A0E8F8', accent: '#40A4B8' }, 'organic'),

  // 12. Botanical / Forest
  createPalette({ name: 'Moss & Stone', background: '#F4F2ED', text: '#3A4035', water: '#8AA4A0', mainRoad: '#252A22', greenSpace: '#6B8060' }, 'organic'),
  createPalette({ name: 'Fern Gully', background: '#F0F5F0', text: '#2A4030', water: '#7090A0', mainRoad: '#1A2820', greenSpace: '#4A7050' }, 'organic'),
  createPalette({ name: 'Old Growth', background: '#1A2018', text: '#C8D4C0', water: '#0C140C', mainRoad: '#D8E4D0', greenSpace: '#3A5030' }, 'organic'),
  createPalette({ name: 'Lichen', background: '#E8EDE8', text: '#4A5550', water: '#90B0A8', mainRoad: '#2A3530', greenSpace: '#7A9488' }, 'organic'),
  createPalette({ name: 'Rainforest', background: '#0F1A14', text: '#8BD4A0', water: '#081008', mainRoad: '#A0E8B8', greenSpace: '#2A6040' }, 'organic'),

  // 13. Terracotta / Desert
  createPalette({ name: 'Adobe', background: '#F5EBE0', text: '#6B4430', water: '#98B0A8', mainRoad: '#4A2A18', accent: '#C87040' }, 'organic'),
  createPalette({ name: 'Canyon', background: '#FAF0E6', text: '#8B4513', water: '#7CA0A8', mainRoad: '#5C2E0D', accent: '#D2691E' }, 'organic'),
  createPalette({ name: 'Sahara Night', background: '#1A140F', text: '#E8C8A0', water: '#100A06', mainRoad: '#F4D8B4', accent: '#D4946C' }, 'organic'),
  createPalette({ name: 'Red Earth', background: '#F2E6DC', text: '#7B3F00', water: '#90A898', mainRoad: '#5A2D00', accent: '#B85C38' }, 'organic'),
  createPalette({ name: 'Pueblo', background: '#FAEBD7', text: '#704214', water: '#88A8A0', mainRoad: '#4A2C0E', accent: '#CD853F' }, 'organic'),
];

// Abstract / Artistic Palettes
export const extraAbstractPalettes: ColorPalette[] = [
  // 14. Jewel Tones / Luxury
  createPalette({ name: 'Emerald City', background: '#0A1810', text: '#50C878', water: '#040C08', mainRoad: '#70E898', accent: '#2E8B57' }, 'abstract'),
  createPalette({ name: 'Amethyst', background: '#1A0F24', text: '#D8B4E8', water: '#0F081A', mainRoad: '#E8C8F8', accent: '#9966CC' }, 'abstract'),
  createPalette({ name: 'Sapphire', background: '#0A1428', text: '#5090D0', water: '#040810', mainRoad: '#70B0F0', accent: '#2050A0' }, 'abstract'),
  createPalette({ name: 'Ruby', background: '#200810', text: '#E85070', water: '#100408', mainRoad: '#F87090', accent: '#C01030' }, 'abstract'),
  createPalette({ name: 'Obsidian & Gold', background: '#0C0C0C', text: '#D4AF37', water: '#040404', mainRoad: '#F4CF57', accent: '#B8960C' }, 'abstract'),
];

// Retro Style Palettes (New Style)
export const retroPalettes: ColorPalette[] = [
  // 18. Retro / Nostalgic
  createPalette({ name: '70s Earth', background: '#F5E6D3', text: '#6B4423', water: '#A8967C', mainRoad: '#4A2E15', accent: '#D2691E' }, 'retro'),
  createPalette({ name: '80s Synthwave', background: '#1A0A30', text: '#FF6EC7', water: '#0D0520', mainRoad: '#00FFFF', accent: '#FF00FF' }, 'retro'),
  createPalette({ name: '90s Teal', background: '#E0F0F0', text: '#006666', water: '#80C0C0', mainRoad: '#004040', accent: '#008080' }, 'retro'),
  createPalette({ name: 'Faded Polaroid', background: '#F8F4E8', text: '#5A6058', water: '#A8B4A8', mainRoad: '#3A4038', accent: '#88746C' }, 'retro'),
  createPalette({ name: 'Art Deco', background: '#1A1A2E', text: '#D4AF37', water: '#0F0F1E', mainRoad: '#E8C857', accent: '#C0C0C0' }, 'retro'),
];
