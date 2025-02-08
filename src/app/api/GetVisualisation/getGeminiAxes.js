const { GoogleGenerativeAI } = require("@google/generative-ai");

async function getGraphAxesFromGEMINI(sampleData) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
    You are a data visualization expert. Analyze the given **sample data schema** and determine the best parameters for the **X-axis and Y-axis** in a graph.

    ### **Guidelines:**
    - Identify **categorical or time-based fields** for the **X-axis** (e.g., "date", "timestamp", "category", "name").
    - Identify **numeric fields** for the **Y-axis** (e.g., "price", "sales", "count", "value", "amount").
    - If multiple options exist, return the **best primary choices** and also a list of alternatives.
    - **Only return JSON**—do **not** include explanations or formatting.

    ### **Example Output Format:**
    \`\`\`json
    {
      "xAxis": "date",
      "yAxis": "sales",
      "xAxisOptions": ["date", "category"],
      "yAxisOptions": ["sales", "revenue", "profit"]
    }
    \`\`\`

    **Sample Data Schema:** ${JSON.stringify(sampleData, null, 2)}
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

        let jsonAxes;
        try {
            jsonAxes = JSON.parse(jsonMatch[0]); 
        } catch (error) {
            console.error("Failed to parse extracted JSON:", jsonMatch[0]);
            return null;
        }

        return jsonAxes;
    } catch (error) {
        console.error("Error generating graph axes from Gemini:", error);
        return null;
    }
}

export { getGraphAxesFromGEMINI };
