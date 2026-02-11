import { useState } from 'react'
import PoseGame from '../game/PoseGame'
import Leaderboard from '../game/Leaderboard'

function GamePage() {
  const [currentScore, setCurrentScore] = useState(0)

  const handleScoreUpdate = (score: number) => {
    setCurrentScore(score)
    // TODO: Submit score to Supabase
  }

  return (
    <div style={{ padding: '20px', color: 'white' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>Games</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '8px' }}>
          <PoseGame onScoreUpdate={handleScoreUpdate} />
        </div>
        <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '8px' }}>
          <Leaderboard />
        </div>
      </div>
    </div>
  )
}

export default GamePage
