import { useState } from 'react'
import Webcam from '../pose-detection/Webcam'
import type { PoseDetectionResult } from '../pose-detection/types'

interface PoseGameProps {
  onScoreUpdate?: (score: number) => void
}

function PoseGame({ onScoreUpdate }: PoseGameProps) {
  const [score, setScore] = useState(0)
  const [gameActive, setGameActive] = useState(false)

  const handlePoseDetected = (result: PoseDetectionResult) => {
    // TODO: Implement your game logic here
    console.log('Pose detected:', result)
    
    // Example: Update score based on your game rules
    // setScore(prevScore => prevScore + points)
  }

  const startGame = () => {
    setGameActive(true)
    setScore(0)
  }

  const stopGame = () => {
    setGameActive(false)
    if (onScoreUpdate) {
      onScoreUpdate(score)
    }
  }

  return (
    <div>
      <h2>Pose Detection Game</h2>
      <div style={{ marginBottom: '20px' }}>
        <p>Score: {score}</p>
        {!gameActive ? (
          <button onClick={startGame}>Start Game</button>
        ) : (
          <button onClick={stopGame}>Stop Game</button>
        )}
      </div>
      
      {gameActive && (
        <Webcam
          onPoseDetected={handlePoseDetected}
          width={640}
          height={480}
        />
      )}
    </div>
  )
}

export default PoseGame
