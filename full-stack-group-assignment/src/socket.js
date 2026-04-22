import { io } from 'socket.io-client'
import { API_ORIGIN } from './config/appConfig'

const socket = API_ORIGIN
  ? io(API_ORIGIN, { autoConnect: true })
  : io({ autoConnect: true })

export default socket