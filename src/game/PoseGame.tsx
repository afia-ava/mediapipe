import { useState } from 'react'

interface PoseGameProps {
  onScoreUpdate?: (score: number) => void
}

function PoseGame({ onScoreUpdate }: PoseGameProps) {
  const [score, setScore] = useState(0)
  const [gameActive, setGameActive] = useState(false)

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
      <h2>Game</h2>
      <div style={{ marginBottom: '20px' }}>
        <p>Score: {score}</p>
        {!gameActive ? (
          <button onClick={startGame}>Start Game</button>
        ) : (
          <button onClick={stopGame}>Stop Game</button>
        )}
      </div>
    </div>
  )
}

export default PoseGame
