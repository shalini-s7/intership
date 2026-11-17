const mongoose = require('mongoose');

let isConnected = false;

/**
 * Connect to MongoDB Atlas or local MongoDB instance
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('\n======================================================');
    console.warn('⚠️  MONGODB_URI is not defined in your environment (.env).');
    console.warn('👉 To connect to MongoDB Atlas:');
    console.warn('   1. Create a free cluster at https://cloud.mongodb.com');
    console.warn('   2. Copy your connection string into a .env file:');
    console.warn('      MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/taskpulse?retryWrites=true&w=majority');
    console.warn('   Server is running in demo memory mode with full CRUD.');
    console.warn('======================================================\n');
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging
    });

    isConnected = true;
    console.log(`\n✅ MongoDB Atlas Connected: ${conn.connection.host}`);
    console.log(`📂 Database: ${conn.connection.name}\n`);
    return true;
  } catch (error) {
    console.error('\n❌ MongoDB Connection Error:', error.message);
    console.warn('⚠️  Continuing with in-memory store so the server remains active.\n');
    return false;
  }
};

const getIsConnected = () => isConnected;

module.exports = { connectDB, getIsConnected };

