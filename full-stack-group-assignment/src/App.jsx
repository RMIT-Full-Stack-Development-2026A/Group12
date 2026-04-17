import { useState } from 'react'
import AuthForm from './design/AuthForm'
import CreateRoomPage from './pages/CreateRoomPage'

function App() {
  const [currentUser, setCurrentUser] = useState(null)

  return currentUser ? (
    <CreateRoomPage currentUser={currentUser} />
  ) : (
    <AuthForm onLoginSuccess={setCurrentUser} />
  )
}

export default App