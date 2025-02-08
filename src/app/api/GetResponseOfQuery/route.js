import { MongoClient } from "mongodb";
import { getResponseFromGEMINI } from "./getGeminiResponse";

export async function POST(req) {
  let client;

  try {
    const { query, dbname, colName, uri } = await req.json();

    if (!query || !dbname || !colName || !uri) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    // Initialize MongoDB client
    client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    await client.connect();
    const database = client.db(dbname);
    const collection = database.collection(colName);
    const sampleData = await collection.findOne();
    // Get MongoDB query from Gemini
    const responseFromGemini = await getResponseFromGEMINI(query , sampleData);
    if (!responseFromGemini) {
      throw new Error("Invalid query from Gemini");
    }

    // Execute MongoDB query
    const dataToSend = await collection.find(responseFromGemini).toArray();

    return new Response(JSON.stringify(dataToSend), { status: 200 });
  } catch (error) {
    console.error("Query Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Something went wrong!" }), { status: 500 });
  } finally {
    if (client) {
      await client.close(); // Ensure client closes properly
    }
  }
}
