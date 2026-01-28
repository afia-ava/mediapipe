import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

export interface LeaderboardEntry {
  id: string
  player_name: string
  score: number
  created_at: string
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order('score', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching leaderboard:', error)
    return []
  }

  return data || []
}

export async function addScore(playerName: string, score: number) {
  const { error } = await supabase
    .from('leaderboard')
    .insert([{ player_name: playerName, score }])

  if (error) {
    console.error('Error adding score:', error)
    throw error
  }
}
