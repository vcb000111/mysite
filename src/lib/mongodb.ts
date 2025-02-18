import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is missing');
}

export async function connectToDatabase() {
  try {
    if (mongoose.connection.readyState >= 1) {
      return { db: mongoose.connection.db! };
    }

    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return { db: conn.connection.db! };
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
} 