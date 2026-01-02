'use client';

import type { PosterConfig } from '@/types/poster';
import { cn } from '@/lib/utils';
import { ControlSection, ControlSlider, ControlInput, ControlSelect, ControlLabel, ControlCheckbox, ControlGroup } from '@/components/ui/control-components';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { TEXT_PRESETS, getActivePreset } from '@/lib/typography/textPresets';
import { Type, Info } from 'lucide-react';

interface TypographyControlsProps {
  config: PosterConfig;
  onTypographyChange: (typography: Partial<PosterConfig['typography']>) => void;
  onLocationChange: (location: Partial<PosterConfig['location']>) => void;
  onLayersChange: (layers: Partial<PosterConfig['layers']>) => void;
}

// Simple tooltip component
function Tooltip({ children, content }: { children: React.ReactNode; content: string }) {
  return (
    <span className="group relative inline-block">
      {children}
      <span className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute left-0 top-full mt-1 w-48 p-2 bg-gray-900 text-white text-[10px] rounded shadow-lg z-50 pointer-events-none">
        {content}
      </span>
    </span>
  );
}

export function TypographyControls({ config, onTypographyChange, onLocationChange, onLayersChange }: TypographyControlsProps) {
  const { typography, style, layers } = config;

  // Use recommended fonts from the style or a general list
  const availableFonts = [
    ...new Set([
      ...style.recommendedFonts,
      'Inter', 'Montserrat', 'Poppins', 'Playfair Display', 'Crimson Text', 'JetBrains Mono'
    ])
  ];

  const activePreset = getActivePreset(typography);

  const applyPreset = (presetId: string) => {
    const preset = TEXT_PRESETS.find(p => p.id === presetId);
    if (preset) {
      onTypographyChange(preset.settings);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TEXT PRESETS - Always visible */}
      <div className="px-1">
        <div className="flex items-center gap-2 mb-3">
          <Type className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Text Presets
          </h4>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {TEXT_PRESETS.map((preset) => {
            const isActive = activePreset?.id === preset.id;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                title={preset.description}
                className={cn(
                  'group relative flex flex-col gap-2 p-3 text-left border rounded-lg transition-all hover:scale-[1.02]',
                  isActive
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 ring-2 ring-blue-500/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                {/* Font preview */}
                <div className="flex flex-col gap-1 items-center justify-center h-14">
                  <div
                    style={{
                      fontFamily: preset.settings.titleFont,
                      fontSize: '16px',
                      fontWeight: 700
                    }}
                    className="text-gray-800 dark:text-gray-200"
                  >
                    Aa
                  </div>
                  <div
                    style={{
                      fontFamily: preset.settings.subtitleFont,
                      fontSize: '9px',
                      fontWeight: 300
                    }}
                    className="text-gray-500 dark:text-gray-400 text-center leading-tight"
                  >
                    {preset.settings.subtitleFont}
                  </div>
                </div>
                <span className="text-[10px] font-medium text-center text-gray-700 dark:text-gray-300">
                  {preset.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. CONTENT - Always visible */}
      <ControlSection title="Content">
        <ControlGroup>
          <div className="space-y-3">
            <div>
              <ControlLabel>Title</ControlLabel>
              <ControlInput
                type="text"
                value={config.location.name}
                onChange={(e) => onLocationChange({ name: e.target.value })}
                placeholder="WHERE WE MET"
              />
              <div className="text-[10px] text-gray-400 mt-1">
                {config.location.name.length} characters
              </div>
            </div>
            <div>
              <ControlLabel>Subtitle</ControlLabel>
              <ControlInput
                type="text"
                value={config.location.city || ''}
                onChange={(e) => onLocationChange({ city: e.target.value })}
                placeholder="SUBTITLE"
              />
              <div className="text-[10px] text-gray-400 mt-1">
                {(config.location.city || '').length} characters
              </div>
            </div>
          </div>
        </ControlGroup>
      </ControlSection>

      {/* 3-6. COLLAPSIBLE SECTIONS */}
      <Accordion type="multiple" defaultValue={["typography", "backdrop"]} className="space-y-2">
        {/* 3. TYPOGRAPHY */}
        <AccordionItem value="typography" className="border border-gray-200 dark:border-gray-700 rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Typography</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-6 pt-2">
              {/* Title Typography */}
              <div className="space-y-4">
                <div className="text-[11px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wide">
                  Title
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <ControlLabel>Font Family</ControlLabel>
                    {typography.titleFont !== typography.subtitleFont && (
                      <button
                        onClick={() => onTypographyChange({ subtitleFont: typography.titleFont })}
                        className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Apply to subtitle
                      </button>
                    )}
                  </div>
                  <ControlSelect
                    value={typography.titleFont}
                    onChange={(e) => onTypographyChange({ titleFont: e.target.value })}
                  >
                    {availableFonts.map((font) => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </ControlSelect>
                </div>

                <div>
                  <Tooltip content="Container-relative units (cqw). Scales with poster size.">
                    <ControlLabel>
                      Title Size <Info className="inline w-3 h-3 ml-1 text-gray-400" />
                    </ControlLabel>
                  </Tooltip>
                  <ControlSlider
                    min="0.5"
                    max="40"
                    step="0.1"
                    value={typography.titleSize}
                    onChange={(e) => onTypographyChange({ titleSize: parseFloat(e.target.value) })}
                    displayValue={`${typography.titleSize.toFixed(1)}cqw`}
                    onValueChange={(value) => onTypographyChange({ titleSize: value })}
                    formatValue={(v) => v.toFixed(1)}
                    parseValue={(s) => parseFloat(s.replace('cqw', ''))}
                  />
                </div>

                <div>
                  <ControlLabel>Title Weight</ControlLabel>
                  <ControlSlider
                    min="100"
                    max="900"
                    step="100"
                    value={typography.titleWeight}
                    onChange={(e) => onTypographyChange({ titleWeight: parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <Tooltip content="Adjust spacing between characters. Negative values tighten.">
                    <ControlLabel>
                      Letter Spacing <Info className="inline w-3 h-3 ml-1 text-gray-400" />
                    </ControlLabel>
                  </Tooltip>
                  <ControlSlider
                    min="-0.1"
                    max="0.5"
                    step="0.01"
                    value={typography.titleLetterSpacing || 0}
                    onChange={(e) => onTypographyChange({ titleLetterSpacing: parseFloat(e.target.value) })}
                    displayValue={`${(typography.titleLetterSpacing || 0).toFixed(2)}em`}
                  />
                </div>
              </div>

              {/* Subtitle Typography */}
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-[11px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wide">
                  Subtitle
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <ControlLabel>Font Family</ControlLabel>
                    {typography.titleFont !== typography.subtitleFont && (
                      <button
                        onClick={() => onTypographyChange({ titleFont: typography.subtitleFont })}
                        className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Apply to title
                      </button>
                    )}
                  </div>
                  <ControlSelect
                    value={typography.subtitleFont}
                    onChange={(e) => onTypographyChange({ subtitleFont: e.target.value })}
                  >
                    {availableFonts.map((font) => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </ControlSelect>
                </div>

                <div>
                  <ControlLabel>Subtitle Size</ControlLabel>
                  <ControlSlider
                    min="0.2"
                    max="20"
                    step="0.1"
                    value={typography.subtitleSize}
                    onChange={(e) => onTypographyChange({ subtitleSize: parseFloat(e.target.value) })}
                    displayValue={`${typography.subtitleSize.toFixed(1)}cqw`}
                    onValueChange={(value) => onTypographyChange({ subtitleSize: value })}
                    formatValue={(v) => v.toFixed(1)}
                    parseValue={(s) => parseFloat(s.replace('cqw', ''))}
                  />
                </div>

                <div>
                  <ControlLabel>Subtitle Weight</ControlLabel>
                  <ControlSlider
                    min="100"
                    max="900"
                    step="100"
                    value={typography.subtitleWeight || 400}
                    onChange={(e) => onTypographyChange({ subtitleWeight: parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <ControlLabel>Letter Spacing</ControlLabel>
                  <ControlSlider
                    min="-0.1"
                    max="0.5"
                    step="0.01"
                    value={typography.subtitleLetterSpacing || 0}
                    onChange={(e) => onTypographyChange({ subtitleLetterSpacing: parseFloat(e.target.value) })}
                    displayValue={`${(typography.subtitleLetterSpacing || 0).toFixed(2)}em`}
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 4. BACKDROP & READABILITY */}
        <AccordionItem value="backdrop" className="border border-gray-200 dark:border-gray-700 rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Backdrop & Readability</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <div>
                <ControlLabel className="mb-2">Backdrop Style</ControlLabel>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'none', name: 'None', demo: <div className="text-xs font-bold">Text</div> },
                    {
                      id: 'subtle',
                      name: 'Subtle Halo',
                      demo: <div className="text-xs font-bold" style={{ textShadow: '0 0 8px rgba(255,255,255,0.8), 0 0 16px rgba(255,255,255,0.6)' }}>Text</div>
                    },
                    {
                      id: 'strong',
                      name: 'Strong Halo',
                      demo: <div className="text-xs font-bold bg-white/90 dark:bg-gray-900/90 px-2 py-1 rounded">Text</div>
                    },
                    {
                      id: 'gradient',
                      name: 'Gradient',
                      demo: (
                        <div className="relative w-full h-full flex items-center justify-center">
                          <div className="absolute inset-0 bg-gradient-to-b from-white/90 dark:from-gray-900/90 to-transparent rounded" />
                          <div className="relative text-xs font-bold">Text</div>
                        </div>
                      )
                    },
                  ].map((backdropStyle) => (
                    <button
                      key={backdropStyle.id}
                      type="button"
                      onClick={() => onTypographyChange({ textBackdrop: backdropStyle.id as any })}
                      className={cn(
                        'flex flex-col items-center gap-2 p-2.5 border rounded-lg transition-all',
                        (typography.textBackdrop || 'subtle') === backdropStyle.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      )}
                    >
                      <div className="w-full h-12 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded flex items-center justify-center text-gray-900 dark:text-white">
                        {backdropStyle.demo}
                      </div>
                      <span className="text-[10px] font-medium">{backdropStyle.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {typography.textBackdrop !== 'none' && (
                <div className="space-y-4 pt-2">
                  <div>
                    <Tooltip content="Height of the backdrop overlay area as % of poster height.">
                      <ControlLabel>
                        Backdrop Height <Info className="inline w-3 h-3 ml-1 text-gray-400" />
                      </ControlLabel>
                    </Tooltip>
                    <ControlSlider
                      min="10"
                      max="100"
                      step="1"
                      value={typography.backdropHeight ?? 35}
                      onChange={(e) => onTypographyChange({ backdropHeight: parseInt(e.target.value) })}
                      displayValue={`${typography.backdropHeight ?? 35}%`}
                    />
                  </div>

                  {typography.textBackdrop === 'gradient' && (
                    <div>
                      <Tooltip content="0 = Soft fade, 100 = Abrupt transition">
                        <ControlLabel>
                          Gradient Sharpness <Info className="inline w-3 h-3 ml-1 text-gray-400" />
                        </ControlLabel>
                      </Tooltip>
                      <ControlSlider
                        min="0"
                        max="100"
                        step="1"
                        value={typography.backdropSharpness ?? 50}
                        onChange={(e) => onTypographyChange({ backdropSharpness: parseInt(e.target.value) })}
                        displayValue={typography.backdropSharpness === 0 ? 'Soft' : typography.backdropSharpness === 100 ? 'Abrupt' : `${typography.backdropSharpness}%`}
                      />
                    </div>
                  )}

                  <div>
                    <ControlLabel>Backdrop Opacity</ControlLabel>
                    <ControlSlider
                      min="0"
                      max="1"
                      step="0.01"
                      value={typography.backdropAlpha ?? 1.0}
                      onChange={(e) => onTypographyChange({ backdropAlpha: parseFloat(e.target.value) })}
                      displayValue={`${Math.round((typography.backdropAlpha ?? 1.0) * 100)}%`}
                    />
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 5. DISPLAY OPTIONS */}
        <AccordionItem value="display" className="border border-gray-200 dark:border-gray-700 rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Display Options</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pt-2">
              <ControlCheckbox
                label="Show Title"
                checked={typography.showTitle !== false}
                onChange={(e) => onTypographyChange({ showTitle: e.target.checked })}
              />
              <ControlCheckbox
                label="Show Subtitle"
                checked={typography.showSubtitle !== false}
                onChange={(e) => onTypographyChange({ showSubtitle: e.target.checked })}
              />
              <ControlCheckbox
                label="ALL CAPS"
                description="Convert title to uppercase regardless of input"
                checked={Boolean(typography.titleAllCaps)}
                onChange={(e) => onTypographyChange({ titleAllCaps: e.target.checked })}
              />
              <ControlCheckbox
                label="Show Coordinates"
                description="Display latitude/longitude below title"
                checked={typography.showCoordinates !== false}
                onChange={(e) => onTypographyChange({ showCoordinates: e.target.checked })}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 6. MAP LABELS */}
        <AccordionItem value="map-labels" className="border border-gray-200 dark:border-gray-700 rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Map Labels</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              {/* General Labels Toggle */}
              <div className="space-y-2">
                <ControlCheckbox
                  label="Place Labels"
                  checked={Boolean(layers.labels)}
                  onChange={(e) => onLayersChange({ labels: e.target.checked })}
                />

                {layers.labels && (
                  <div className="pl-8 pr-2 pb-2">
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-4">
                      <div className="space-y-2">
                        <ControlLabel className="text-[10px] uppercase text-gray-500">Label Style</ControlLabel>
                        <div className="grid grid-cols-2 gap-2">
                          {['standard', 'elevated', 'glass', 'vintage'].map((labelStyle) => (
                            <button
                              key={labelStyle}
                              onClick={() => onLayersChange({ labelStyle: labelStyle as any })}
                              className={cn(
                                "py-1.5 px-2 text-[10px] uppercase font-bold rounded border transition-all",
                                (layers.labelStyle || 'elevated') === labelStyle
                                  ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300 dark:hover:border-gray-600"
                              )}
                            >
                              {labelStyle}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <ControlLabel className="text-[10px] uppercase text-gray-500">Label Size</ControlLabel>
                        <ControlSlider
                          min="0.5"
                          max="2.5"
                          step="0.1"
                          value={layers.labelSize ?? 1.0}
                          onChange={(e) => onLayersChange({ labelSize: parseFloat(e.target.value) })}
                          displayValue={`${(layers.labelSize ?? 1.0).toFixed(1)}x`}
                          onValueChange={(value) => onLayersChange({ labelSize: value })}
                          formatValue={(v) => v.toFixed(1)}
                          parseValue={(s) => parseFloat(s.replace('x', ''))}
                        />
                      </div>

                      <div className="space-y-1">
                        <ControlLabel className="text-[10px] uppercase text-gray-500">Label Wrap</ControlLabel>
                        <ControlSlider
                          min="2"
                          max="20"
                          step="1"
                          value={layers.labelMaxWidth ?? 10}
                          onChange={(e) => onLayersChange({ labelMaxWidth: parseFloat(e.target.value) })}
                          displayValue={layers.labelMaxWidth ?? 10}
                          onValueChange={(value) => onLayersChange({ labelMaxWidth: value })}
                          formatValue={(v) => String(Math.round(v))}
                          parseValue={(s) => parseInt(s)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* State & Country Names */}
              <div className="space-y-2">
                <ControlCheckbox
                  label="State & Country Names"
                  checked={Boolean(layers['labels-admin'])}
                  onChange={(e) => onLayersChange({ 'labels-admin': e.target.checked })}
                />

                {layers['labels-admin'] && (
                  <div className="pl-8 pr-2 pb-2">
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-3">
                      <div className="space-y-1">
                        <ControlLabel className="text-[10px] uppercase text-gray-500">Label Size</ControlLabel>
                        <ControlSlider
                          min="0.5"
                          max="2.5"
                          step="0.1"
                          value={layers.labelAdminSize ?? 1.0}
                          onChange={(e) => onLayersChange({ labelAdminSize: parseFloat(e.target.value) })}
                          displayValue={`${(layers.labelAdminSize ?? 1.0).toFixed(1)}x`}
                          onValueChange={(value) => onLayersChange({ labelAdminSize: value })}
                          formatValue={(v) => v.toFixed(1)}
                          parseValue={(s) => parseFloat(s.replace('x', ''))}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* City Names */}
              <div className="space-y-2">
                <ControlCheckbox
                  label="City Names"
                  checked={Boolean(layers['labels-cities'])}
                  onChange={(e) => onLayersChange({ 'labels-cities': e.target.checked })}
                />

                {layers['labels-cities'] && (
                  <div className="pl-8 pr-2 pb-2">
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-3">
                      <div className="space-y-1">
                        <ControlLabel className="text-[10px] uppercase text-gray-500">Label Size</ControlLabel>
                        <ControlSlider
                          min="0.5"
                          max="2.5"
                          step="0.1"
                          value={layers.labelCitiesSize ?? 1.0}
                          onChange={(e) => onLayersChange({ labelCitiesSize: parseFloat(e.target.value) })}
                          displayValue={`${(layers.labelCitiesSize ?? 1.0).toFixed(1)}x`}
                          onValueChange={(value) => onLayersChange({ labelCitiesSize: value })}
                          formatValue={(v) => v.toFixed(1)}
                          parseValue={(s) => parseFloat(s.replace('x', ''))}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
