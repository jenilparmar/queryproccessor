const { GoogleGenerativeAI } = require("@google/generative-ai");

async function getResponseFromGEMINI(query) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
    Convert the following natural language query into a valid JSON object for MongoDB's find() operation.
    - The output must be **ONLY** valid JSON.
    - Do **not** include explanations, formatting, or extra text.
    - Example:
      Input: "Find all users whose name is John"
      Output: { "name": "John" }

    Query: "${query}"
    `;

    try {
        const result = await model.generateContent(prompt);
        
        // Extract the raw text response
        let responseText = result.response.text().trim();

        // Use regex to extract JSON content (handles extra formatting)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/); // Matches anything inside `{ ... }`
        
        if (!jsonMatch) {
            console.error("No JSON found in Gemini response:", responseText);
            return null;
        }

        let jsonQuery;
        try {
            jsonQuery = JSON.parse(jsonMatch[0]); // Parse extracted JSON
        } catch (error) {
            console.error("Failed to parse extracted JSON:", jsonMatch[0]);
            return null;
        }

        // Ensure the query is valid (not empty)
        return Object.keys(jsonQuery).length > 0 ? jsonQuery : {};
    } catch (error) {
        console.error("Error generating query from Gemini:", error);
        return null;
    }
}

export { getResponseFromGEMINI };
