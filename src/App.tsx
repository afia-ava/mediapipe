import { BrowserRouter, Route, Routes } from 'react-router-dom'
import HomePage from './page/HomePage'
import Statuesque from './game/statuesque/Statuesque'
import FlappyBird from './game/flappy-bird/FlappyBird'
import PongGame from './game/pong/GamePage'


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />}></Route>
        <Route path="/statuesque" element={<Statuesque />}></Route>
        <Route path="/flappy-bird" element={<FlappyBird />}></Route>
        <Route path="/pong" element={<PongGame />}></Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

