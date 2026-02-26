import { useState, useEffect } from 'react';
import {supabase } from '../../lib/supabase';

type Score = {
    id: number;
    name: string;
    score: number;
    created_at: string;
}

const loadScores = async (setScores: Function) => {
    const {data, error } = await supabase
        .from("pong_scores")
        .select("*")
        .order("score", {ascending: false})
        .order("created_at", {ascending: true})
        .limit(10);
    
    if (error) {
        console.error("Error loading scores:", error.message);
        return;
    }

    setScores(data as Score[]);
};

export function Leaderboard() {
    const [scores, setScores] = useState<Score[]>([]);

    useEffect(() => {
        loadScores(setScores);
    }, []);

    if (!scores.length) {
        return <p className="meta">No scores available yet. Be the first to play!</p>;
    }

    return (
        <div className="leaderboard">
            <h3>LEADERBOARD</h3>
            <ol>
                {scores.map((s) => (
                    <li key={s.id}>
                        <strong>{s.name}</strong> -- {s.score.toString()} points
                    </li>
                ))}
            </ol>
        </div>
    );
}