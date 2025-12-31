import React from 'react';
import { Heart, Home } from 'lucide-react';

interface MarkerIconProps {
  type?: 'pin' | 'crosshair' | 'dot' | 'ring' | 'heart' | 'home';
  size?: number;
  color?: string;
  borderColor?: string;
  shadow?: boolean;
}

export const MarkerIcon: React.FC<MarkerIconProps> = ({
  type = 'pin',
  size = 40,
  color = '#ef4444',
  borderColor = 'white',
  shadow = true,
}) => {
  if (type === 'heart') {
    return (
      <div 
        style={{ 
          width: size, 
          height: size, 
          filter: shadow ? 'drop-shadow(0px 2px 3px rgba(0,0,0,0.3))' : 'none',
        }}
        className="relative pointer-events-none flex items-center justify-center"
      >
        <Heart 
          size={size * 0.8} 
          fill={color} 
          stroke={borderColor} 
          strokeWidth={2}
        />
      </div>
    );
  }

  if (type === 'home') {
    return (
      <div 
        style={{ 
          width: size, 
          height: size, 
          filter: shadow ? 'drop-shadow(0px 2px 3px rgba(0,0,0,0.3))' : 'none',
        }}
        className="relative pointer-events-none flex items-center justify-center"
      >
        <Home 
          size={size * 0.8} 
          fill={color} 
          stroke={borderColor} 
          strokeWidth={2}
        />
      </div>
    );
  }

  if (type === 'crosshair') {
    return (
      <div 
        style={{ 
          width: size, 
          height: size, 
        }}
        className="relative pointer-events-none flex items-center justify-center"
      >
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
      </div>
    );
  }

  if (type === 'dot') {
    return (
      <div 
        style={{ 
          width: size, 
          height: size, 
          filter: shadow ? 'drop-shadow(0px 1px 2px rgba(0,0,0,0.3))' : 'none',
        }}
        className="relative pointer-events-none flex items-center justify-center"
      >
        <div 
          className="rounded-full border-2 border-white"
          style={{ 
            width: size * 0.5, 
            height: size * 0.5, 
            backgroundColor: color 
          }}
        />
      </div>
    );
  }

  if (type === 'ring') {
    return (
      <div 
        style={{ 
          width: size, 
          height: size, 
          filter: shadow ? 'drop-shadow(0px 1px 2px rgba(0,0,0,0.3))' : 'none',
        }}
        className="relative pointer-events-none flex items-center justify-center"
      >
        <div 
          className="rounded-full border-[3px] bg-transparent"
          style={{ 
            width: size * 0.7, 
            height: size * 0.7, 
            borderColor: color,
            boxShadow: 'inset 0 0 0 1px white, 0 0 0 1px white'
          }}
        />
      </div>
    );
  }

  // Default Pin shape path (normalized for viewBox 0 0 24 28)
  const path = "M 12 2.1 C 7.3 2.1 3.5 5.9 3.5 10.6 c 0 5.2 7 13.9 7.9 15.1 c 0.3 0.4 0.9 0.4 1.2 0 C 13.5 24.5 20.5 15.8 20.5 10.6 c 0 -4.7 -3.8 -8.5 -8.5 -8.5 z";
  
  return (
    <div 
      style={{ 
        width: size, 
        height: size, 
        filter: shadow ? 'drop-shadow(0px 2px 3px rgba(0,0,0,0.3))' : 'none',
      }}
      className="relative pointer-events-none"
    >
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
    </div>
  );
};

