import React from 'react';
import { Heart, Home } from 'lucide-react';

interface MarkerIconProps {
  type?: 'pin' | 'crosshair' | 'dot' | 'ring' | 'heart' | 'home';
  size?: number;
  color?: string;
  borderColor?: string;
  shadow?: boolean;
}

export const MarkerIcon: React.FC<MarkerIconProps & {
  label?: string;
  labelStyle?: 'standard' | 'elevated' | 'glass' | 'vintage';
  labelColor?: string;
  labelSize?: number;
}> = ({
  type = 'pin',
  size = 40,
  color,
  borderColor = 'white',
  shadow = true,
  label,
  labelStyle = 'standard',
  labelColor = 'black',
  labelSize = 14
}) => {
    const IconContent = () => {
      if (type === 'heart') {
        return (
          <Heart
            size={size * 0.8}
            fill={color}
            stroke={borderColor}
            strokeWidth={2}
          />
        );
      }

      if (type === 'home') {
        return (
          <Home
            size={size * 0.8}
            fill={color}
            stroke={borderColor}
            strokeWidth={2}
          />
        );
      }

      if (type === 'crosshair') {
        return (
          <div className="relative flex items-center justify-center" aria-hidden>
            <span
              className="absolute w-[1px] h-full"
              style={{
                backgroundColor: color,
                opacity: 0.6,
              }}
            />
            <span
              className="absolute h-[1px] w-full"
              style={{
                backgroundColor: color,
                opacity: 0.6,
              }}
            />
            <span
              className="absolute rounded-full"
              style={{
                width: size * 1.1,
                height: size * 1.1,
                border: `1px solid ${color}`,
                opacity: 0.35,
              }}
            />
            <span
              className="absolute rounded-full"
              style={{
                width: size * 0.55,
                height: size * 0.55,
                border: `1px solid ${color}`,
                opacity: 0.55,
              }}
            />
            <span
              className="absolute rounded-full"
              style={{
                width: size * 0.25,
                height: size * 0.25,
                backgroundColor: color,
              }}
            />
          </div>
        );
      }

      if (type === 'dot') {
        return (
          <div
            className="rounded-full border-2 border-white"
            style={{
              width: size * 0.5,
              height: size * 0.5,
              backgroundColor: color
            }}
          />
        );
      }

      if (type === 'ring') {
        return (
          <div
            className="rounded-full border-[3px] bg-transparent"
            style={{
              width: size * 0.7,
              height: size * 0.7,
              borderColor: color,
              boxShadow: 'inset 0 0 0 1px white, 0 0 0 1px white'
            }}
          />
        );
      }

      // Default Pin shape path (normalized for viewBox 0 0 24 28)
      const path = "M 12 2.1 C 7.3 2.1 3.5 5.9 3.5 10.6 c 0 5.2 7 13.9 7.9 15.1 c 0.3 0.4 0.9 0.4 1.2 0 C 13.5 24.5 20.5 15.8 20.5 10.6 c 0 -4.7 -3.8 -8.5 -8.5 -8.5 z";

      return (
        <svg
          viewBox="0 0 24 28"
          width="100%"
          height="100%"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ overflow: 'visible' }}
        >
          {/* Stroke Layer (White Border) */}
          <path
            d={path}
            fill={borderColor}
            stroke={borderColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Main Color Layer */}
          <path
            d={path}
            fill={color}
          />
          {/* Central Dot/Hole */}
          <circle cx="12" cy="10.5" r="3.5" fill="white" />
        </svg>
      );
    };

    return (
      <div className="relative flex flex-col items-center justify-center pointer-events-none">
        <div
          style={{
            width: size,
            height: size,
            filter: shadow ? 'drop-shadow(0px 2px 3px rgba(0,0,0,0.3))' : 'none',
          }}
          className="relative flex items-center justify-center"
        >
          <IconContent />
        </div>

        {label && (
          <div
            className="absolute top-full mt-1 px-2 py-0.5 rounded text-center whitespace-nowrap z-20"
            style={{
              fontSize: labelSize,
              color: labelColor,
              fontFamily: 'var(--font-heading)',
              ...(labelStyle === 'standard' && {
                textShadow: '0 1px 2px rgba(0,0,0,0.5), 0 0 4px rgba(255,255,255,0.8)'
              }),
              ...(labelStyle === 'elevated' && {
                backgroundColor: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                color: 'black',
                fontWeight: 500
              }),
              ...(labelStyle === 'glass' && {
                backgroundColor: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255,255,255,0.5)',
                color: 'black'
              }),
              ...(labelStyle === 'vintage' && {
                backgroundColor: '#f4e4bc',
                border: '1px solid #8b7355',
                color: '#4a3b2a',
                fontFamily: 'serif'
              })
            }}
          >
            {label}
          </div>
        )}
      </div>
    );
  };

