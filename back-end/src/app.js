// Module: User Profile
// Layer: App
// Feature: Edit Profile (Requirement 3.1.1, 3.2.1)

const express = require('express');
const path = require('path');
const userRouter = require('./modules/user/user.route');

const app = express();

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/api/user', userRouter);

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

module.exports = app;
