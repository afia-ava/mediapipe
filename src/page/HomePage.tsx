import { Link } from 'react-router-dom';
import { useState } from 'react';
import kinesthetics1 from '../assets/kinesthetics1.png';
import kinesthetics2 from '../assets/kinesthetics2.png';
import kinesthetics3 from '../assets/kinesthetics3.png';
import { supabase } from '../lib/supabase';

type ScoreRow = {
    id: number | string;
    name: string;
    score: number;
};

type ScoreLoadResult = {
    rows: any[];
    error: string | null;
};

export default function HomePage() {
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [loadingScores, setLoadingScores] = useState(false);
    const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"pong" | "flappy" | "statuesque">("pong");
    const [pongScores, setPongScores] = useState<ScoreRow[]>([]);
    const [flappyScores, setFlappyScores] = useState<ScoreRow[]>([]);
    const [statuesqueScores, setStatuesqueScores] = useState<ScoreRow[]>([]);

    const games = [
        {
            route: "/statuesque",
            image: kinesthetics1
        },
        {
            route: "/flappy-bird",
            image: kinesthetics2
        },
        {
            route: "/pong",
            image: kinesthetics3
        }
    ];

    const normalizeScores = (rows: any[]): ScoreRow[] => {
        return rows
            .map((row, idx) => ({
                id: row.id ?? `${row.name ?? row.player_name ?? row.username ?? "player"}-${idx}`,
                name: row.name ?? row.player_name ?? row.username ?? "Player",
                score: Number(
                    row.score ?? row.points ?? row.hightest_level ?? row.highest_level ?? row.accuracy ?? 0
                ),
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
    };

    const fetchScores = async (tableName: string, sortColumn: string = "score"): Promise<ScoreLoadResult> => {
        const primary = await supabase
            .from(tableName)
            .select("*")
            .order(sortColumn, { ascending: false })
            .order("created_at", { ascending: true })
            .limit(25);

        if (!primary.error) {
            return { rows: primary.data ?? [], error: null };
        }

        // Fallback for tables without expected sort columns (or different schema).
        const fallback = await supabase
            .from(tableName)
            .select("*")
            .limit(100);

        if (!fallback.error) {
            return { rows: fallback.data ?? [], error: primary.error.message };
        }

        return { rows: [], error: fallback.error.message };
    };

    const loadLeaderboard = async () => {
        setLoadingScores(true);
        setLeaderboardError(null);

        const [pongRes, flappyRes, statuesqueRes] = await Promise.all([
            fetchScores("pong_scores"),
            fetchScores("flappy_scores"),
            fetchScores("statuesque_scores"),
        ]);

        if (pongRes.error) {
            console.error("Failed to load pong_scores with primary sort:", pongRes.error);
        }
        if (flappyRes.error) {
            console.error("Failed to load flappy_scores with primary sort:", flappyRes.error);
        }

        setPongScores(normalizeScores(pongRes.rows));
        setFlappyScores(normalizeScores(flappyRes.rows));

        if (statuesqueRes.error) {
            console.warn("Failed to load statuesque_scores, trying legacy scores table:", statuesqueRes.error);
            const legacyRes = await fetchScores("scores", "hightest_level");

            if (legacyRes.error) {
                console.error("Failed to load legacy scores table:", legacyRes.error);
                setStatuesqueScores([]);
            } else {
                setStatuesqueScores(normalizeScores(legacyRes.rows));
            }
        } else {
            setStatuesqueScores(normalizeScores(statuesqueRes.rows));
        }

        if (pongRes.error || flappyRes.error) {
            setLeaderboardError("Some score tables could not be read. Check Supabase table names and read policies.");
        }

        setLoadingScores(false);
    };

    const openLeaderboard = async () => {
        setShowLeaderboard(true);
        setActiveTab("pong");
        await loadLeaderboard();
    };

    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-white">
            <button
                type="button"
                onClick={openLeaderboard}
                className="absolute top-6 right-6 px-4 py-2 border-2 border-bronze-dark bg-gradient-to-br from-papyrus-light to-papyrus-medium text-text-dark font-bold uppercase tracking-[1px] hover:brightness-105 transition"
            >
                Leaderboard
            </button>

            <h1 className="font-architype text-6xl font-bold text-black mb-16 mt-0 -mt-12 tracking-widest">
                kinesthetic games
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {games.map((game, idx) => (
                    <Link
                        key={idx}
                        to={game.route}
                        className="block p-0.5 rounded-lg shadow-lg text-center bg-gradient-to-br from-neutral-800 to-neutral-900 transform transition-transform hover:scale-105 border border-neutral-400 flex justify-center items-center"
                    >
                        <img src={game.image} alt="Game" className="h-[30rem] w-[26rem] object-cover rounded-md" style={{margin: '1mm'}} />
                    </Link>
                ))}
            </div>

            {showLeaderboard && (
                <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
                    <div className="w-full max-w-[920px] max-h-[86vh] overflow-auto border-[3px] border-bronze-dark bg-gradient-to-br from-papyrus-medium to-papyrus-light p-6 shadow-[inset_0_0_28px_rgba(0,0,0,0.12),0_18px_44px_rgba(0,0,0,0.55),0_0_0_2px_var(--bronze-medium)]">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-2xl font-bold text-gold uppercase tracking-[1px]">Leaderboard</h2>
                            <button
                                type="button"
                                onClick={() => setShowLeaderboard(false)}
                                className="px-3 py-1.5 border-2 border-bronze-dark bg-gradient-to-br from-papyrus-light to-papyrus-medium text-text-dark font-semibold hover:brightness-105 transition"
                            >
                                Close
                            </button>
                        </div>

                        <div className="mb-5 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setActiveTab("pong")}
                                className={`px-4 py-2 border-2 font-bold uppercase tracking-[1px] transition ${
                                    activeTab === "pong"
                                        ? "border-bronze-dark bg-gradient-to-br from-gold to-gold-dark text-text-dark"
                                        : "border-bronze-medium bg-papyrus-light text-text-dark hover:brightness-95"
                                }`}
                            >
                                Pong
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("flappy")}
                                className={`px-4 py-2 border-2 font-bold uppercase tracking-[1px] transition ${
                                    activeTab === "flappy"
                                        ? "border-bronze-dark bg-gradient-to-br from-gold to-gold-dark text-text-dark"
                                        : "border-bronze-medium bg-papyrus-light text-text-dark hover:brightness-95"
                                }`}
                            >
                                Flappy Bird
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("statuesque")}
                                className={`px-4 py-2 border-2 font-bold uppercase tracking-[1px] transition ${
                                    activeTab === "statuesque"
                                        ? "border-bronze-dark bg-gradient-to-br from-gold to-gold-dark text-text-dark"
                                        : "border-bronze-medium bg-papyrus-light text-text-dark hover:brightness-95"
                                }`}
                            >
                                Statuesque
                            </button>
                        </div>

                        {loadingScores && (
                            <p className="text-text-dark font-semibold">Loading scores...</p>
                        )}

                        {!loadingScores && leaderboardError && (
                            <p className="text-red-700 font-semibold mb-4">{leaderboardError}</p>
                        )}

                        {!loadingScores && (
                            <div className="border-2 border-bronze-medium bg-papyrus-light p-5">
                                {activeTab === "pong" && (
                                    <section>
                                        {pongScores.length === 0 && <p className="text-sm text-text-dark">No scores yet.</p>}
                                        {pongScores.length > 0 && (
                                            <div className="overflow-hidden border-2 border-bronze-medium">
                                                <table className="w-full text-left text-text-dark">
                                                    <thead className="bg-papyrus-medium border-b-2 border-bronze-medium">
                                                        <tr>
                                                            <th className="px-3 py-2 w-16">#</th>
                                                            <th className="px-3 py-2">Name</th>
                                                            <th className="px-3 py-2 w-28 text-right">Score</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {pongScores.map((score, idx) => (
                                                            <tr
                                                                key={`pong-${score.id}`}
                                                                className="border-b border-bronze-light/40 last:border-b-0"
                                                            >
                                                                <td className="px-3 py-2 font-semibold">{idx + 1}</td>
                                                                <td className="px-3 py-2 font-semibold">{score.name}</td>
                                                                <td className="px-3 py-2 text-right">{score.score}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </section>
                                )}

                                {activeTab === "flappy" && (
                                    <section>
                                        {flappyScores.length === 0 && <p className="text-sm text-text-dark">No scores yet.</p>}
                                        {flappyScores.length > 0 && (
                                            <div className="overflow-hidden border-2 border-bronze-medium">
                                                <table className="w-full text-left text-text-dark">
                                                    <thead className="bg-papyrus-medium border-b-2 border-bronze-medium">
                                                        <tr>
                                                            <th className="px-3 py-2 w-16">#</th>
                                                            <th className="px-3 py-2">Name</th>
                                                            <th className="px-3 py-2 w-28 text-right">Score</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {flappyScores.map((score, idx) => (
                                                            <tr
                                                                key={`flappy-${score.id}`}
                                                                className="border-b border-bronze-light/40 last:border-b-0"
                                                            >
                                                                <td className="px-3 py-2 font-semibold">{idx + 1}</td>
                                                                <td className="px-3 py-2 font-semibold">{score.name}</td>
                                                                <td className="px-3 py-2 text-right">{score.score}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </section>
                                )}

                                {activeTab === "statuesque" && (
                                    <section>
                                        {statuesqueScores.length === 0 && <p className="text-sm text-text-dark">No scores yet.</p>}
                                        {statuesqueScores.length > 0 && (
                                            <div className="overflow-hidden border-2 border-bronze-medium">
                                                <table className="w-full text-left text-text-dark">
                                                    <thead className="bg-papyrus-medium border-b-2 border-bronze-medium">
                                                        <tr>
                                                            <th className="px-3 py-2 w-16">#</th>
                                                            <th className="px-3 py-2">Name</th>
                                                            <th className="px-3 py-2 w-28 text-right">Score</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {statuesqueScores.map((score, idx) => (
                                                            <tr
                                                                key={`statuesque-${score.id}`}
                                                                className="border-b border-bronze-light/40 last:border-b-0"
                                                            >
                                                                <td className="px-3 py-2 font-semibold">{idx + 1}</td>
                                                                <td className="px-3 py-2 font-semibold">{score.name}</td>
                                                                <td className="px-3 py-2 text-right">{score.score}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </section>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div> 
    );
}
