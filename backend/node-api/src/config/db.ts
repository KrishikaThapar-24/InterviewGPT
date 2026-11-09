
import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    const databaseName = process.env.MONGODB_DATABASE;

    if (!mongoURI) {
      throw new Error("MONGODB_URI is not configured");
    }

    await mongoose.connect(mongoURI, {
      dbName: databaseName || "interviewgpt",
    });

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};

export default connectDB;
