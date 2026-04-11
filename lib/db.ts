import mongoose from "mongoose";

// Get MongoDB connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI!;

// Validate that MONGODB_URI is defined
if (!MONGODB_URI) {
  throw new Error("❌ Please define the MONGODB_URI environment variable inside .env.local");
}

/**
 * Interface for caching MongoDB connection
 * This prevents creating multiple connections in development
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

/**
 * Extend global namespace to include mongoose cache
 * This is needed for hot-reload in Next.js development
 */
declare global {
  var mongoose: MongooseCache | undefined;
}

/**
 * Initialize the cache
 * Use global cache in development to persist across hot reloads
 */
let cached: MongooseCache = globalThis.mongoose || {
  conn: null,
  promise: null,
};


// Store cache in global object
if (!cached) {
  cached = (globalThis as unknown as { mongoose: MongooseCache }).mongoose = { conn: null, promise: null };
}

/**
 * Main function to connect to MongoDB
 * This is your Database Context
 * 
 * Usage in API routes:
 * import { connectDB } from '@/lib/db';
 * await connectDB();
 */
export async function connectDB() {
  // If we already have a connection, reuse it
  if (cached.conn) {
    console.log('✅ Using existing MongoDB connection');
    return cached.conn;
  }

  // If no promise exists, create a new connection
  if (!cached.promise) {
    const opts = {
      bufferCommands: true, // Disable buffering
      maxPoolSize: 10, // Max number of connections in the pool
      serverSelectionTimeoutMS: 5000, // Timeout if can't connect in 5 seconds
      socketTimeoutMS: 45000, // Close inactive connections after 45 seconds
      dbName: process.env.dbName,
    };

    console.log('🔄 Creating new MongoDB connection...');

    // Create the connection promise
    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('✅ MongoDB connected successfully to:', mongoose.connection.name);
        return mongoose;
      })
      .catch((error) => {
        console.error('❌ MongoDB connection error:', error.message);
        // Clear the promise so next attempt will try again
        cached.promise = null;
        throw error;
      });
  }

  try {
    // Wait for the connection to complete
    cached.conn = await cached.promise;
  } catch (error) {
    // If connection fails, clear the promise
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

/**
 * Disconnect from MongoDB
 * Usually not needed in serverless, but useful for cleanup
 */
export async function disconnectDB() {
  if (!cached.conn) {
    return;
  }

  try {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    console.log('✅ MongoDB disconnected successfully');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
    throw error;
  }
}

/**
 * Check if currently connected to MongoDB
 * Returns true if connected, false otherwise
 */
export function isConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

/**
 * Get the current connection status as a string
 * Possible values: 'disconnected', 'connected', 'connecting', 'disconnecting'
 */
export function getConnectionStatus(): string {
  const states: { [key: number]: string } = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState] || 'unknown';
}

/**
 * Get database name
 */
export function getDatabaseName(): string {
  return mongoose.connection.name || 'not connected';
}

// ============================================
// Connection Event Listeners
// ============================================

mongoose.connection.on('connected', () => {
  console.log('🟢 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('🔴 Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('🟡 Mongoose disconnected from MongoDB');
});

// Handle application termination gracefully
if (process.env.NODE_ENV !== 'production') {
  process.on('SIGINT', async () => {
    console.log('\n⚠️  Application terminating, closing MongoDB connection...');
    await disconnectDB();
    process.exit(0);
  });
}

export default connectDB;