import { MongoClient } from "mongodb";

export async function POST(req) {
  try {
    const { mongodbUri } = await req.json();

    if (!mongodbUri) {
      return Response.json({ error: "MongoDB URI is required" }, { status: 400 });
    }

    const client = new MongoClient(mongodbUri);
    await client.connect();

    const adminDb = client.db().admin();
    const databases = await adminDb.listDatabases();

    const result = [];

    for (const dbInfo of databases.databases) {
      const dbName = dbInfo.name;
      const db = client.db(dbName);
      const collections = await db.listCollections().toArray();
      result.push({
        database: dbName,
        collections: collections.map(col => col.name),
      });
    }

    await client.close();

    return Response.json({ databases: result }, { status: 200 });
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    return Response.json({ error: "Failed to fetch database info" }, { status: 500 });
  }
}
