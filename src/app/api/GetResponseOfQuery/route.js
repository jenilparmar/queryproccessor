import { MongoClient } from "mongodb";
import { getResponseFromGEMINI } from "./getGeminiResponse";

export async function POST(req) {
    let client;

    try {
        const { query, dbname, uri } = await req.json();
        console.log("Received request:", query);

        if (!query || !dbname || !uri) {
            return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
        }

        client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        const database = client.db(dbname);
        console.log("Connected to database:", dbname);

        // Step 1: Get all collection names
        const collections = await database.listCollections().toArray();
        const collectionNames = collections.map(col => col.name);

        if (collectionNames.length === 0) {
            return new Response(JSON.stringify({ error: "No collections found in database" }), { status: 404 });
        }
        console.log("Collections found:", collectionNames);

        // Step 2: Fetch sample schema for each collection
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

        // Step 3: Send collection names and schemas to Gemini for a better response
        const geminiResponse = await getResponseFromGEMINI(query, schemas, collectionNames);
        console.log("Gemini Response:", geminiResponse);

        if (!geminiResponse || !geminiResponse.collections || !geminiResponse.query) {
            throw new Error("Invalid query generated by Gemini");
        }

        const { collections: targetCollections, query: mongoQuery } = geminiResponse;
        let results = [];

        console.log("Collections to query:", targetCollections);
        console.log("MongoDB Query:", mongoQuery);

        // Step 4: Execute the query on the collections Gemini provided
        for (const col of targetCollections) {
            try {
                const collection = database.collection(col);
                let data;
            
                if (Array.isArray(mongoQuery)) {
                    // Aggregation query with timeout
                    data = await collection.aggregate(mongoQuery, { maxTimeMS: 60000 }).toArray();
                } else {
                    // Find query with a limit to avoid excessive data
                    data = await collection.find(mongoQuery).limit(1000).toArray();
                }
            
                if (data.length) results.push({ collection: col, data });
            } catch (err) {
                console.error(`Query error in collection ${col}:`, err);
            }
            
        }

        return new Response(JSON.stringify(results), { status: 200 });
    } catch (error) {
        console.error("Query Execution Error:", error);
        return new Response(JSON.stringify({ error: error.message || "Something went wrong!" }), { status: 500 });
    } finally {
        if (client) {
            await client.close();
        }
    }
}
