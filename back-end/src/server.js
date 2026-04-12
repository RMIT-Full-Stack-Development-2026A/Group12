// Module: User Profile
// Layer: Server
// Feature: Edit Profile (Requirement 3.1.1, 3.2.1)

require('dotenv').config();
const app = require('./app');
const { connectMongoose } = require('./config/mongoose');

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    await connectMongoose();
    app.listen(PORT);
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
}

bootstrap();
