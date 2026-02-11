function App() {
  return (
    <div style={{ 
        backgroundImage: "url('/bg.jpg')",
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        padding: '20px',
        color: '#fff',
     }}>
import { useState } from 'react'
import GamePage from './page/GamePage'

function App() {
  const [showGame, setShowGame] = useState(false)

  return (
    <div
      style={{
        backgroundImage: "url('/bg.jpg')",
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        padding: '20px',
        color: '#fff',
      }}
    >
      {showGame ? (
        <GamePage />
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
          <button
            onClick={() => setShowGame(true)}
            style={{
              background: '#1a1a1a',
              color: '#fff',
              border: '1px solid #333',
              borderRadius: '6px',
              padding: '12px 20px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Go to Pose Game
          </button>
        </div>
      )}
    </div>
  )
}

export default App
export default App