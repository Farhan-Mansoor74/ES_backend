import { MongoClient } from "mongodb";

// MongoDB Atlas Connection URL
const url = 'mongodb+srv://farhanmansoordxb:farhan8431@cluster0.tb5vm.mongodb.net/'; 
const dbName = 'EcoShop'; 

async function connectDB() {
  const client = new MongoClient(url);

  try {
    // Asynchronous connection to database
    await client.connect();
    const database = client.db(dbName);
    return { client, database };
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

export default connectDB;