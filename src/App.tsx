import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingView from './views/LandingView'
import JoinView from './views/JoinView'
import AdminView from './views/AdminView'
import PlayerView from './views/PlayerView'
import ThemeToggle from './components/ThemeToggle'

export default function App() {
  return (
    <BrowserRouter>
      <ThemeToggle />
      <Routes>
        <Route path="/" element={<LandingView />} />
        <Route path="/join/:code?" element={<JoinView />} />
        <Route path="/admin/:code" element={<AdminView />} />
        <Route path="/play/:code" element={<PlayerView />} />
      </Routes>
    </BrowserRouter>
  )
}
