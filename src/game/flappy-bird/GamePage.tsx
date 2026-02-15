import React, { useState, useEffect, useRef } from "react";
import {WebcamCapture, type WebcamCaptureHandle } from "../../pose-detection/WebcamCapture";
import { isMouthOpen } from "../../pose-utils";

// game constants
const GRAVITY = 0.6;
const JUMP_STRENGTH = -8;
const PIPE_SPEED = 3.5;
const PIPE_SPAWN_RATE = 1500;
const BIRD_X = 50;
const PIPE_GAP = 160;
const PIPE_WIDTH = 60;
const BIRD_SIZE = 40;

interface GamePageProps {
    onGameOver: (score: number) => void;
}

export default function GamePage({ onGameOver }: GamePageProps) {
    const webcamRef = useRef<WebcamCaptureHandle>(null);
    const [birdY, setBirdY] = useState(300);
    const birdYRef = useRef(300);
    const birdVelocity = useRef(0);
    const [score, setScore] = useState(0);
    const scoreRef = useRef(0);
    const wasMouthOpenRef = useRef(false);
    const [pipes, setPipes] = useState<{ x: number; topHeight: number; id: number; passed: boolean }[]>([]);
    const pipesRef = useRef<{ x: number; topHeight: number; id: number; passed: boolean }[]>([]);
    const lastPipeSpawn = useRef<number>(Date.now());
    const pipeIdCounter = useRef<number>(0);
    const [isMouthCurrentlyOpen, setIsMouthCurrentlyOpen] = useState(false);

    useEffect(() => {
        webcamRef.current?.start();
        let animationFrameId: number;
        let isGameOver = false;

        const update = () => {    
            if (isGameOver) return;

            const faceResult = webcamRef.current?.getFaceResult();
            const mouthIsOpen = isMouthOpen(faceResult);
            setIsMouthCurrentlyOpen(mouthIsOpen);

            if (mouthIsOpen && !wasMouthOpenRef.current) {
                birdVelocity.current = JUMP_STRENGTH;
            }
            wasMouthOpenRef.current = mouthIsOpen;

            birdVelocity.current += GRAVITY;
            birdYRef.current += birdVelocity.current;
            setBirdY(birdYRef.current);

            // Collision check: Floor or Ceiling
            if (birdYRef.current < 0 || birdYRef.current > 600 - BIRD_SIZE) {
                isGameOver = true;
                onGameOver(scoreRef.current);
                return;
            }

            // Move pipes and check collisions
            const nextPipes = pipesRef.current
                .map(p => ({ ...p, x: p.x - PIPE_SPEED }))
                .filter(p => p.x > -PIPE_WIDTH);

            for (const p of nextPipes) {
                // If bird just passed the pipe's right edge
                if (p.x + PIPE_WIDTH < BIRD_X && !p.passed) {
                    p.passed = true; 
                    scoreRef.current += 1;
                    setScore(scoreRef.current);
                }

                // Pipe Collision Logic
                const birdRight = BIRD_X + BIRD_SIZE;
                const birdBottom = birdYRef.current + BIRD_SIZE;
                
                if (BIRD_X < p.x + PIPE_WIDTH && birdRight > p.x) {
                    // X overlap exists, now check Y
                    if (birdYRef.current < p.topHeight || birdBottom > p.topHeight + PIPE_GAP) {
                        isGameOver = true;
                        onGameOver(scoreRef.current);
                        return;
                    }
                }
            }

            pipesRef.current = nextPipes;
            setPipes(nextPipes);

            // Spawn new pipes
            if (Date.now() - lastPipeSpawn.current > PIPE_SPAWN_RATE) {
                const randomHeight = Math.floor(Math.random() * 200) + 100;
                pipesRef.current.push({
                    x: 800,
                    topHeight: randomHeight,
                    id: pipeIdCounter.current++,
                    passed: false
                });
                lastPipeSpawn.current = Date.now();
            }
            animationFrameId = requestAnimationFrame(update);
        };

        animationFrameId = requestAnimationFrame(update);
        return () => {
            isGameOver = true;
            cancelAnimationFrame(animationFrameId);
        };
    }, [onGameOver]);

    return (
        <div className="flappy-container">
            <div className="webcam-preview">
                <WebcamCapture ref={webcamRef} width="160px" height="120px"/>
            </div>

            {/* Score Display */}
            <div className="flappy-score">
                {score}
            </div>

            {/* Mouth Indicator */}
            <div className="mouth-indicator">
                <div className={`status-dot ${isMouthCurrentlyOpen ? 'status-open' : 'bg-red-500'}`} />
                <span className="text-xs uppercase tracking-widest font-bold">
                    {isMouthCurrentlyOpen ? 'Jump!' : 'Closed'}
                </span>
            </div>
            
            <div
                className="bird"
                style={{
                    top: birdY, 
                    left: BIRD_X,
                    width: '40px',
                    height: '40px',
                    zIndex: 5
                }}
            />
            {pipes.map(pipe => (
                <React.Fragment key={pipe.id}>
                    <div 
                        className="pipe" 
                        style={{ left: pipe.x, top: 0, width: PIPE_WIDTH, height: pipe.topHeight }} 
                    />
                    <div 
                        className="pipe"
                        style={{ left: pipe.x, top: pipe.topHeight + PIPE_GAP, width: PIPE_WIDTH, height: 600 }} 
                    />
                </React.Fragment>
            ))}
        </div>
    );
}
