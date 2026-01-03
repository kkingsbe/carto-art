'use client';

import { useEffect, useRef } from 'react';

export function Background3D() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        let animationFrameId: number;
        let particles: { x: number; y: number; size: number; speedX: number; speedY: number }[] = [];

        const initParticles = () => {
            particles = [];
            const particleCount = 50;
            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    size: Math.random() * 2 + 1,
                    speedX: (Math.random() - 0.5) * 0.5,
                    speedY: (Math.random() - 0.5) * 0.5,
                });
            }
        };

        const draw = () => {
            ctx.clearRect(0, 0, width, height);

            // Draw subtle topographic-like lines using sine waves
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(245, 240, 232, 0.05)';
            ctx.lineWidth = 1;

            const time = Date.now() * 0.001;

            for (let y = 0; y < height; y += 40) {
                ctx.moveTo(0, y);
                for (let x = 0; x < width; x += 10) {
                    const dy = Math.sin(x * 0.01 + time + y * 0.01) * 20;
                    ctx.lineTo(x, y + dy);
                }
            }
            ctx.stroke();

            // Draw particles
            ctx.fillStyle = 'rgba(201, 169, 98, 0.3)';
            particles.forEach((p) => {
                p.x += p.speedX;
                p.y += p.speedY;

                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;
                if (p.y < 0) p.y = height;
                if (p.y > height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            initParticles();
        };

        window.addEventListener('resize', handleResize);
        initParticles();
        draw();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none opacity-60"
        />
    );
}
