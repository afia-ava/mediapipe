import { BrowserRouter, Route, Routes } from 'react-router-dom'
import HomePage from './page/HomePage'
import Statuesque from './game/statuesque/Statuesque'
// import PoseGame from './game/statuesque/PoseGame'
// import FlappyBird from './game/flappy-bird/FlappyBird'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />}></Route>
        <Route path="/statuesque" element={<Statuesque />}></Route>
        {/* <Route path="/pose-game" element={<PoseGame />}></Route>
        <Route path="/flappy-bird" element={<FlappyBird />}></Route> */}
      </Routes>
    </BrowserRouter>
  )
}

export default App

