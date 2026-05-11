import CreateRoomForm from '../components/CreateRoomForm'

function CreateRoomPage({ currentUser, onRequireLogin, onExitToMenu, initialJoinCode, onInitialJoinCodeConsumed }) {
  return (
    <div style={styles.page}>
      <CreateRoomForm
        currentUser={currentUser}
        onRequireLogin={onRequireLogin}
        onExitToMenu={onExitToMenu}
        initialJoinCode={initialJoinCode}
        onInitialJoinCodeConsumed={onInitialJoinCodeConsumed}
      />
    </div>
  )
}

const styles = {
  page: {
    padding: 18,
  },
}

export default CreateRoomPage