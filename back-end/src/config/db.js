const mongoose = require('mongoose');
require('dotenv').config();

async function connectToDatabase() {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        throw new Error('MONGO_URI is not defined in environment variables');
    }

    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    return mongoose.connection;
}

module.exports = connectToDatabase;
