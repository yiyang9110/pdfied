import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) throw new Error("Please defined MONGODB_URI env");

// reuse connect for development, as Nextjs hotreload will keep reloading
// connect on global so nodejs process wont be cleared and could be reused
declare global {
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

const cached =
  global.mongooseCache ||
  (global.mongooseCache = { conn: null, promise: null });

export const connectToDatabase = async () => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });

    try {
      cached.conn = await cached.promise;
      console.info("Connected to MongoDB");
    } catch (error) {
      cached.promise = null;
      console.error("mongodb error");
      throw error;
    }
  }

  return cached.conn;
};
