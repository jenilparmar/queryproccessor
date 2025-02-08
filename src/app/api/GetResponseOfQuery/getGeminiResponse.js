const { GoogleGenerativeAI } = require("@google/generative-ai");

async function getResponseFromGEMINI(query, sampleData) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
    You are an expert in MongoDB query generation. Convert the following **natural language query** into a **valid JSON object** for MongoDB's \`find()\` operation. 

    ### **Guidelines:**
    - Analyze the query and infer the correct **keys and values** based on the provided **sample data schema**.
    - Use **exact matches** for direct queries (e.g., "name is John" → \`{ "name": "John" }\`).
    - Use **pattern matching** where appropriate (e.g., "users whose name starts with J" → \`{ "name": { "$regex": "^J", "$options": "i" } }\`).
    - Use **range queries** for numeric/date values (e.g., "users older than 25" → \`{ "age": { "$gt": 25 } }\`).
    - Use **logical operators** when required (e.g., "users who are active and from New York" → \`{ "$and": [{ "active": true }, { "location": "New York" }] }\`).
    - **Output only valid JSON**. Do **not** include explanations, markdown formatting, or any extra text.

    ### **Example Inputs & Outputs:**
    **Input:** "Find users whose age is above 30 and live in California"
    **Output:** { "$and": [{ "age": { "$gt": 30 } }, { "location": "California" }] }

    **Input:** "Get all users named Alice or Bob"
    **Output:** { "name": { "$in": ["Alice", "Bob"] } }

    **Input Query:** "${query}"
    
    **Sample Data for Reference:** ${JSON.stringify(sampleData, null, 2)}
    `;

    try {
        const result = await model.generateContent(prompt);
        
        let responseText = result.response.text().trim();

        // Extract JSON response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
            console.error("No JSON found in Gemini response:", responseText);
            return null;
        }

        let jsonQuery;
        try {
            jsonQuery = JSON.parse(jsonMatch[0]); 
        } catch (error) {
            console.error("Failed to parse extracted JSON:", jsonMatch[0]);
            return null;
        }

        return Object.keys(jsonQuery).length > 0 ? jsonQuery : {};
    } catch (error) {
        console.error("Error generating query from Gemini:", error);
        return null;
    }
}

export { getResponseFromGEMINI };
