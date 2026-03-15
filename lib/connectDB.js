import mongoose from "mongoose";

const connectDB = async () => {
  try {
    if (!process.env.MONGO) {
      console.error("❌ MONGO env variable is not set");
      return;
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO);
    console.log("✅ MongoDB is connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    throw err; // rethrow so start() can fail
  }
};

export default connectDB;