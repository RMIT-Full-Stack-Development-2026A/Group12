import CreateRoomForm from '../components/CreateRoomForm'

function CreateRoomPage({ currentUser, onRequireLogin, onExitToMenu, initialJoinCode, onInitialJoinCodeConsumed, resumeEntry, onResumeEntryConsumed, onGameStatusChange }) {
  return (
    <div style={styles.page}>
      <CreateRoomForm
        currentUser={currentUser}
        onRequireLogin={onRequireLogin}
        onExitToMenu={onExitToMenu}
        initialJoinCode={initialJoinCode}
        onInitialJoinCodeConsumed={onInitialJoinCodeConsumed}
        resumeEntry={resumeEntry}
        onResumeEntryConsumed={onResumeEntryConsumed}
        onGameStatusChange={onGameStatusChange}
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