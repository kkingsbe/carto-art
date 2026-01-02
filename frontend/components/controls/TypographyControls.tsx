'use client';

import type { PosterConfig } from '@/types/poster';
import { cn } from '@/lib/utils';
import { ControlSection, ControlSlider, ControlInput, ControlSelect, ControlLabel, ControlCheckbox, ControlGroup } from '@/components/ui/control-components';

interface TypographyControlsProps {
  config: PosterConfig;
  onTypographyChange: (typography: Partial<PosterConfig['typography']>) => void;
  onLocationChange: (location: Partial<PosterConfig['location']>) => void;
  onLayersChange: (layers: Partial<PosterConfig['layers']>) => void;
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

  return (
    <div className="space-y-6">
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
            </div>
            <div>
              <ControlLabel>Subtitle</ControlLabel>
              <ControlInput
                type="text"
                value={config.location.city || ''}
                onChange={(e) => onLocationChange({ city: e.target.value })}
                placeholder="SUBTITLE"
              />
            </div>
          </div>
        </ControlGroup>
      </ControlSection>

      <ControlSection title="Appearance">
        <div className="space-y-4">
          <div>
            <ControlLabel>Font Family</ControlLabel>
            <ControlSelect
              value={typography.titleFont}
              onChange={(e) => onTypographyChange({ 
                titleFont: e.target.value,
                subtitleFont: e.target.value
              })}
            >
              {availableFonts.map((font) => (
                <option key={font} value={font}>{font}</option>
              ))}
            </ControlSelect>
          </div>

          <div className="space-y-4">
            <div>
              <ControlLabel>Title Size</ControlLabel>
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
              <ControlLabel>Letter Spacing</ControlLabel>
              <ControlSlider
                min="-0.1"
                max="0.5"
                step="0.01"
                value={typography.titleLetterSpacing || 0}
                onChange={(e) => onTypographyChange({ titleLetterSpacing: parseFloat(e.target.value) })}
              />
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
          </div>
        </div>
      </ControlSection>

      <ControlSection title="Readability">
        <div className="space-y-4">
          <div>
            <ControlLabel>Backdrop Style</ControlLabel>
            <ControlSelect
              value={typography.textBackdrop || 'subtle'}
              onChange={(e) => onTypographyChange({ textBackdrop: e.target.value as any })}
            >
              <option value="none">None</option>
              <option value="subtle">Subtle</option>
              <option value="strong">Strong</option>
              <option value="gradient">Full Gradient</option>
            </ControlSelect>
          </div>

          {typography.textBackdrop !== 'none' && (
            <div className="space-y-4 pt-2">
              <div>
                <ControlLabel>Backdrop Height</ControlLabel>
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
                  <ControlLabel>Gradient Sharpness</ControlLabel>
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
      </ControlSection>

      <ControlSection title="Options">
        <div className="space-y-2">
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
            checked={Boolean(typography.titleAllCaps)}
            onChange={(e) => onTypographyChange({ titleAllCaps: e.target.checked })}
          />
          <ControlCheckbox
            label="Show Coordinates"
            checked={typography.showCoordinates !== false}
            onChange={(e) => onTypographyChange({ showCoordinates: e.target.checked })}
          />
        </div>
      </ControlSection>

      <ControlSection title="Map Labels">
        <div className="space-y-4">
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
      </ControlSection>
    </div>
  );
}

