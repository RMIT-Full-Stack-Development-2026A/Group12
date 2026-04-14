const connectToDatabase = require('./db');

async function connectMongoose() {
  return connectToDatabase();
}

module.exports = {
  connectMongoose
};
