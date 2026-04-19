import CreateRoomForm from '../components/CreateRoomForm'

function CreateRoomPage({ currentUser }) {
  return (
    <div style={styles.page}>
      <CreateRoomForm currentUser={currentUser} />
    </div>
  )
}

const styles = {
  page: {
    padding: 18,
  },
}

export default CreateRoomPage