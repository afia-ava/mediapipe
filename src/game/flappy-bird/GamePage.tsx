import React, { useState, useEffect, useRef } from "react";
import {WebcamCapture, type WebcamCaptureHandle } from "../../pose-detection/WebcamCapture";
import flappyBirdSprite from "./assets/flappy bird.png";

// game constants
const BASE_GRAVITY = 0.22;
const MAX_GRAVITY = 0.28;
const JUMP_STRENGTH = -4.5;
const PIPE_SPEED = 2;
const PIPE_SPAWN_RATE = 5000;
const PIPE_GAP = 200;
const PIPE_WIDTH = 60;

interface GamePageProps {
    onGameOver: (score: number) => void;
}

export default function GamePage({ onGameOver }: GamePageProps) 
{
    // Bird stays fixed at center
    const webcamRef = useRef<WebcamCaptureHandle>(null);
    const [birdY, setBirdY] = useState(300);
    const birdYRef = useRef(300);
    const birdVelocity = useRef(0);
    const [score, setScore] = useState(0);
    const scoreRef = useRef(0);
    const wasMouthOpenRef = useRef(false);
    const [pipes, setPipes] = useState<{ x: number; topHeight: number; id: number; passed: boolean }[]>([]);
    const lastPipeSpawn = useRef<number>(0);
    const pipeIdCounter = useRef<number>(0);
    const [isMouthCurrentlyOpen, setIsMouthCurrentlyOpen] = useState(false);

    useEffect(() => {
        webcamRef.current?.start();
        let animationFrameId: number;
        let webcamBecameReady = false;
        const update = () => {
            // Check if webcam is ready
            if (!webcamBecameReady && webcamRef.current?.isRunning()) {
                webcamBecameReady = true;
                lastPipeSpawn.current = Date.now(); // Reset pipe spawn timer 

                setPipes([
                    {
                        x : 800,
                        topHeight : Math.floor(Math.random() * 200) + 100,
                        id : pipeIdCounter.current++,
                        passed : false
                    }
                ])
            }

            // Don't run game logic until webcam is ready
            if (!webcamBecameReady) {
                animationFrameId = requestAnimationFrame(update);
                return;
            }

            //mouth detection jump
            const faceResult = webcamRef.current?.getFaceResult();
            const mouthOpenValue =
                faceResult?.faceBlendshapes?.[0]?.categories?.find(
                    (c: { categoryName?: string; score?: number }) => c.categoryName === "jawOpen"
                )?.score || 0;
            setIsMouthCurrentlyOpen(mouthOpenValue > 0.3);

            if (mouthOpenValue > 0.3 && !wasMouthOpenRef.current && birdVelocity.current >= 0) {
                const scaledJump = JUMP_STRENGTH * (1 + mouthOpenValue); 
                birdVelocity.current = scaledJump;
            }
            wasMouthOpenRef.current = mouthOpenValue > 0.3;
            
            //physics
            const currentGravity = Math.min(BASE_GRAVITY + (scoreRef.current * 0.015), MAX_GRAVITY);
            birdVelocity.current += currentGravity;
            birdYRef.current += birdVelocity.current;
            setBirdY(birdYRef.current);

            //check floor/deiling hit
            const BIRD_SIZE = 40;
            if (birdYRef.current + BIRD_SIZE > 600) {
                onGameOver(scoreRef.current);
                return;
            }

            //move pipes
            setPipes(prevPipes => {
                let nextPipes = prevPipes
                    .map(p => ({ ...p, x: p.x - PIPE_SPEED }))
                    .filter(p => p.x > -PIPE_WIDTH);
                
                //spawn pipes only after webcam is ready
                if (
                    webcamBecameReady &&
                    Date.now() - lastPipeSpawn.current > PIPE_SPAWN_RATE
                ) {
                    const randomHeight = Math.floor(Math.random() * 120) + 120;
                    nextPipes.push({
                        x: 800,
                        topHeight: randomHeight,
                        id: pipeIdCounter.current++,
                        passed: false
                    });
                    lastPipeSpawn.current = Date.now();
                }
                //update score for pipes
                let pipesPassed = 0;
                nextPipes = nextPipes.map(p => {
                    if (p.x + PIPE_WIDTH < 400 && !p.passed) {
                        pipesPassed += 1;
                        return { ...p, passed: true };
                    }
                    return p;
                });
                if (pipesPassed > 0) {
                    scoreRef.current += pipesPassed;
                    setScore(scoreRef.current);
                }
                
                const birdLeft = 400;
                const birdRight = birdLeft + BIRD_SIZE;
                                const birdBottom = birdYRef.current + BIRD_SIZE;
                                const GAP_BUFFER = 8;
                                const activePipe = nextPipes.find(
                    p => birdRight > p.x && birdLeft < p.x + PIPE_WIDTH
                                );
                                if (activePipe) {
                                    if (
                                        birdYRef.current < activePipe.topHeight + GAP_BUFFER ||
                                        birdBottom > activePipe.topHeight + PIPE_GAP - GAP_BUFFER
                                    ) {
                                        console.log('Game Over: ', { birdY: birdYRef.current, birdBottom, pipe: activePipe });
                                        onGameOver(scoreRef.current);
                                    }
                                }
                return nextPipes;
            });

            animationFrameId = requestAnimationFrame(update);
        };

        animationFrameId = requestAnimationFrame(update);
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    return (
        <div className="flex gap-6 items-center">
            {/* webcam panel */}
            <div className="backdrop-blur-md bg-blue-100/60 border-4 border-blue-300 rounded-xl flex flex-col items-center gap-3 p-4 shadow-lg">
                <h3 className="text-blue-700 font-bold uppercase tracking-wider text-sm">Mouth Tracker</h3>
                <div className="w-[480px] h-[360px] border-2 border-blue-400 shadow-lg overflow-hidden bg-blue-50 rounded-xl">
                    <WebcamCapture ref={webcamRef} width="480px" height="360px"/>
                </div>
                <div className="mouth-indicator">
                    <div className={`status-dot ${isMouthCurrentlyOpen ? "status-open" : "status-closed"}`} />
                    <span className="text-xs uppercase font-bold text-papyrus-light">
                        {isMouthCurrentlyOpen ? 'Mouth Open - Jump' : 'Mouth Closed'}
                    </span>
                </div>
            </div>

            {/* Game Area */}
            <div className="flappy-container">
                <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 text-5xl font-bold text-blue-700 drop-shadow-md italic">{score}</div>

                <img
                    className="bird-sprite"
                    src={flappyBirdSprite}
                    alt="Flappy Bird"
                    style={{
                        top: birdY,
                        left: 400, // center of 800px game area
                        width: '40px',
                        height: '40px',
                        zIndex: 5
                    }}
                />

                {pipes.map(pipe => (
                    <React.Fragment key={pipe.id}>
                        <div
                            className="pipe"
                            style={{ position: 'absolute', left: pipe.x, top: 0, width: PIPE_WIDTH, height: pipe.topHeight, backgroundColor: 'green' }}
                        />
                        <div
                            className="pipe"
                            style={{ position: 'absolute', left: pipe.x, top: pipe.topHeight + PIPE_GAP, width: PIPE_WIDTH, height: 600, backgroundColor: 'green' }}
                        />
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
}

