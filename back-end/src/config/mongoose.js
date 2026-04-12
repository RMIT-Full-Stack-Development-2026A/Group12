// Module: User Profile
// Layer: Config
// Feature: Edit Profile (Requirement 3.1.1, 3.2.1)

const mongoose = require('mongoose');

async function connectMongoose() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is required');
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  await mongoose.connect(uri);
  return mongoose.connection;
}

module.exports = {
  connectMongoose
};
