export function drawMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  type: 'pin' | 'crosshair' | 'dot' | 'ring' | 'heart' | 'home' = 'crosshair'
) {
  switch (type) {
    case 'pin':
      drawPinMarker(ctx, x, y, size, color);
      break;
    case 'dot':
      drawDotMarker(ctx, x, y, size, color);
      break;
    case 'ring':
      drawRingMarker(ctx, x, y, size, color);
      break;
    case 'heart':
      drawHeartMarker(ctx, x, y, size, color);
      break;
    case 'home':
      drawHomeMarker(ctx, x, y, size, color);
      break;
    case 'crosshair':
    default:
      drawCrosshairMarker(ctx, x, y, size, color);
      break;
  }
}

function drawHeartMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
) {
  ctx.save();
  
  const scale = (size * 0.8) / 24;
  ctx.translate(x - 12 * scale, y - 12 * scale);
  ctx.scale(scale, scale);

  // Heart path
  const path = new Path2D("M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z");

  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;

  ctx.fillStyle = color;
  ctx.fill(path);

  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.stroke(path);

  ctx.restore();
}

function drawHomeMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
) {
  ctx.save();
  
  const scale = (size * 0.8) / 24;
  ctx.translate(x - 12 * scale, y - 12 * scale);
  ctx.scale(scale, scale);

  // Home paths
  const house = new Path2D("M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z");
  const door = new Path2D("M9 22V12h6v10");

  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;

  // Fill house first
  ctx.fillStyle = color;
  ctx.fill(house);

  // Stroke both for the outline and door
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke(house);
  ctx.stroke(door);

  ctx.restore();
}

function drawCrosshairMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'butt';

  const fullLineWidth = Math.max(1, Math.round(size * 0.015));
  ctx.lineWidth = fullLineWidth;
  ctx.globalAlpha = 0.55;

  ctx.beginPath();
  ctx.moveTo(x, y - size / 2);
  ctx.lineTo(x, y + size / 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x - size / 2, y);
  ctx.lineTo(x + size / 2, y);
  ctx.stroke();

  const baseRadius = size * 0.45;
  const innerRadius = baseRadius * 0.5;
  const dotRadius = Math.max(2, baseRadius * 0.25);

  ctx.lineWidth = Math.max(1, Math.round(size * 0.02));
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.arc(x, y, baseRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.arc(x, y, innerRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawPinMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
) {
  ctx.save();
  
  // Apply a drop shadow
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = Math.round(size * 0.1);
  ctx.shadowOffsetY = Math.round(size * 0.05);

  // Scaling factor from the SVG viewBox 24x28
  const scale = size / 24;
  
  // Translate to center point (bottom of pin tip)
  // The pin in SVG is centered at 12 horizontally, and its tip is around 25.7
  ctx.translate(x - 12 * scale, y - 25.7 * scale);
  ctx.scale(scale, scale);

  const path = new Path2D("M 12 2.1 C 7.3 2.1 3.5 5.9 3.5 10.6 c 0 5.2 7 13.9 7.9 15.1 c 0.3 0.4 0.9 0.4 1.2 0 C 13.5 24.5 20.5 15.8 20.5 10.6 c 0 -4.7 -3.8 -8.5 -8.5 -8.5 z");

  // Outer border
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.stroke(path);

  // Fill
  ctx.fillStyle = color;
  ctx.fill(path);

  // Inner dot
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(12, 10.5, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawDotMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
) {
  ctx.save();
  ctx.fillStyle = color;
  
  // Simple solid dot
  ctx.beginPath();
  ctx.arc(x, y, size * 0.25, 0, Math.PI * 2);
  ctx.fill();
  
  // Optional ring around it
  ctx.strokeStyle = 'white';
  ctx.lineWidth = Math.max(1, size * 0.05);
  ctx.stroke();
  
  ctx.restore();
}

function drawRingMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, size * 0.1);
  
  ctx.beginPath();
  ctx.arc(x, y, size * 0.35, 0, Math.PI * 2);
  ctx.stroke();
  
  // Inner white border for contrast
  ctx.strokeStyle = 'white';
  ctx.lineWidth = Math.max(1, size * 0.02);
  ctx.beginPath();
  ctx.arc(x, y, size * 0.35 - (size * 0.06), 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.restore();
}

export function drawTextWithHalo(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSizePx: number,
  options: {
    weight?: number | string;
    opacity?: number;
    letterSpacing?: number;
    fontFamily: string;
    haloColor: string;
    textColor: string;
    showHalo?: boolean;
    haloBlur?: number;
    haloOffsetY?: number;
  }
) {
  const {
    weight = 400,
    opacity = 1,
    letterSpacing = 0,
    fontFamily,
    haloColor,
    textColor,
    showHalo = true,
    haloBlur,
    haloOffsetY,
  } = options;

  ctx.save();
  ctx.font = `${weight} ${fontSizePx}px "${fontFamily}"`;
  ctx.globalAlpha = opacity;
  
  const outlinePx = Math.max(2, Math.min(8, Math.round(fontSizePx * 0.12)));
  
  if (showHalo) {
    ctx.strokeStyle = haloColor;
    ctx.lineWidth = outlinePx;
    ctx.lineJoin = 'round';
    
    ctx.shadowColor = 'rgba(0,0,0,0.14)';
    ctx.shadowBlur = haloBlur ?? Math.max(6, Math.round(outlinePx * 4));
    ctx.shadowOffsetY = haloOffsetY ?? Math.max(2, Math.round(outlinePx * 1.2));
    
    if (letterSpacing) {
      const tracking = letterSpacing * fontSizePx;
      const metrics = ctx.measureText(text);
      let currentX = x - (metrics.width + (text.length - 1) * tracking) / 2;
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const charWidth = ctx.measureText(char).width;
        ctx.strokeText(char, currentX + charWidth / 2, y);
        currentX += charWidth + tracking;
      }
    } else {
      ctx.strokeText(text, x, y);
    }
  }

  ctx.shadowColor = 'transparent';
  ctx.fillStyle = textColor;
  if (letterSpacing) {
    const tracking = letterSpacing * fontSizePx;
    const metrics = ctx.measureText(text);
    let currentX = x - (metrics.width + (text.length - 1) * tracking) / 2;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const charWidth = ctx.measureText(char).width;
      ctx.fillText(char, currentX + charWidth / 2, y);
      currentX += charWidth + tracking;
    }
  } else {
    ctx.fillText(text, x, y);
  }
  ctx.restore();
}

