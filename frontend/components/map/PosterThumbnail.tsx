import React, { useMemo } from 'react';
import { PosterConfig } from '@/types/poster';
import { cn } from '@/lib/utils';

interface PosterThumbnailProps {
  config: PosterConfig;
  className?: string;
}

export const PosterThumbnail: React.FC<PosterThumbnailProps> = ({ config, className }) => {
  const { palette, style, location, format } = config;
  
  // Use coordinates to seed "randomness" so the thumbnail is stable for a location
  const seed = useMemo(() => {
    const lat = location.center[1];
    const lng = location.center[0];
    // Simple hash-like function from coordinates
    const combined = (lat + 180) * 1000 + (lng + 180) * 10;
    return Math.floor(Math.abs(Math.sin(combined) * 10000));
  }, [location.center]);

  const round = (num: number) => Math.round(num * 1000) / 1000;

  const renderPattern = () => {
    const mainColor = palette.roads.motorway || palette.text;
    const accentColor = palette.accent || palette.water || palette.roads.primary;
    const bgColor = palette.background;
    const textColor = palette.text;

    // A "blob" or "landmass" based on coordinates
    const points = useMemo(() => {
      const p = [];
      const count = 6;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const dist = 20 + (seed % (10 + i * 5));
        const x = round(50 + Math.cos(angle) * dist);
        const y = round(50 + Math.sin(angle) * dist);
        p.push(`${x},${y}`);
      }
      return p.join(' ');
    }, [seed]);

    switch (style.id) {
      case 'vintage':
        return (
          <g>
            <defs>
              <pattern id={`hatch-${seed}`} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="4" stroke={accentColor} strokeWidth="0.5" opacity="0.3" />
              </pattern>
            </defs>
            <circle cx="50" cy="50" r="35" fill={`url(#hatch-${seed})`} />
            <circle cx="50" cy="50" r="35" fill="none" stroke={mainColor} strokeWidth="0.5" strokeDasharray="2 2" />
            <path d="M 50 10 L 50 90 M 10 50 L 90 50" stroke={mainColor} strokeWidth="0.2" opacity="0.4" />
          </g>
        );
      case 'topographic':
        return (
          <g>
            {[...Array(5)].map((_, i) => (
              <circle 
                key={i} 
                cx={round(50 + (Math.sin(seed + i) * 5))} 
                cy={round(50 + (Math.cos(seed + i) * 5))} 
                r={10 + i * 7} 
                stroke={mainColor} 
                strokeWidth="0.5" 
                fill="none" 
                opacity={0.8 - i * 0.15}
              />
            ))}
          </g>
        );
      case 'blueprint':
        return (
          <g>
            <defs>
              <pattern id={`grid-${seed}`} width="8" height="8" patternUnits="userSpaceOnUse">
                <path d="M 8 0 L 0 0 0 8" fill="none" stroke={accentColor} strokeWidth="0.2" opacity="0.2"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill={`url(#grid-${seed})`} />
            <rect x="25" y="25" width="50" height="50" stroke={textColor} strokeWidth="0.5" fill="none" opacity="0.5" />
            <line x1="20" y1="20" x2="80" y2="80" stroke={textColor} strokeWidth="0.2" opacity="0.3" />
          </g>
        );
      case 'dark-mode':
      case 'midnight':
        return (
          <g>
            <circle cx="50" cy="50" r="30" fill={accentColor} opacity="0.2" filter="blur(8px)" />
            <polygon points={points} fill={mainColor} opacity="0.15" />
            {[...Array(12)].map((_, i) => (
              <circle 
                key={i} 
                cx={round(20 + (Math.sin(seed * i) * 30 + 30))} 
                cy={round(20 + (Math.cos(seed * i) * 30 + 30))} 
                r="0.5" 
                fill={textColor} 
                opacity="0.4" 
              />
            ))}
          </g>
        );
      case 'watercolor':
        return (
          <g>
            <circle cx="50" cy="50" r="30" fill={palette.water} opacity="0.4" />
            <polygon points={points} fill={palette.greenSpace} opacity="0.3" />
            <circle cx="45" cy="45" r="25" fill={palette.landuse} opacity="0.2" />
          </g>
        );
      case 'abstract':
        return (
          <g>
            <rect 
              x="20" y="20" width="60" height="60" 
              fill={mainColor} 
              opacity="0.2" 
              transform={`rotate(${round((seed % 90) - 45)} 50 50)`} 
            />
            <circle cx="50" cy="50" r="25" fill={accentColor} opacity="0.3" />
            <path 
              d={`M 10,50 Q 50,${round(10 + (seed % 80))} 90,50`} 
              fill="none" 
              stroke={textColor} 
              strokeWidth="1" 
              opacity="0.5" 
            />
          </g>
        );
      default: // minimal
        return (
          <g>
            <polygon points={points} fill={mainColor} opacity="0.1" />
            <path 
              d="M 30 30 L 70 70 M 70 30 L 30 70" 
              stroke={mainColor} 
              strokeWidth="0.5" 
              opacity="0.2" 
            />
          </g>
        );
    }
  };

  return (
    <div 
      className={cn("w-full h-full relative flex items-center justify-center overflow-hidden", className)}
      style={{ backgroundColor: palette.background }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {renderPattern()}
        
        {/* Margin and Border Mockup */}
        <rect 
          x="10" y="10" width="80" height="80" 
          fill="none" 
          stroke={palette.border} 
          strokeWidth={format.borderStyle === 'thick' ? "2" : "0.5"} 
          opacity="0.4" 
        />

        {/* Text Representation */}
        <g opacity="0.6">
          <rect x="30" y="78" width="40" height="3" fill={palette.text} rx="1" />
          <rect x="40" y="83" width="20" height="1.5" fill={palette.text} opacity="0.5" rx="0.5" />
        </g>
      </svg>
      
      {/* Optional Texture Overlay */}
      {format.texture && format.texture !== 'none' && (
        <div 
          className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      )}
    </div>
  );
};

