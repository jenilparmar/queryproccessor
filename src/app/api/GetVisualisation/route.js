import { NextResponse } from "next/server";
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function getGraphAxesFromGEMINI(sampleData) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
    You are a data visualization expert. Analyze the given **sample data schema** and determine the best parameters for the **X-axis and Y-axis** in a graph.

    ### **Guidelines:**
    - **Ensure that X-axis and Y-axis are NEVER NULL.** Always select the best possible values.
    - Identify **categorical or time-based fields** for the **X-axis** (e.g., "date", "timestamp", "category", "name").
    - Identify **numeric fields** for the **Y-axis** (e.g., "price", "sales", "count", "value", "amount").
    - If no numeric field is available for **Y-axis**, use the **count of occurrences** of a categorical field.
    - If no time-based field is found for **X-axis**, use the **first available categorical field**.
    - Return at least **one option** for both X and Y axes.
    - **Only return JSON**—do **not** include explanations or formatting.

    ### **Example Output Format:**
    \`\`\`json
    {
      "xAxis": "name",
      "yAxis": "role_count",
      "xAxisOptions": ["name", "email", "role"],
      "yAxisOptions": ["role_count"]
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

        // Ensure xAxis and yAxis are never null
        if (!jsonAxes.xAxis && jsonAxes.xAxisOptions.length > 0) {
            jsonAxes.xAxis = jsonAxes.xAxisOptions[0]; // Pick the first categorical field
        }
        if (!jsonAxes.yAxis && jsonAxes.yAxisOptions.length > 0) {
            jsonAxes.yAxis = jsonAxes.yAxisOptions[0]; // Pick the first numeric field
        }
        
        return jsonAxes;
    } catch (error) {
        console.error("Error generating graph axes from Gemini:", error);
        return null;
    }
}



export async function POST(req) {
    try {
        const { sampleData } = await req.json();

        if (!sampleData || !Array.isArray(sampleData) || sampleData.length === 0) {
            return NextResponse.json({ error: "Invalid or empty sampleData" }, { status: 400 });
        }

        const axes = await getGraphAxesFromGEMINI(sampleData);

        if (!axes) {
            return NextResponse.json({ error: "Failed to determine axes" }, { status: 500 });
        }

        return NextResponse.json(axes, { status: 200 });
    } catch (error) {
        console.error("Error processing request:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
