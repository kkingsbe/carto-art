'use client';

import type { PosterConfig } from '@/types/poster';
import { formatCoordinates, hexToRgba } from '@/lib/utils';
import { getScrimAlpha, calculateScrimHeight, getBackdropGradientStyles, stopsToCssGradient } from '@/lib/styles/backdrop';

interface TextOverlayProps {
  config: PosterConfig;
}

function buildHaloTextShadow(color: string, radiusPx: number, dropShadow?: string): string {
  const r = Math.max(1, Math.round(radiusPx));
  const offsets: Array<[number, number]> = [
    [-r, 0],
    [r, 0],
    [0, -r],
    [0, r],
    [-r, -r],
    [r, -r],
    [-r, r],
    [r, r],
  ];

  const halo = offsets.map(([x, y]) => `${x}px ${y}px 0 ${color}`).join(',\n');
  return dropShadow ? `${halo},\n${dropShadow}` : halo;
}

export function TextOverlay({ config }: TextOverlayProps) {
  const { typography, location } = config;

  const titleText = location.name || 'WHERE WE MET';
  const subtitleText = location.city || '';
  const coordsText = formatCoordinates(location.center);

  const positionClasses: Record<PosterConfig['typography']['position'], string> = {
    top: 'items-start',
    center: 'items-center',
    bottom: 'items-end',
  };

  const margin = config.format.margin;
  const paddingStyle = {
    paddingTop: typography.position === 'top' ? `${margin + 3}cqw` : '2rem',
    paddingBottom: typography.position === 'bottom' ? `${margin + 5}cqw` : '2rem',
    paddingLeft: `${margin + 4}cqw`,
    paddingRight: `${margin + 4}cqw`,
  };

  const backdropType = typography.textBackdrop || 'gradient';
  const scrimAlpha = getScrimAlpha(typography);
  const scrimHeightPx = calculateScrimHeight(config);
  const gradientDef = getBackdropGradientStyles(config, scrimAlpha);
  
  const bg = config.palette.background;
  const scrimGradient = gradientDef ? stopsToCssGradient(bg, gradientDef) : undefined;

  const titleHalo = Math.max(2, Math.min(8, Math.round(typography.titleSize * 0.12)));
  const titleStyle = {
    fontFamily: typography.titleFont,
    fontSize: `${typography.titleSize}cqw`,
    fontWeight: typography.titleWeight,
    color: config.palette.text,
    letterSpacing: typography.titleLetterSpacing ? `${typography.titleLetterSpacing}em` : 'normal',
    textTransform: (typography.titleAllCaps !== false ? 'uppercase' : 'none') as any,
    lineHeight: 1.1,
    textShadow: (backdropType === 'gradient' || backdropType === 'none') ? 'none' : buildHaloTextShadow(
      config.palette.background,
      titleHalo,
      `0px ${Math.max(2, Math.round(titleHalo * 1.2))}px ${Math.max(6, Math.round(titleHalo * 4))}px rgba(0,0,0,0.14)`
    ),
  };

  const subtitleHalo = Math.max(1, Math.min(6, Math.round(typography.subtitleSize * 0.12)));
  const subtitleStyle = {
    fontFamily: typography.subtitleFont,
    fontSize: `${typography.subtitleSize}cqw`,
    fontWeight: typography.subtitleWeight || 400,
    color: config.palette.text,
    opacity: 0.9,
    letterSpacing: typography.subtitleLetterSpacing ? `${typography.subtitleLetterSpacing}em` : '0.2em',
    lineHeight: 1,
    textShadow: (backdropType === 'gradient' || backdropType === 'none') ? 'none' : buildHaloTextShadow(config.palette.background, subtitleHalo),
  };

  const coordsStyle = {
    fontFamily: typography.subtitleFont,
    fontSize: `${typography.subtitleSize * 0.65}cqw`,
    color: config.palette.text,
    opacity: 0.6,
    marginTop: '0.5cqw',
    letterSpacing: '0.1em',
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Background scrim / gradient - rendered outside padded container */}
      {typography.position !== 'center' && scrimGradient && (
        <div
          className="absolute left-0 right-0"
          style={{
            height: typeof scrimHeightPx === 'string' ? scrimHeightPx : `${scrimHeightPx}px`,
            ...(typography.position === 'top' ? { top: 0 } : { bottom: 0 }),
            background: scrimGradient,
          }}
        />
      )}

      {/* Text Container - has the padding for layout */}
      <div
        className={`absolute inset-0 flex justify-center ${positionClasses[typography.position]}`}
        style={paddingStyle}
      >
        <div
          className="relative text-center flex flex-col items-center"
          style={
            typography.position === 'center' && backdropType !== 'none' && backdropType !== 'gradient'
              ? {
                  backgroundColor: hexToRgba(bg, backdropType === 'strong' ? 0.95 : 0.78),
                  padding: '1.25rem 2rem',
                  borderRadius: '1.5rem',
                  boxShadow: backdropType === 'strong' ? '0 10px 25px -5px rgba(0,0,0,0.1)' : 'none',
                }
              : undefined
          }
        >
          {typography.showTitle !== false && (
            <h1
              className="leading-tight"
              style={titleStyle}
            >
              {titleText}
            </h1>
          )}
          
          {typography.showSubtitle !== false && subtitleText && (
            <div className="flex items-center gap-4 w-full justify-center" style={{ marginTop: '0.75rem' }}>
              <div className="h-[1.5px] w-12 opacity-40" style={{ backgroundColor: config.palette.text }} />
              <p
                className="uppercase"
                style={subtitleStyle}
              >
                {subtitleText}
              </p>
              <div className="h-[1.5px] w-12 opacity-40" style={{ backgroundColor: config.palette.text }} />
            </div>
          )}

          {(typography.showCoordinates !== false) && (
            <p style={coordsStyle}>
              {coordsText}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

