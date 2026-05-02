import CreateRoomForm from '../components/CreateRoomForm'

function CreateRoomPage({ currentUser, onRequireLogin, initialJoinCode, onInitialJoinCodeConsumed }) {
  return (
    <div style={styles.page}>
      <CreateRoomForm
        currentUser={currentUser}
        onRequireLogin={onRequireLogin}
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