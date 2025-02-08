import { NextResponse } from "next/server";
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function getGraphAxesAndChartType(sampleData) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
    You are a data visualization expert. Analyze the given **sample data schema** and determine the best parameters for the **X-axis and Y-axis** in a graph, along with the best chart type.

    ### **Guidelines:**
    - **Ensure that X-axis and Y-axis are NEVER NULL.** Always select the best possible values.
    - Identify **categorical or time-based fields** for the **X-axis** (e.g., "date", "timestamp", "category", "name").
    - Identify **numeric fields** for the **Y-axis** (e.g., "price", "sales", "count", "value", "amount").
    - If no numeric field is available for **Y-axis**, use the **count of occurrences** of a categorical field.
    - If no time-based field is found for **X-axis**, use the **first available categorical field**.
    - **Determine the best chart type** based on the data:
      - **"linechart"** → If the X-axis is a time-based field.
      - **"barchart"** → If the X-axis is categorical and the Y-axis is numeric.
      - **"piechart"** → If the data represents categorical proportions (e.g., distribution of roles or categories).
    - **Only return JSON**—do **not** include explanations or formatting.
    - don't add '_id' as xaxis or yaxis NEVER use _id in anywhere in axis. 
    ### **Example Output Format:**
    \`\`\`json
    {
      "xAxis": "date",
      "yAxis": "sales",
      "xAxisOptions": ["date", "category"],
      "yAxisOptions": ["sales", "revenue", "profit"],
      "chartType": "linechart"
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

        let jsonResult;
        try {
            jsonResult = JSON.parse(jsonMatch[0]); 
        } catch (error) {
            console.error("Failed to parse extracted JSON:", jsonMatch[0]);
            return null;
        }

        // Ensure xAxis and yAxis are never null
        if (!jsonResult.xAxis && jsonResult.xAxisOptions.length > 0) {
            jsonResult.xAxis = jsonResult.xAxisOptions[0]; // Pick first categorical field
        }
        if (!jsonResult.yAxis && jsonResult.yAxisOptions.length > 0) {
            jsonResult.yAxis = jsonResult.yAxisOptions[0]; // Pick first numeric field
        }
        if (!jsonResult.chartType) {
            jsonResult.chartType = "barchart"; // Default to bar chart if uncertain
        }

        return jsonResult;
    } catch (error) {
        console.error("Error generating graph axes and chart type:", error);
        return null;
    }
}



export async function POST(req) {
    try {
        const { sampleData } = await req.json();

        if (!sampleData || !Array.isArray(sampleData) || sampleData.length === 0) {
            return NextResponse.json({ error: "Invalid or empty sampleData" }, { status: 400 });
        }

        const axes = await getGraphAxesAndChartType(sampleData);

        if (!axes) {
            return NextResponse.json({ error: "Failed to determine axes" }, { status: 500 });
        }

        return NextResponse.json(axes, { status: 200 });
    } catch (error) {
        console.error("Error processing request:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
