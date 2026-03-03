import { useEffect, useRef, useState } from "react";
import { WebcamCapture, type WebcamCaptureHandle } from "../../pose-detection/WebcamCapture";
import { supabase } from "../../lib/supabase";
import { getPoseLandmarks } from "../../pose-utils/extractPoseData";
import { comparePoses } from "../../pose-utils/comparePoses";

const MATCH_THRESHOLD = 0.45;
const COUNTDOWN_LEN = 4;
const BETWEEN_LEVEL = 3;
const WEBCAM_TIMER = 3; 

export default function PoseGame({ poseImages }: { poseImages: string[] }) {
  const [started, setStarted] = useState(false);
  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState<"idle" | "show" | "webcam" | "ending" | "gameover" | "level-complete">("idle");
  const [poseIndex, setPoseIndex] = useState(0);
  const [countdown, setCountdown] = useState(COUNTDOWN_LEN);
  const [isPulsing, setIsPulsing] = useState(false);
  const [isWebcamReady, setIsWebcamReady] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [showPhaseDone, setShowPhaseDone] = useState(false);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [showScoreNotification, setShowScoreNotification] = useState(false);
  const webcamRef = useRef<WebcamCaptureHandle>(null);

  // Add webcam phase timer 
  const [webcamCountdown, setWebcamCountdown] = useState(WEBCAM_TIMER);
  const [webcamPhaseDone, setWebcamPhaseDone] = useState(false);

  // Add pose comparison 
  const [poseMatched, setPoseMatched] = useState<null | boolean>(null);

  // Add missing states 
  const [selectedPoses, setSelectedPoses] = useState<any[]>([]);
  const [similarityResults, setSimilarityResults] = useState<number[]>([]);

  const [currentLevelPoses, setCurrentLevelPoses] = useState<string[]>([]);

  function startLevel(newLevel: number) {
    const shuffled = [...poseImages].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, newLevel);
    console.log("Selected poses for level", newLevel, ":", selected);
    setCurrentLevelPoses(selected);
    setPoseIndex(0);
    setLevel(newLevel);
    setPhase("show");
    setShowPhaseDone(false);
    setWebcamPhaseDone(false);
    setPoseMatched(null);
  }

  // Initialize webcam 
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

  // countdown timer for show phase
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

  // level complete countdown
  useEffect(() => {
    if (phase !== "level-complete") return;
    setCountdown(BETWEEN_LEVEL);
    let remaining = BETWEEN_LEVEL;
    const interval = setInterval(() => {
      remaining--;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        startLevel(level + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // pose index change
  useEffect(() => {
    if (phase === "webcam") {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 600);
      return () => clearTimeout(timer);
    }
  }, [poseIndex, phase]);

  // countdown and pose comparison
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
        (async () => {
          let matched = false;
          let similarity = 0;
          try {
            // Get current landmarks from webcam
            const userLandmarks = webcamRef.current?.getCurrentLandmarks?.();
            const referenceLandmarks = await getPoseLandmarks(currentLevelPoses[poseIndex]);
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
            updated[poseIndex] = { filename: currentLevelPoses[poseIndex] };
            return updated;
          });

          setTimeout(() => {
            if (matched) { 
              if (poseIndex + 1 < currentLevelPoses.length) {
                setPoseIndex(poseIndex + 1);
                setPhase("show");
                setShowPhaseDone(false);
                setWebcamPhaseDone(false);
                setPoseMatched(null);
              }
              else {
                setPhase("level-complete");
                setTimeout(() => {
                  startLevel(level + 1);
                }, BETWEEN_LEVEL * 1000);
              }
            } else {
              setPhase("gameover");
            }
          }, 1500);
        })();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, started, webcamPhaseDone, poseImages, poseIndex]);

  // add score to supabase
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
        // Show notification and reset game
        setShowScoreNotification(true);
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
      {/* Score Saved Notification Popup */}
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
      <div className="statuesque-container">
        {/* webcam panel */}
        <div className="statuesque-left-panel">
          <div className="webcam-container">
            <WebcamCapture ref={webcamRef} width="100%" height="100%" />
          </div>
        </div>
        {/* pose info panel */}
        <div className="statuesque-right-panel">
          {/* display reference pose image */}
          {started && phase === "show" && currentLevelPoses[poseIndex] && (
            <div className="pose-display">
              <img
                src={currentLevelPoses[poseIndex]}
                alt={`Pose ${poseIndex + 1}`}
                className="pose-display-canvas"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
              <div className="pose-info">
                <div className="level-indicator">Level {level}</div>
                <div className="pose-counter">Pose {poseIndex + 1} / {level}</div>
                <div className="countdown-display">
                  Next in <span className="countdown-number">{countdown}s</span>
                </div>
              </div>
            </div>
          )}

          {/* show current pose index */}
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

          {/* welcome message */}
          {!started && phase === "idle" && (
            <div className="idle-message">
              <h2>Statuesque</h2>
              <button
                onClick={() => {
                  setStarted(true);
                  startLevel(1);
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

      {/* level complete overlay */}
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

      {/* gameover modal overlay */}
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
