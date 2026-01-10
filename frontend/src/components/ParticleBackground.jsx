import { useEffect, useRef } from 'react';

const ParticleBackground = ({ intensity = 1 }) => { // Accept intensity prop
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let particlesArray = [];
        let constellParticles = [];

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            init();
        };

        window.addEventListener('resize', handleResize);

        class Particle {
            constructor(x, y, directionX, directionY, size, color) {
                this.x = x;
                this.y = y;
                this.directionX = directionX;
                this.directionY = directionY;
                this.size = size;
                this.originalSize = size;
                this.color = color;
            }

            draw() {
                ctx.beginPath();
                // Draw a 5-pointed star
                for (let i = 0; i < 5; i++) {
                    ctx.lineTo(Math.cos((18 + i * 72) / 180 * Math.PI) * this.size + this.x,
                        -Math.sin((18 + i * 72) / 180 * Math.PI) * this.size + this.y);
                    ctx.lineTo(Math.cos((54 + i * 72) / 180 * Math.PI) * (this.size / 2) + this.x,
                        -Math.sin((54 + i * 72) / 180 * Math.PI) * (this.size / 2) + this.y);
                }
                ctx.closePath();
                ctx.fillStyle = this.color;
                ctx.fill();

                // Intensity affects glow!
                ctx.shadowBlur = 15 * intensity;
                ctx.shadowColor = "white";
            }

            update() {
                // Wrap around screen instead of bouncing
                if (this.x > canvas.width) this.x = 0;
                if (this.x < 0) this.x = canvas.width;
                if (this.y > canvas.height) this.y = 0;
                if (this.y < 0) this.y = canvas.height;

                // Intensity speeds up drift slightly
                this.x += this.directionX * (intensity * 0.8 || 1);
                this.y += this.directionY * (intensity * 0.8 || 1);

                // Twinkle frequency increases with intensity
                if (Math.random() > (0.98 / intensity)) {
                    // Slight size fluctuation for twinkle
                    if (this.size > this.originalSize * 0.8) this.size -= 0.1;
                    else this.size = this.originalSize;
                }

                this.draw();
            }
        }

        // Constellation Data (Normalized coordinates 0-1)
        const constellations = [
            // Big Dipper (Ursa Major)
            {
                name: "Big Dipper",
                stars: [
                    { x: 0.1, y: 0.3 }, { x: 0.18, y: 0.35 }, { x: 0.25, y: 0.32 }, // Handle
                    { x: 0.32, y: 0.35 }, { x: 0.32, y: 0.45 }, { x: 0.42, y: 0.45 }, { x: 0.42, y: 0.35 } // Bowl
                ],
                connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]]
            },
            // Cassiopeia (The W)
            {
                name: "Cassiopeia",
                stars: [
                    { x: 0.6, y: 0.1 }, { x: 0.65, y: 0.2 }, { x: 0.72, y: 0.15 },
                    { x: 0.8, y: 0.2 }, { x: 0.85, y: 0.1 }
                ],
                connections: [[0, 1], [1, 2], [2, 3], [3, 4]]
            },
            // Orion (Simplified)
            {
                name: "Orion",
                stars: [
                    { x: 0.7, y: 0.6 }, { x: 0.8, y: 0.6 }, // Shoulders
                    { x: 0.73, y: 0.7 }, { x: 0.75, y: 0.7 }, { x: 0.77, y: 0.7 }, // Belt
                    { x: 0.7, y: 0.85 }, { x: 0.8, y: 0.85 } // Knees
                ],
                connections: [[0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6], [0, 1], [5, 6]]
            },
            // Southern Cross (Crux) - Bottom Left
            {
                name: "Southern Cross",
                stars: [
                    { x: 0.1, y: 0.75 }, // Top
                    { x: 0.1, y: 0.85 }, // Bottom
                    { x: 0.05, y: 0.8 }, // Left
                    { x: 0.15, y: 0.78 }, // Right
                    { x: 0.12, y: 0.82 }  // Epsilon (small one)
                ],
                connections: [[0, 1], [2, 3]] // Cross shape
            }
        ];

        function init() {
            particlesArray = [];
            constellParticles = [];

            // 1. Create Background Stars (Random, no lines)
            // INCREASED DENSITY significantly for realism
            let numberOfParticles = (canvas.height * canvas.width) / 2500; // Much higher density
            for (let i = 0; i < numberOfParticles; i++) {
                let size = (Math.random() * 1.5) + 0.2; // Allow very small distant stars
                let x = Math.random() * canvas.width;
                let y = Math.random() * canvas.height;
                // Very slow drift
                let directionX = -0.05;
                let directionY = 0.05;

                // Realistic Colors: White, Blue-ish, slightly Yellow-ish
                let color;
                const r = Math.random();
                if (r > 0.9) color = 'rgba(200, 200, 255, '; // Blue tint
                else if (r > 0.8) color = 'rgba(255, 255, 200, '; // Yellow tint
                else color = 'rgba(255, 255, 255, '; // White

                // Random Opacity for depth
                let opacity = Math.random() * 0.8 + 0.2;
                color += opacity + ')';

                particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
            }

            // 2. Create Constellation Stars (Fixed positions)
            constellations.forEach(constell => {
                let cParticles = [];
                constell.stars.forEach(pos => {
                    let size = 2.5;
                    let x = pos.x * canvas.width;
                    let y = pos.y * canvas.height;

                    let p = new Particle(x, y, -0.05, 0.05, size, 'rgba(255, 255, 255, 1)'); // Bright white

                    cParticles.push(p);
                    // Add to main array so they are drawn/updated like others, but we track them for lines
                    particlesArray.push(p);
                });
                constellParticles.push({ ...constell, particles: cParticles });
            });
        }

        function connect() {
            // Only draw lines for defined constellations
            constellParticles.forEach(group => {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
                ctx.lineWidth = 0.8;
                ctx.beginPath();

                group.connections.forEach(([i, j]) => {
                    let p1 = group.particles[i];
                    let p2 = group.particles[j];
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                });
                ctx.stroke();
            });
        }

        function animate() {
            animationFrameId = requestAnimationFrame(animate);
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            ctx.shadowBlur = 0;

            for (let i = 0; i < particlesArray.length; i++) {
                particlesArray[i].update();
            }
            connect();
        }

        init();
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [intensity]); // Re-run if intensity changes

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: -1,
                background: 'linear-gradient(to bottom, #0f0c29, #302b63, #24243e)'
            }}
        />
    );
};

export default ParticleBackground;
