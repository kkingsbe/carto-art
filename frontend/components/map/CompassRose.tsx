import type { PosterConfig } from '@/types/poster';

interface CompassRoseProps {
    format: PosterConfig['format'];
    palette: PosterConfig['palette'];
}

export function CompassRose({ format, palette }: CompassRoseProps) {
    const isCircular = (format.maskShape || 'rectangular') === 'circular';
    if (!isCircular || !format.compassRose) return null;

    return (
        <svg
            className="absolute"
            style={{
                pointerEvents: 'none',
                overflow: 'visible',
                top: '-4cqw',
                left: '-4cqw',
                right: '-4cqw',
                bottom: '-4cqw',
                width: 'calc(100% + 8cqw)',
                height: 'calc(100% + 8cqw)',
            }}
            viewBox="0 0 100 100"
        >
            <g
                stroke={palette.accent || palette.text}
                fill={palette.accent || palette.text}
                strokeWidth="0.15"
                opacity="0.8"
            >
                {[
                    { angle: 0, label: 'N' },
                    { angle: 45, label: 'NE' },
                    { angle: 90, label: 'E' },
                    { angle: 135, label: 'SE' },
                    { angle: 180, label: 'S' },
                    { angle: 225, label: 'SW' },
                    { angle: 270, label: 'W' },
                    { angle: 315, label: 'NW' },
                ].map(({ angle, label }) => {
                    const rad = ((angle - 90) * Math.PI) / 180;
                    const centerX = 50;
                    const centerY = 50;
                    const borderOuterRadius = 49.5;
                    const tickLen = label === 'N' || label === 'S' || label === 'E' || label === 'W' ? 1.2 : 0.6;
                    const tickStartRadius = borderOuterRadius;
                    const tickEndRadius = borderOuterRadius + tickLen;
                    const x1 = centerX + Math.cos(rad) * tickStartRadius;
                    const y1 = centerY + Math.sin(rad) * tickStartRadius;
                    const x2 = centerX + Math.cos(rad) * tickEndRadius;
                    const y2 = centerY + Math.sin(rad) * tickEndRadius;
                    const labelRadius = borderOuterRadius + tickLen + 1.0;
                    const labelX = centerX + Math.cos(rad) * labelRadius;
                    const labelY = centerY + Math.sin(rad) * labelRadius;

                    return (
                        <g key={angle}>
                            <line x1={x1} y1={y1} x2={x2} y2={y2} />
                            <text
                                x={labelX}
                                y={labelY}
                                fontSize="1.2"
                                fontWeight="bold"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                opacity={['N', 'S', 'E', 'W'].includes(label) ? 1 : 0.7}
                            >
                                {label}
                            </text>
                        </g>
                    );
                })}
                {/* Intermediate ticks */}
                {Array.from({ length: 24 }, (_, i) => {
                    if (i % 3 === 0) return null;
                    const angle = (i * 15 - 90) * (Math.PI / 180);
                    const r1 = 49.5;
                    const r2 = 49.9;
                    return <line key={i} x1={50 + Math.cos(angle) * r1} y1={50 + Math.sin(angle) * r1} x2={50 + Math.cos(angle) * r2} y2={50 + Math.sin(angle) * r2} opacity="0.6" />;
                })}
            </g>
        </svg>
    );
}
