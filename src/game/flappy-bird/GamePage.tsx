import React, { useState, useEffect, useRef, useCallback } from "react";
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

export default function GamePage({ onGameOver }: { onGameOver: (score: number) => void }) {
    const webcamRef = useRef<WebcamCaptureHandle>(null);
    const [birdY, setBirdY] = useState(300);
    const birdVelocity = useRef(0);
    const [score, setScore] = useState(0);
    const wasMouthOpenRef = useRef(false);
    const [pipes, setPipes] = useState<{ x: number; topHeight: number; id: number; passed: boolean }[]>([]);
    const lastPipeSpawn = useRef<number>(Date.now());
    const pipeIdCounter = useRef<number>(0);

    useEffect(() => {
        let animationFrameId: number;
        const update = () => {    
            const faceResult = webcamRef.current?.getFaceResult();
            const mouthIsOpen = isMouthOpen(faceResult);
            if (mouthIsOpen && !wasMouthOpenRef.current) {
                birdVelocity.current = JUMP_STRENGTH;
            }
            wasMouthOpenRef.current = mouthIsOpen;

            birdVelocity.current += GRAVITY;
            setBirdY(y => y + birdVelocity.current);

            //move pipes
            setPipes(prevPipes => {
                prevPipes.forEach(p => {
                    // If bird just passed the pipe's right edge
                    if (p.x + PIPE_WIDTH < BIRD_X && !p.passed) {
                        setScore(s => s + 1);
                        p.passed = true; 
                    }
                });

                return prevPipes
                    .filter(p => p.x > -PIPE_WIDTH)
                    .map(p => ({ ...p, x: p.x - PIPE_SPEED }));
            });

            //spawn new pipes
            if (Date.now() - lastPipeSpawn.current > PIPE_SPAWN_RATE) {
                const randomHeight = Math.floor(Math.random() * 200) + 100;
                setPipes(prev => [...prev, {
                    x: 800,
                    topHeight: randomHeight,
                    id: pipeIdCounter.current++,
                    passed: false
                }]);
                lastPipeSpawn.current = Date.now();
            }
            animationFrameId = requestAnimationFrame(update);
        };

        animationFrameId = requestAnimationFrame(update);
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    return (
        <div 
            className="flappy-game-container"
            style={{
                position: 'relative',
                width: '800px',
                height: '600px',
                margin: '0 auto',
                border: '4px solid #555',
                overflow: 'hidden',
                backgroundColor: "#70c5ce",
            }}
        >
            <WebcamCapture ref={webcamRef} width="0px" height="0px"/>

            {/* Score Display */}
            <div style={{ position: 'absolute', top: 10, left: 10, fontSize: '32px', fontWeight: 'bold', color: '#333' }}>
                Score: {score}
            </div>
            
            <div
                className="bird"
                style={{
                    position: "absolute",
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
                    <div style={{ position: 'absolute', left: pipe.x, top: 0, width: PIPE_WIDTH, height: pipe.topHeight, backgroundColor: 'green' }} />
                    <div style={{ position: 'absolute', left: pipe.x, top: pipe.topHeight + PIPE_GAP, width: PIPE_WIDTH, height: 600, backgroundColor: 'green' }} />
                </React.Fragment>
            ))}
        </div>
    );
}
