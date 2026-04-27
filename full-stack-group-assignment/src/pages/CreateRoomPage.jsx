import CreateRoomForm from '../components/CreateRoomForm'

function CreateRoomPage({ currentUser, onRequireLogin }) {
  return (
    <div style={styles.page}>
      <CreateRoomForm currentUser={currentUser} onRequireLogin={onRequireLogin} />
    </div>
  )
}

const styles = {
  page: {
    padding: 18,
  },
}

export default CreateRoomPage