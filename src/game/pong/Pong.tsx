import { useRef, useEffect } from "react";
import "./Pong.css";
import { supabase } from "../../lib/supabase";

interface PongProps {
    webcamRef: React.RefObject<any>;
    onGameOver: (score: number) => void;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_WIDTH = 120;
const PADDLE_HEIGHT = 20;
const BALL_SIZE = 20;

export default function Pong({ webcamRef, onGameOver } : PongProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const paddleX = useRef(CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2);
    const ball = useRef({x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, vx: 4, vy: -4});
    const score = useRef(0);
    // Tiles setup
    const TILE_ROWS = 3;
    const TILE_COLS = 8;
    const TILE_WIDTH = 80;
    const TILE_HEIGHT = 30;
    const tiles = useRef(
        Array.from({ length: TILE_ROWS }, (_, row) =>
            Array.from({ length: TILE_COLS }, (_, col) => true)
        )
    );

    // Score submission handled in GamePage

    function getShoulderDistance() {
        const landmarks = webcamRef.current?.getCurrentLandmarks();
        if (!landmarks) return null;
        const left = landmarks[11]; // left shoulder
        const right = landmarks[12]; // right shoulder
        if (!left || !right) return null;
        return Math.abs(left.x - right.x);
    }

    useEffect(() => {
        let animationId: number;
        function gameLoop() {
            const shoulderDist = getShoulderDistance();
            if (shoulderDist) {
                // Map shoulder dist
                const minDist = 0.15, maxDist = 0.45;
                const norm = Math.max(0, Math.min(1, (shoulderDist - minDist) / (maxDist - minDist)));
                paddleX.current = norm * (CANVAS_WIDTH - PADDLE_WIDTH);
            }

            // Ball movement 
            ball.current.x += ball.current.vx;
            ball.current.y += ball.current.vy;

            // Tile collision
            for (let row = 0; row < TILE_ROWS; row++) {
                for (let col = 0; col < TILE_COLS; col++) {
                    if (!tiles.current[row][col]) continue;
                    const tx = col * TILE_WIDTH;
                    const ty = row * TILE_HEIGHT;
                    // Simple AABB collision
                    if (
                        ball.current.x < tx + TILE_WIDTH &&
                        ball.current.x + BALL_SIZE > tx &&
                        ball.current.y < ty + TILE_HEIGHT &&
                        ball.current.y + BALL_SIZE > ty
                    ) {
                        tiles.current[row][col] = false;
                        ball.current.vy *= -1;
                        score.current += 5;
                    }
                }
            }

            //Wall collision 
            if (ball.current.x <= 0 || ball.current.x + BALL_SIZE > CANVAS_WIDTH) {
                ball.current.vx *= -1;
            }
            if (ball.current.y <= 0) {
                ball.current.vy *= -1;
            }

            //Paddle collision
            if (
                ball.current.y + BALL_SIZE >= CANVAS_HEIGHT - PADDLE_HEIGHT &&
                ball.current.x + BALL_SIZE >= paddleX.current && 
                ball.current.x <= paddleX.current + PADDLE_WIDTH
            ) {
                ball.current.vy *= -1;
                score.current += 1;
            }

            //Game over
            if (ball.current.y > CANVAS_HEIGHT) {
                onGameOver(score.current);
                return;
            }
            
            //Draw
            const ctx = canvasRef.current?.getContext("2d");
            if (ctx) {
                ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                // Tiles
                for (let row = 0; row < TILE_ROWS; row++) {
                    for (let col = 0; col < TILE_COLS; col++) {
                        if (tiles.current[row][col]) {
                            ctx.fillStyle = "#f1c40f";
                            ctx.fillRect(col * TILE_WIDTH, row * TILE_HEIGHT, TILE_WIDTH - 2, TILE_HEIGHT - 2);
                        }
                    }
                }
                //Paddle
                ctx.fillStyle = "#3498db";
                ctx.fillRect(paddleX.current, CANVAS_HEIGHT - PADDLE_HEIGHT, PADDLE_WIDTH, PADDLE_HEIGHT);
                //Ball
                ctx.fillStyle = "#e74c3c";
                ctx.fillRect(ball.current.x, ball.current.y, BALL_SIZE, BALL_SIZE);
                //Style
                ctx.fillStyle = "#ffffff";
                ctx.font = "20px Arial";
                ctx.fillText(`Score: ${score.current}`, 10, 30);
            }

            animationId = requestAnimationFrame(gameLoop);
        }
        gameLoop();
        return () => cancelAnimationFrame(animationId);
    }, [onGameOver, webcamRef]);

    return (
        <div>
            <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                style={{ border: "2px solid #333", backgroundColor: "#222" }}
            />
        </div>
    );
}