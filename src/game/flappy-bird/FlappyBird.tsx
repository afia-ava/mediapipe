import { useState } from "react";
import GamePage from "./GamePage";
import "./FlappyBird.css";

export default function FlappyBird() {
    const [gameState, setGameState] = useState("menu");
    const [score, setScore] = useState(0);
    const [playerName, setPlayerName] = useState("");

    const handleGameOver = (finalScore: number) => {
        setScore(finalScore);
        setGameState("gameover");
    }

    const handleSubmitScore = async () => {
        if (!playerName.trim()) {
            alert("Please enter your name before submitting your score.");
            return;
        }  
        setGameState("menu");
        setPlayerName("");
    }
     
    return (
        <div className="flappy-root">
            {gameState === "menu" && (
                <div className="flappy-menu">
                    <h1>Flappy Bird</h1>
                    <button className="btn-statue" onClick={() => setGameState("playing")}>Start Game</button>
                </div>
            )}
            {gameState === "playing" && <GamePage onGameOver={handleGameOver} />}
            
            {gameState === "gameover" && (
                <div className="flappy-menu">
                    <h1>Game Over</h1>
                    <p>Your Score: {score}</p>

                    <input
                        type="text"
                        placeholder="Enter your name"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        className="p-2 mb-3 border-2 border-bronze-dark bg-papyrus-light text-text-dark"
                    />

                    <button
                        className="btn-statue"
                        onClick={handleSubmitScore}
                        disabled={!playerName.trim()}
                    >
                        Submit Score
                    </button>

                    <button className="btn-statue" onClick={() => setGameState("menu")}>Back to Menu</button>
                </div>
            )}
        </div>
    );
}
