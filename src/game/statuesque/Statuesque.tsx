import { useState } from "react";
import PoseGame from "./PoseGame";
import { Leaderboard } from "./Leaderboard"; 
import "./GamePage.css";

import intro1 from "./assets/intro1.png";
import intro2 from "./assets/intro2.png";
import intro3 from "./assets/intro3.png";

import pose1 from "./assets/pose1.jpg";
import pose2 from "./assets/pose2.jpg";
import pose3 from "./assets/pose3.jpg";
import pose4 from "./assets/pose4.jpg";
import pose5 from "./assets/pose5.jpg";
import pose6 from "./assets/pose6.jpg";
import pose7 from "./assets/pose7.jpg";

export default function GamePage() {
  const [showIntro, setShowIntro] = useState(true);
  const INTRO_SLIDES = [intro1, intro2, intro3];
  const [slideIndex, setSlideIndex] = useState(0);

  const POSE_IMAGES = [pose1, pose2, pose3, pose4, pose5, pose6, pose7];
  return (
    <div className="game-page">
      {showIntro && (
        <div className="intro-overlay" role="dialog" aria-modal="true">
          <button
            className="intro-close"
            aria-label="Close intro"
            onClick={() => setShowIntro(false)}
          >
            ×
          </button>

          <div className="intro-content">
            <img src={INTRO_SLIDES[slideIndex]} alt={`Intro ${slideIndex+1}`} className="intro-image" />
            <div className="intro-actions">
              {slideIndex < INTRO_SLIDES.length - 1 ? (
                <button
                  className="intro-next"
                  onClick={() => setSlideIndex((s) => Math.min(s + 1, INTRO_SLIDES.length - 1))}
                >
                  Next
                </button>
              ) : (
                <button
                  className="intro-next intro-start"
                  onClick={() => setShowIntro(false)}
                >
                  Start
                </button>
              )}
            </div> 
          </div> 
        </div> 
      )} 

      <main className="game-main">
        <section className="left">
          <div className="detector-area">
            <div className="central-box">
              <PoseGame />
            </div>
            <Leaderboard />
          </div>
        </section>
      </main>
    </div>
  );
}

