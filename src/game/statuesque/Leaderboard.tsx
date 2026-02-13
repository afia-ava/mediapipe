import { useState, useEffect } from 'react'
import { getLeaderboard, supabase, type LeaderboardEntry } from '../../lib/supabase'

type Score = {
  id: number;
  name: string;
  accuracy: number;
  hightest_level: number;
  created_at: string;
}

const loadScores = async (sortBy: "accuracy" | "highest_level", setScores: Function) => {
  const {data, error } = await supabase
    .from("scores")
    .select("*")
    .order(sortBy, {ascending: false})
    .order("created_at", {ascending: true})
    .limit(10);

  console.log(data)

  if (error) {
    console.error("Error loading scores:", error.message);
    return;
  }

  setScores(data as Score[]);
}


export function Leaderboard() {
  const [scores, setScores] = useState<Score[]>([]);
  const [sortBy, setSortBy] = useState<"highest_level" | "accuracy">("highest_level")

  useEffect(() => {
    loadScores(sortBy, setScores)
  }, [])

  const switchSort = () => {
    setSortBy(sortBy == "highest_level" ? "accuracy" : "highest_level");
    loadScores(sortBy, setScores);
  }

  if (!scores.length) {
    return <p className="meta">No scores available yet. Be the first to play!</p>;
  }

  return (
    <div className="leaderboard">
      <h3>LEADERBOARD</h3>
      <button
        onClick={switchSort}
        className="switch-sort-button">Sort by {sortBy == "highest_level" ? "Highest SImilarity" : "Highest Level Reached"} instead</button>
        <ol>
          {scores.map((s) => (
            <li key={s.id}>
              <strong>{s.name}</strong> -- {sortBy == "accuracy" ? `${s.accuracy.toString()}% Highest Similarity` : `${s.hightest_level.toString()}`}
            </li>
          ))}
        </ol>
    </div>
  );
}
