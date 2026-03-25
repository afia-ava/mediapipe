import { useState } from "react";
import GamePage from "./GamePage";
import "./FlappyBird.css";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";


export default function FlappyBird() {
    const [gameState, setGameState] = useState("menu");
    const [score, setScore] = useState(0);
    const [playerName, setPlayerName] = useState("");
    const [showScoreNotification, setShowScoreNotification] = useState(false);

    const handleGameOver = (finalScore: number) => {
        setScore(finalScore);
        setGameState("gameover");
    }

    const handleSubmitScore = async () => {
        if (!playerName.trim()) {
            alert("Please enter your name before submitting your score.");
            return;
        }  
        try {
            const { error } = await supabase.from("flappy_scores").insert([
                {
                    name: playerName.trim(),
                    score,
                    created_at: new Date().toISOString(),
                }
            ]);
            if (error) {
                alert("Failed to submit score. Please try again.");
            } else {
                setShowScoreNotification(true);
                setGameState("menu");
                setPlayerName("");
                setTimeout(() => setShowScoreNotification(false), 3000);
            }
        } catch (err) {
            alert("Failed to submit score. Please try again.");
        }
    };
     
    return (
        <div className="flappy-page">
            {showScoreNotification && (
                <div className="fixed top-8 right-8 z-50 bg-stone-900 text-white px-8 py-5 rounded-xl shadow-lg flex items-center gap-4">
                    <span>Score saved!</span>
                    <button
                        className="ml-2 text-2xl font-bold text-white hover:text-stone-400 focus:outline-none"
                        aria-label="Close notification"
                        onClick={() => setShowScoreNotification(false)}
                    >
                        &times;
                    </button>
                </div>
            )}
            {gameState === "menu" && (
                <div className="flappy-card" role="region" aria-label="Flappy Bird start card">
                    <h1>Flappy Bird</h1>
                    <p className="flappy-instructions">
                        Open your <strong>mouth</strong> to make the bird <strong>jump</strong><br/>
                        Keep your mouth <strong>closed</strong> to <strong>fall</strong>
                    </p>
                    <div className="flappy-actions">
                        <button className="btn-statue" onClick={() => setGameState("playing")}>Start Game</button>
                        <Link className="btn-statue" to="/">Back to Menu</Link>
                    </div>
                </div>
            )}
            {gameState === "playing" && <GamePage onGameOver={handleGameOver} />}
            
            {gameState === "gameover" && (
                <div className="flappy-card" role="region" aria-label="Flappy Bird game over card">
                    <h1>Game Over</h1>
                    <p className="flappy-score-text">Your Score: {score}</p>

                    <input
                        type="text"
                        placeholder="Enter your name"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        className="flappy-name-input"
                    />

                    <div className="flappy-actions">
                        <button
                            className="btn-statue"
                            onClick={handleSubmitScore}
                            disabled={!playerName.trim()}
                        >
                            Submit Score
                        </button>

                        <button
                            className="btn-statue"
                            onClick={() => setGameState("playing")}
                        >
                            Play Again
                        </button>
                        <Link className="btn-statue" to="/">Back to Menu</Link>
                    </div>
                </div>
            )}
        </div>
    );
}
