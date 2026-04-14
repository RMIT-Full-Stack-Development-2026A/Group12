const app = require('./app');
const connectToDatabase = require('./config/db');

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    await connectToDatabase();
    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error.message);
    process.exit(1);
  }
}

bootstrap();
