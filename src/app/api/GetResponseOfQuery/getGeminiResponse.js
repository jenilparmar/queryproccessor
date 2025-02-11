const { GoogleGenerativeAI } = require("@google/generative-ai");

async function getResponseFromGEMINI(query, schemas) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
    You are an expert in MongoDB query generation. Convert the following **natural language query** into a **valid MongoDB JSON query**.

    ### **Database Schema**
    The database contains multiple collections. Here is their structure:

    \`\`\`json
    ${JSON.stringify(schemas, null, 2)}
    \`\`\`

    ### **Guidelines**
    - **If a single collection is needed**, return a valid \`find()\` query for that collection.
    - **If multiple collections are needed**, generate an \`aggregate()\` pipeline to join collections properly.
    - **Use \`lookup\` for relationships** (e.g., joining a "products" collection with "categories").
    - **Use exact matches, regex, and range filters where appropriate**.
    - **If the query involves a count**, use \`$group\` to count documents.
    - **Ensure valid JSON output**. Do **not** include explanations or extra text.

    ### **Example Inputs & Outputs**
    **Input:** "Find all products in the 'Electronics' category."
    **Output:**
    \`\`\`json
    [
        {
            "$lookup": {
                "from": "categories",
                "localField": "categoryId",
                "foreignField": "_id",
                "as": "category"
            }
        },
        { "$match": { "category.name": "Electronics" } }
    ]
    \`\`\`

    **Input Query:** "${query}"
    `;

    try {
        const result = await model.generateContent(prompt);
        let responseText = result.response.text().trim();

        // Extract JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (!jsonMatch) {
            console.error("No valid JSON found in Gemini response:", responseText);
            return null;
        }

        let jsonQuery;
        try {
            jsonQuery = JSON.parse(jsonMatch[0]);
        } catch (error) {
            console.error("Failed to parse extracted JSON:", jsonMatch[0]);
            return null;
        }

        return jsonQuery;
    } catch (error) {
        console.error("Error generating query from Gemini:", error);
        return null;
    }
}

export { getResponseFromGEMINI };
