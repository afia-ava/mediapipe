import { useEffect, useRef, useState } from "react";
import { WebcamCapture, type WebcamCaptureHandle } from "../../pose-detection/WebcamCapture";
import { supabase } from "../../lib/supabase";
import { comparePoses, extractLandmarksFromResult } from "../../pose-utils/comparePoses";

// Remove stray closing brace and add missing constants
const MATCH_THRESHOLD = 0.45;
const COUNTDOWN_LEN = 4;
const BETWEEN_LEVEL = 3;
const WEBCAM_TIMER = 3; // seconds to recreate pose

export default function PoseGame({ poseImages }: { poseImages: string[] }) {
  const [started, setStarted] = useState(false);
  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState<"idle" | "show" | "webcam" | "ending" | "gameover" | "level-complete">("idle");
  const [poseIndex, setPoseIndex] = useState(0);
  const [countdown, setCountdown] = useState(COUNTDOWN_LEN);
  const [isWebcamReady, setIsWebcamReady] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const webcamRef = useRef<WebcamCaptureHandle>(null);
  const poseCount = poseImages.length;

  // Only show 1 pose per level, and give player time to recreate it
  const posesPerLevel = 1;
  const [showPhaseDone, setShowPhaseDone] = useState(false);

  // Add webcam phase timer for player to recreate pose
  const [webcamCountdown, setWebcamCountdown] = useState(WEBCAM_TIMER);
  const [webcamPhaseDone, setWebcamPhaseDone] = useState(false);

  // Add pose comparison and result after webcam timer ends
  const [poseMatched, setPoseMatched] = useState<null | boolean>(null);

  // Add missing states for results and pose sequence
  const [poseSequence, setPoseSequence] = useState<any[]>([]);
  const [selectedPoses, setSelectedPoses] = useState<any[]>([]);
  const [similarityResults, setSimilarityResults] = useState<number[]>([]);

  // INITIALIZE WEBCAM 
  useEffect(() => {
    const initWebcam = async () => {
      let retries = 0;
      while (!webcamRef.current?.isModelReady?.() && retries < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }
      if (!webcamRef.current?.isModelReady?.()) {
        console.error("Webcam model never became ready after 5 seconds");
        setIsWebcamReady(false);
        return;
      }
      try {
        await webcamRef.current.start();
        setIsWebcamReady(true);
        console.log("Webcam started successfully");
      } catch (error) {
        setIsWebcamReady(false);
        console.error("Webcam start failed:", error);
      }
    };
    initWebcam();
  }, []);


  // No landmark drawing needed

  // Removed pose comparison logic

  // ===== SHOW PHASE: COUNTDOWN AND ADVANCE POSE =====
  useEffect(() => {
    if (phase !== "show" || !started || showPhaseDone) return;
    setCountdown(COUNTDOWN_LEN);
    let remaining = COUNTDOWN_LEN;
    const interval = setInterval(() => {
      remaining--;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        setShowPhaseDone(true);
        setPhase("webcam");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, started, showPhaseDone]);

  // ===== LEVEL COMPLETE SPLASH SCREEN COUNTDOWN =====
  useEffect(() => {
    if (phase !== "level-complete") return;
    setCountdown(BETWEEN_LEVEL);
    let remaining = BETWEEN_LEVEL;
    const interval = setInterval(() => {
      remaining--;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        setPoseIndex(0);
        setPhase("show");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // ===== 5d. POSE INDEX CHANGE PULSE EFFECT =====
  useEffect(() => {
    if (phase === "webcam") {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 600);
      return () => clearTimeout(timer);
    }
  }, [poseIndex, phase]);

  // ===== WEBCAM PHASE: COUNTDOWN AND POSE COMPARISON =====
  useEffect(() => {
    if (phase !== "webcam" || !started || webcamPhaseDone) return;
    setWebcamCountdown(WEBCAM_TIMER);
    let remaining = WEBCAM_TIMER;
    const interval = setInterval(() => {
      remaining--;
      setWebcamCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        setWebcamPhaseDone(true);
        // Pose comparison logic using pose-utils
        let matched = false;
        let similarity = 0;
        try {
          // Get current landmarks from webcam
          const userLandmarks = webcamRef.current?.getCurrentLandmarks?.();
          // Get reference pose landmarks (for now, use poseImages[0] as reference)
          // You may want to store reference landmarks for each pose image
          const referenceLandmarks = webcamRef.current?.getReferenceLandmarks?.(poseImages[0]);
          if (userLandmarks && referenceLandmarks) {
            const result = comparePoses(referenceLandmarks, userLandmarks, { similarityThreshold: MATCH_THRESHOLD });
            matched = result.isMatching;
            similarity = result.similarity;
          }
        } catch (e) {
          matched = false;
        }
        setPoseMatched(matched);
        setSimilarityResults(prev => {
          const updated = [...prev];
          updated[poseIndex] = similarity;
          return updated;
        });
        setSelectedPoses(prev => {
          const updated = [...prev];
          updated[poseIndex] = { filename: poseImages[poseIndex] };
          return updated;
        });

        setTimeout(() => {
          if (matched) {
            setLevel(l => l + 1);
            setPhase("level-complete");
            setShowPhaseDone(false);
            setWebcamPhaseDone(false);
            setPoseMatched(null);
          } else {
            setPhase("gameover");
          }
        }, 1500);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, started, webcamPhaseDone, poseImages, poseIndex]);

  // ===== ----- SUBMIT SCORE TO SUPABASE -----
  const submitScore = async () => {
    if (!playerName.trim()) {
      alert("Please enter your name");
      return;
    }

    setIsSubmittingScore(true);
    try {
      const { error } = await supabase.from("statuesque_scores").insert([
        {
          name: playerName.trim(),
          score: level - 1,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error("Error submitting score:", error.message);
        alert("Failed to submit score. Please try again.");
      } else {
        // Reset the game
        setStarted(false);
        setPhase("idle");
        setLevel(1);
        setPoseIndex(0);
        setPlayerName("");
      }
    } catch (error) {
      console.error("Error submitting score:", error);
      alert("An error occurred while submitting your score.");
    } finally {
      setIsSubmittingScore(false);
    }
  };


  return (
    <div className="statuesque-root">
      <div className="statuesque-container">
        {/* LEFT PANEL: WEBCAM */}
        <div className="statuesque-left-panel">
          <div className="webcam-container">
            <WebcamCapture ref={webcamRef} width="100%" height="100%" />
          </div>
        </div>
        {/* RIGHT PANEL: POSE OR WEBCAM INFO */}
        <div className="statuesque-right-panel">
          {/* SHOW PHASE: Display reference pose image */}
          {started && phase === "show" && poseImages[0] && (
            <div className="pose-display">
              <img
                src={poseImages[0]}
                alt={`Pose 1`}
                className="pose-display-canvas"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
              <div className="pose-info">
                <div className="level-indicator">Level {level}</div>
                <div className="pose-counter">Pose 1 / 1</div>
                <div className="countdown-display">
                  Next in <span className="countdown-number">{countdown}s</span>
                </div>
              </div>
            </div>
          )}

          {/* WEBCAM PHASE: Show current pose index */}
          {started && phase === "webcam" && (
            <div className="webcam-phase-info">
              <div className="level-indicator">Level {level}</div>
                <div className="pose-counter">
                  Pose {poseIndex + 1} / {level}
                </div>
              <div className="countdown-display">
                Time left: <span className="countdown-number">{webcamCountdown}s</span>
              </div>
              {webcamPhaseDone && poseMatched !== null && (
                <div className={poseMatched ? "result-passed" : "result-failed"}>
                  {poseMatched ? "✓ Match! Next level..." : "✗ Not matched. Game Over!"}
                </div>
              )}
            </div>
          )}

          {/* IDLE PHASE: Welcome message */}
          {!started && phase === "idle" && (
            <div className="idle-message">
              <h2>Statuesque</h2>
              <button
                onClick={() => {
                  setStarted(true);
                  setLevel(1);
                  setPoseIndex(0);
                  setPhase("show");
                }}
                disabled={!isWebcamReady}
                className="start-button"
              >
                {isWebcamReady ? "START" : "LOADING CAMERA..."}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* LEVEL COMPLETE MODAL OVERLAY */}
      {phase === "level-complete" && (
        <div className="statuesque-overlay">
          <div className="statuesque-modal">
            <h2>Level {level - 1} Complete!</h2>
            <p>Get ready for Level {level}...</p>
            <div className="countdown-display">
              Starting in <span className="countdown-number">{countdown}s</span>
            </div>
          </div>
        </div>
      )}

      {/* ENDING MODAL OVERLAY */}
          {/* ...existing code... */}

      {/* GAMEOVER MODAL OVERLAY */}
      {phase === "gameover" && (
        <div className="statuesque-overlay">
          <div className="statuesque-modal">
            <h2>Game Over!</h2>
            <img src="/orpheus_gj.png" width="100%"></img>
            <p>You failed to match all poses in Level {level}.</p>
            
            <div className="game-results-container">
              <h3>Score: {level - 1}</h3>
              {selectedPoses.map((pose, idx) => (
                <div key={idx} className="result-item">
                  <div>Pose {idx + 1}</div>
                  <div>Similarity: {((similarityResults[idx] ?? 0) * 100).toFixed(1)}%</div>
                  <div className={(similarityResults[idx] ?? 0) >= MATCH_THRESHOLD ? "result-passed" : "result-failed"}>
                    {(similarityResults[idx] ?? 0) >= MATCH_THRESHOLD ? "✓ Match" : "✗ Failed"}
                  </div>
                </div>
              ))}
            </div>

            <div className="score-submission">
              <input
                type="text"
                placeholder="Enter your name to save score"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isSubmittingScore) {
                    submitScore();
                  }
                }}
                className="player-name-input"
              />
              <div className="modal-button-group">
                <button
                  onClick={submitScore}
                  disabled={isSubmittingScore || !playerName.trim()}
                  className="submit-score-button"
                >
                  {isSubmittingScore ? "SUBMITTING..." : "SUBMIT SCORE"}
                </button>
                <button
                  onClick={() => {
                    setStarted(false);
                    setPhase("idle");
                    setLevel(1);
                    setPoseIndex(0);
                    setPoseSequence([]);
                    setSelectedPoses([]);
                    setSimilarityResults([]);
                    setPlayerName("");
                  }}
                  className="restart-button"
                >
                  Play Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}