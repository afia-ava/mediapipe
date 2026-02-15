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
                    <h1 className="text-6xl font-black mb-4 tracking-tighter text-stone-900">
                        FLAPPY <span className="text-gold">ORACLE</span>
                    </h1>
                    <p className="mb-8 text-stone-600 font-bold uppercase tracking-widest text-sm">
                        Open your mouth to ascend
                    </p>
                    <button className="btn-statue" onClick={() => setGameState("playing")}>
                        Begin Ritual
                    </button>
                </div>
            )}
            {gameState === "playing" && <GamePage onGameOver={handleGameOver} />}
            {gameState === "gameover" && (
                <div className="flappy-menu">
                    <h1 className="text-4xl font-black mb-2 text-stone-900">FATE SEALED</h1>
                    <p className="text-2xl mb-6 text-gold font-bold">Offerings: {score}</p>

                    <div className="flex flex-col gap-4 w-full max-w-xs">
                        <input
                            type="text"
                            placeholder="NAME YOUR SACRIFICE"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            className="bg-stone-100 border-2 border-bronze-medium p-3 text-center font-bold uppercase placeholder:text-stone-400 focus:outline-none focus:border-gold"
                        />

                        <button
                            className="btn-statue w-full disabled:opacity-50 disabled:active:scale-100"
                            onClick={handleSubmitScore}
                            disabled={!playerName.trim()}
                        >
                            Record Legend
                        </button>

                        <button 
                            className="text-stone-500 hover:text-stone-800 text-xs font-bold uppercase tracking-widest transition-colors"
                            onClick={() => setGameState("menu")}
                        >
                            Back to Entrance
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
