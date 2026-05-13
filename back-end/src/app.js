const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const userRouter = require('./modules/user/user.route');
const adminRouter = require('./router/adminRouter');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'API is running' });
});

const authRouterPath = path.join(__dirname, 'router', 'authRouter.js');
if (fs.existsSync(authRouterPath)) {
  // Optional mount for teammate login/register branch.
  const authRouter = require('./router/authRouter');
  app.use('/api/auth', authRouter);
}

app.use('/api/user', userRouter);
app.use('/api/admin', adminRouter);

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

module.exports = app;
