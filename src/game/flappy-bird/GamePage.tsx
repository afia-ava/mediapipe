import React, { useState, useEffect, useRef } from "react";
import {WebcamCapture, type WebcamCaptureHandle } from "../../pose-detection/WebcamCapture";
import { isMouthOpen } from "../../pose-utils";

// game constants
const BASE_GRAVITY = 0.2;
const MAX_GRAVITY = 0.25;
const JUMP_STRENGTH = -6;
const PIPE_SPEED = 3;
const PIPE_SPAWN_RATE = 5500;
const MIN_PIPE_DISTANCE = 300;
const BIRD_X = 50;
const PIPE_GAP = 160;
const PIPE_WIDTH = 60;
const JUMP_COOLDOWN = 300;

interface GamePageProps {
    onGameOver: (score: number) => void;
}

export default function GamePage({ onGameOver }: GamePageProps) 
{
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
    const lastJumpTimeRef = useRef<number>(0);
    const [webcamReady, setWebcamReady] = useState(false);

    useEffect(() => {
        webcamRef.current?.start();
        let animationFrameId: number;
        let webcamBecameReady = false;
        const update = () => {    
            // Check if webcam is ready
            if (!webcamBecameReady && webcamRef.current?.isRunning()) {
                webcamBecameReady = true;
                lastPipeSpawn.current = Date.now(); // Reset pipe spawn timer when webcam is ready
                setWebcamReady(true);
            }

            // Don't run game logic until webcam is ready
            if (!webcamBecameReady) {
                animationFrameId = requestAnimationFrame(update);
                return;
            }

            //mouth detection jump
            const faceResult = webcamRef.current?.getFaceResult();
            const mouthIsOpen = isMouthOpen(faceResult);
            setIsMouthCurrentlyOpen(mouthIsOpen);

            if (mouthIsOpen && !wasMouthOpenRef.current && birdVelocity.current >= 0) {
                birdVelocity.current = JUMP_STRENGTH;
                lastJumpTimeRef.current = Date.now();
            }
            wasMouthOpenRef.current = mouthIsOpen;
            
            //physics
            const currentGravity = Math.min(BASE_GRAVITY + (scoreRef.current * 0.015), MAX_GRAVITY);
            birdVelocity.current += currentGravity;
            birdYRef.current += birdVelocity.current;
            setBirdY(birdYRef.current);

            //check floor/deiling hit
            const BIRD_SIZE = 40;
            if (birdYRef.current < 0 || birdYRef.current + BIRD_SIZE > 600) {
                onGameOver(scoreRef.current);
                return;
            }

            //move pipes
            setPipes(prevPipes => {
                let nextPipes = prevPipes
                    .map(p => ({ ...p, x: p.x - PIPE_SPEED }))
                    .filter(p => p.x > -PIPE_WIDTH);
                
                //spawn pipes only after webcam is ready
                if (webcamBecameReady && Date.now() - lastPipeSpawn.current > PIPE_SPAWN_RATE) {
                    const randomHeight = Math.floor(Math.random() * 200) + 100;
                    nextPipes.push({
                        x: 800,
                        topHeight: randomHeight,
                        id: pipeIdCounter.current++,
                        passed: false
                    });
                    lastPipeSpawn.current = Date.now();
                }

                for (const p of nextPipes) {
                    // If bird just passed the pipe's right edge
                    if (p.x + PIPE_WIDTH < BIRD_X && !p.passed) {
                        p.passed = true; 
                        scoreRef.current += 1;
                        setScore(scoreRef.current);
                    }

                    const birdRight = BIRD_X + BIRD_SIZE;
                    const birdBottom = birdYRef.current + BIRD_SIZE;

                    if (BIRD_X < p.x + PIPE_WIDTH && birdRight > p.x) {
                        if (birdYRef.current < p.topHeight || birdBottom > p.topHeight + PIPE_GAP) {
                            onGameOver(scoreRef.current);
                            return prevPipes;
                        }
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
        <div className="flappy-layout"> 
            {/* webcam panel */}
            <div className="webcam-panel">
                <h3>Mouth Tracker</h3>
                <div className= "webcam-box">
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
            <div className="flappy-score">{score}</div>

            <div
                className="bird"
                style={{
                    top: birdY,
                    left: BIRD_X,
                    width: '40px',
                    height: '40px',
                    backgroundColor: "#70c5ce",
                    borderRadius: '50%',
                    border: '2px solid orange',
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

