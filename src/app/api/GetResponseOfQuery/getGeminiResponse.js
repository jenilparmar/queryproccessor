const { GoogleGenerativeAI } = require("@google/generative-ai");

async function getResponseFromGEMINI(query, schemas, collectionNames) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
    You are an expert in MongoDB query generation. Convert the following **natural language query** into a **valid MongoDB JSON query**.

    ### **Database Collections**
    The database contains the following collections:
    ${collectionNames.map(name => `- ${name}`).join("\n")}

    ### **Collection Schemas**
    Here is a sample structure of each collection:

    \`\`\`json
    ${JSON.stringify(schemas, null, 2)}
    \`\`\`

    ### **Guidelines**
    - **Determine which collection(s) should be queried based on the question.**  
    - **If a single collection is enough, generate a valid \`find()\` query.**  
    - **If multiple collections are needed, generate an \`aggregate()\` pipeline using \`$lookup\`.**  
    - **ALWAYS return output in this exact JSON format:**  

    \`\`\`json
    {
        "collections": ["collection_name1", "collection_name2"],
        "query": [
            { "$lookup": { "from": "orders", "localField": "order_id", "foreignField": "order_id", "as": "order_info" }},
            { "$unwind": "$order_info" },
            { "$match": { "payment_type": "credit_card", "order_info.order_status": "delivered" }}
        ]
    }
    \`\`\`

    **DO NOT return any explanations, just valid JSON.**  

    **Input Query:** "${query}"
    `;

    try {
        const result = await model.generateContent(prompt);
        let responseText = result.response.text().trim();

        // Extract JSON response from Gemini
        const jsonMatch = responseText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (!jsonMatch) {
            console.error("No valid JSON found in Gemini response:", responseText);
            return null;
        }

        let responseData;
        try {
            responseData = JSON.parse(jsonMatch[0]);
        } catch (error) {
            console.error("Failed to parse extracted JSON:", jsonMatch[0]);
            return null;
        }

        return responseData;
    } catch (error) {
        console.error("Error generating query from Gemini:", error);
        return null;
    }
}

export { getResponseFromGEMINI };
