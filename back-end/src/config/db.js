import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri  = "mongodb://s4080210_db_user:Q150605a@ac-qhltacc-shard-00-00.ktbf2ja.mongodb.net:27017,ac-qhltacc-shard-00-01.ktbf2ja.mongodb.net:27017,ac-qhltacc-shard-00-02.ktbf2ja.mongodb.net:27017/?ssl=true&replicaSet=atlas-hzotir-shard-0&authSource=admin&appName=demodb";
export async function connectToDatabase() {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}