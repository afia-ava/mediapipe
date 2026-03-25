import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { WebcamCapture, type WebcamCaptureHandle } from "../../pose-detection/WebcamCapture";
import { supabase } from "../../lib/supabase";
import { extractAllPosesFromAssets, getPoseLandmarks } from "../../pose-utils/extractPoseData";
import { comparePoses, type Landmark } from "../../pose-utils/comparePoses";

const MATCH_THRESHOLD = 0.5;
const COUNTDOWN_LEN = 4;
const BETWEEN_LEVEL = 3;
const WEBCAM_TIMER = 3; 

const LEFT_RIGHT_LANDMARK_PAIRS: Array<[number, number]> = [
  [1, 4], [2, 5], [3, 6], [7, 8], [9, 10],
  [11, 12], [13, 14], [15, 16], [17, 18], [19, 20], [21, 22],
  [23, 24], [25, 26], [27, 28], [29, 30], [31, 32]
];

function mirrorLandmarksForFrontCamera(landmarks: Landmark[]): Landmark[] {
  const mirrored = landmarks.map((lm) => ({ ...lm, x: 1 - lm.x }));

  for (const [leftIdx, rightIdx] of LEFT_RIGHT_LANDMARK_PAIRS) {
    const left = mirrored[leftIdx];
    const right = mirrored[rightIdx];
    if (!left || !right) continue;
    mirrored[leftIdx] = right;
    mirrored[rightIdx] = left;
  }

  return mirrored;
}

export default function PoseGame({ poseImages }: { poseImages: string[] }) {
  const [started, setStarted] = useState(false);
  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState<"idle" | "show" | "webcam" | "ending" | "gameover" | "level-complete">("idle");
  const [poseIndex, setPoseIndex] = useState(0);
  const [countdown, setCountdown] = useState(COUNTDOWN_LEN);
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
    setCurrentLevelPoses((previousPoses) => {
      if (newLevel <= 1 || previousPoses.length === 0) {
        const firstPose = poseImages[Math.floor(Math.random() * poseImages.length)];
        return firstPose ? [firstPose] : [];
      }

      const remainingPoses = poseImages.filter((pose) => !previousPoses.includes(pose));
      const sourcePool = remainingPoses.length > 0 ? remainingPoses : poseImages;
      const nextPose = sourcePool[Math.floor(Math.random() * sourcePool.length)];

      if (!nextPose) {
        return previousPoses;
      }

      return [...previousPoses, nextPose];
    });
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

  // Warm the pose landmark cache so first comparisons do not fail with 0%.
  useEffect(() => {
    extractAllPosesFromAssets().catch((error) => {
      console.warn("Pose cache warm-up failed; on-demand extraction will be used.", error);
    });
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
              const comparisonOptions = {
                similarityThreshold: MATCH_THRESHOLD,
                useAngles: true,
                angleWeight: 0.45,
                perLimbNormalization: true,
              };

              const normalResult = comparePoses(referenceLandmarks, userLandmarks, comparisonOptions);
              const mirroredResult = comparePoses(
                referenceLandmarks,
                mirrorLandmarksForFrontCamera(userLandmarks),
                comparisonOptions
              );
              const bestResult = normalResult.similarity >= mirroredResult.similarity ? normalResult : mirroredResult;
              matched = bestResult.isMatching;
              similarity = bestResult.similarity;
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
                setWebcamPhaseDone(false);
                setWebcamCountdown(WEBCAM_TIMER);
                setPoseMatched(null);
              }
              else {
                setPhase("level-complete");
              }
            } else {
              setPhase("gameover");
            }
          }, 1500);
        })();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, started, webcamPhaseDone, poseIndex, currentLevelPoses]);

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
          {started && phase === "show" && currentLevelPoses[currentLevelPoses.length - 1] && (
            <div className="pose-display">
              <img
                src={currentLevelPoses[currentLevelPoses.length - 1]}
                alt={`Pose ${level}`}
                className="pose-display-canvas"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
              <div className="pose-info">
                <div className="level-indicator">Level {level}</div>
                <div className="pose-counter">Memorize new pose ({level})</div>
                <div className="countdown-display">
                  Next in <span className="countdown-number">{countdown}s</span>
                </div>
              </div>
            </div>
          )}

          {/* show current pose index */}
          {started && phase === "webcam" && (
            <>
              <div className="pose-step-overlay" aria-hidden="true">
                <span>{poseIndex + 1}</span>
              </div>
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
                    {poseMatched
                      ? poseIndex + 1 < currentLevelPoses.length
                        ? "✓ Match! Next pose..."
                        : "✓ Match! Next level..."
                      : "✗ Not matched. Game Over!"}
                  </div>
                )}
              </div>
            </>
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
              <Link to="/" className="start-button">BACK TO MENU</Link>
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
            <p>You failed to match all poses in Level {level}.</p>
            
            <div className="game-results-container">
              <h3>Score: {level - 1}</h3>
              {selectedPoses.map((_, idx) => (
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
                    setCurrentLevelPoses([]);
                    setSelectedPoses([]);
                    setSimilarityResults([]);
                    setPlayerName("");
                  }}
                  className="restart-button"
                >
                  Play Again
                  </button>
                  <button
                    onClick={() => { window.location.href = '/'; }}
                    className="restart-button"
                    style={{ marginTop: '0.5rem' }}
                  >
                    Main Menu
                  </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
