# Group12 Full-Stack Tic-Tac-Toe

Welcome to our Tic-Tac-Toe application, a real-time multiplayer platform featuring WebSocket for online matchmaking, a stimulate payment flow using ngrok for premium features, a secure user authentication and an Admin Dashboard.

# How to run our project locally

1. Prerequisites: make sure you have [Node.js](https://nodejs.org/en) installed in your machine and [MongoDB](https://www.mongodb.com) database running locally or in the MongoDB Atlas application. You will also need to have [ngrok](https://ngrok.com) installed and set up with your own domain.

2. Installation: first you need to clone the repository and install all the neccessary dependencies for both frontend and backend.

```bash
# Install backend dependencies:
cd back-end
npm install

# Install frontend dependencies:
cd full-stack-group-assignment
npm install

# Set up ngrok
Follow the set up instruction on the website 
After that open ngrok and type: ngrok http 5000 --domain=http://your-ngrok-domain
```

3. Environment Variables

Navigate to the back-end folder and create a .env file based on our provided .env.example:

```bash
MONGO_URI=your-MongoDB-connection-string
PORT=5000
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=20m
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
BASE_URL=https://your-ngrok-domain
FRONTEND_LOCAL_BASE_URL=http://localhost:5173
```

4. Start the server

You will need to open two terminal running simultaneously.

```bash
# Terminal 1: Start the backend server
cd back-end
npm start

# Terminal 2: Start the frontedn server
cd full-stack-group-assignment
npm run dev
```

5. How to test our multiplayer online matchmaking

You will need to open two brower, one primary brower and the other using incognito mode.

On both browser log in using different accounts.

On one account select the Play button and create a room with game mode "Online".

Using the other account, navigate to the Arena page and the room that has just been created will appear there.

Click "Join Room" and you will be moved into it and just need to wait for the host to start the game.
