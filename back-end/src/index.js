const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectToDatabase = require('./config/db');
const authRouter = require('./router/authRouter');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'API is running' });
});

app.use('/api/auth', authRouter);

function startServer() {
  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
}

connectToDatabase()
  .then(startServer)
  .catch((error) => {
    console.error('Unable to start server:', error.message);
    process.exit(1);
  });
