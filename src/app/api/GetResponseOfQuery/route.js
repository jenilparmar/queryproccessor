import { MongoClient } from "mongodb";
import { getResponseFromGEMINI } from "./getGeminiResponse";

export async function POST(req) {
    let client;

    try {
        const { query, dbname, uri } = await req.json();

        if (!query || !dbname || !uri) {
            return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
        }

        client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        const database = client.db(dbname);

        // Step 1: Get all collection names in the database
        const collections = await database.listCollections().toArray();
        const collectionNames = collections.map(col => col.name);

        if (collectionNames.length === 0) {
            return new Response(JSON.stringify({ error: "No collections found in database" }), { status: 404 });
        }

        // Step 2: Fetch sample data from each collection
        let schemas = {};
        for (const colName of collectionNames) {
            const collection = database.collection(colName);
            const sampleData = await collection.findOne();
            if (sampleData) {
                schemas[colName] = sampleData;
            }
        }

        if (Object.keys(schemas).length === 0) {
            return new Response(JSON.stringify({ error: "No valid data found in collections" }), { status: 404 });
        }

        // Step 3: Get MongoDB query from Gemini (passing all schemas)
        const responseFromGemini = await getResponseFromGEMINI(query, schemas);

        if (!responseFromGemini) {
            throw new Error("Invalid query from Gemini");
        }

        let dataToSend;

        // Step 4: Determine if the query is an aggregation or a standard find query
        if (Array.isArray(responseFromGemini)) {
            // If it's an aggregation pipeline, execute it
            dataToSend = await database.collection(collectionNames[0]).aggregate(responseFromGemini).toArray();
        } else {
            // Otherwise, execute a find() query
            dataToSend = await database.collection(collectionNames[0]).find(responseFromGemini).toArray();
        }

        return new Response(JSON.stringify(dataToSend), { status: 200 });
    } catch (error) {
        console.error("Query Error:", error);
        return new Response(JSON.stringify({ error: error.message || "Something went wrong!" }), { status: 500 });
    } finally {
        if (client) {
            await client.close();
        }
    }
}