export function applyTexture(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  type: 'paper' | 'canvas' | 'grain',
  intensity: number
) {
  const noiseCanvas = document.createElement('canvas');
  const tileSize = type === 'grain' ? 128 : 256;
  noiseCanvas.width = tileSize;
  noiseCanvas.height = tileSize;
  const noiseCtx = noiseCanvas.getContext('2d');
  
  if (!noiseCtx) return;

  const idata = noiseCtx.createImageData(tileSize, tileSize);
  const buffer32 = new Uint32Array(idata.data.buffer);

  for (let i = 0; i < buffer32.length; i++) {
    const noise = Math.random() * 255;
    const alpha = (intensity / 100) * 255 * (type === 'canvas' ? 0.25 : 0.15);
    buffer32[i] = (Math.round(alpha) << 24) | (noise << 16) | (noise << 8) | noise;
  }

  noiseCtx.putImageData(idata, 0, 0);
  const pattern = ctx.createPattern(noiseCanvas, 'repeat');
  if (pattern) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}

export function drawCompassRose(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  borderOuterRadius: number,
  color: string,
  lineWidth: number,
  fontSize: number
) {
  ctx.save();
  
  // Position well outside the border edge with spacing
  const spacing = fontSize * 0.6; // Spacing between border and compass
  const compassRadius = borderOuterRadius + spacing;
  const tickLength = fontSize * 0.4; // Length of tick marks
  const longTickLength = fontSize * 0.8; // Longer ticks for cardinal directions
  
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.globalAlpha = 0.8;
  
  // Draw 32 points (8 cardinal/intercardinal + 24 intermediate)
  const directions = [
    { angle: 0, label: 'N', isCardinal: true },
    { angle: 45, label: 'NE', isCardinal: false },
    { angle: 90, label: 'E', isCardinal: true },
    { angle: 135, label: 'SE', isCardinal: false },
    { angle: 180, label: 'S', isCardinal: true },
    { angle: 225, label: 'SW', isCardinal: false },
    { angle: 270, label: 'W', isCardinal: true },
    { angle: 315, label: 'NW', isCardinal: false },
  ];
  
  // Draw intermediate ticks (every 11.25 degrees for 32 points)
  for (let i = 0; i < 32; i++) {
    const angle = (i * 11.25 - 90) * (Math.PI / 180); // -90 to align N at top
    const isCardinalOrIntercardinal = (i % 4 === 0);
    const tickLen = isCardinalOrIntercardinal ? longTickLength : tickLength;
    
    const x1 = centerX + Math.cos(angle) * compassRadius;
    const y1 = centerY + Math.sin(angle) * compassRadius;
    const x2 = centerX + Math.cos(angle) * (compassRadius - tickLen);
    const y2 = centerY + Math.sin(angle) * (compassRadius - tickLen);
    
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  
  // Draw labels for cardinal and intercardinal directions
  const labelRadius = compassRadius + fontSize * 0.8;
  directions.forEach(({ angle, label, isCardinal }) => {
    const rad = (angle - 90) * (Math.PI / 180); // -90 to align N at top
    const labelX = centerX + Math.cos(rad) * labelRadius;
    const labelY = centerY + Math.sin(rad) * labelRadius;
    
    ctx.globalAlpha = isCardinal ? 1.0 : 0.7;
    
    // Draw text with slight halo for visibility
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, fontSize * 0.15);
    ctx.strokeText(label, labelX, labelY);
    
    ctx.fillStyle = color;
    ctx.fillText(label, labelX, labelY);
  });
  
  ctx.restore();
}
