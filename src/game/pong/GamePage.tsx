import { useState, useRef, useEffect } from "react";
import {WebcamCapture, type WebcamCaptureHandle } from "../../pose-detection/WebcamCapture";
import Pong from "./Pong";
import { Link } from "react-router-dom";

export default function GamePage() {
    const webcamRef = useRef<WebcamCaptureHandle>(null);
    const [gameState, setGameState] = useState<"start" | "playing" | "gameover">("start");
    const [finalScore, setFinalScore] = useState(0);

    const handleStart = () => {
        webcamRef.current?.start();
        setGameState("playing");
    };

    const handleGameOver = (score: number) => {
        setFinalScore(score);
        setGameState("gameover");
    };

    const handleRestart = () => {
        setFinalScore(0);
        setGameState("playing");
    };

    useEffect(() => {
        if (gameState === "playing") {
            webcamRef.current?.start();
        }
    }, [gameState]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (webcamRef.current?.isRunning()) {
                setWebcamReady(true);
                clearInterval(interval);
            }
        }, 100);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="pong-page">
            {/*Start Screen */}
            {gameState === "start" && (
                <div className="start-screen">
                    <h1>Pose Pong</h1>
                    <p className="instructions">
                        Move <strong>closer</strong> to camera → paddle moves <strong>right</strong><br/>
                        Move <strong>away</strong> from camera → paddle moves <strong>left</strong><br/>
                    </p>
                    <button className="start-button" onClick={handleStart}>
                        Start Game
                    </button>
                </div>
            )}

            {/*Game Screen */}
            {gameState === "playing" && (
                <div className="game-layout">
                    <div className="webcam-panel">
                        <h3>Distance Tracker</h3>
                        <WebcamCapture ref={webcamRef} width="480px" height="360px" />
                    </div>
                    <Pong webcamRef={webcamRef} onGameOver={handleGameOver} />
                </div>
            )}

            {/*Game Over Screen */}
            {gameState === "gameover" && (
                <div className="gameover-screen">
                    <h1>Game Over</h1>
                    <p className="final-score">Score: {finalScore}</p>
                    <button className="restart-button" onClick={handleRestart}>
                        Play Again
                    </button>
                    <Link className="menu-button" to="/">Back to Menu</Link>
                </div>
            )}
        </div>
    );

}
