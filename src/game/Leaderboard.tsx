import { useState, useEffect } from 'react'
import { getLeaderboard, type LeaderboardEntry } from '../lib/supabase'

function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeaderboard()
  }, [])

  const loadLeaderboard = async () => {
    setLoading(true)
    const data = await getLeaderboard()
    setEntries(data)
    setLoading(false)
  }

  if (loading) {
    return <div>Loading leaderboard...</div>
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Leaderboard</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '10px' }}>Rank</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Player</th>
            <th style={{ textAlign: 'right', padding: '10px' }}>Score</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => (
            <tr key={entry.id}>
              <td style={{ padding: '10px' }}>{index + 1}</td>
              <td style={{ padding: '10px' }}>{entry.player_name}</td>
              <td style={{ textAlign: 'right', padding: '10px' }}>{entry.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Leaderboard
