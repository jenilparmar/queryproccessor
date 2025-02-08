"use client";
import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";

const ChatBoxContent = () => {
  const searchParams = useSearchParams();
  const dbName = searchParams.get("dbName");
  const colName = searchParams.get("colName");
  const uri = searchParams.get("uri")?.trim().replace(/\s/g, "+"); // Replace spaces with '+'

  const [input, setInput] = useState("");
  const [response, setResponse] = useState([]);
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [visibleCount, setVisibleCount] = useState(30); // Initial visible entries

  // Handle Query Submission
  const handleSendQuery = async () => {
    if (!input.trim()) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/GetResponseOfQuery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input, dbname: dbName, colName: colName, uri: uri }),
      });

      if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);

      const data = await res.json();
      setResponse(Array.isArray(data) ? data : []);
      setVisibleCount(30); // Reset visible count
    } catch (err) {
      setError(err.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  // Handle Visualization
  const handleVisualize = async () => {
    if (response.length === 0) return;

    const firstEntry = response[0];
    if (!firstEntry || Object.keys(firstEntry).length === 0) {
      setError("Invalid data for visualization.");
      return;
    }

    try {
      const res = await fetch("/api/GetVisualisation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sampleData: [firstEntry] }),
      });

      if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);

      const graphConfig = await res.json();
      setGraphData(graphConfig);
      alert(graphConfig.chartType)
    } catch (err) {
      setError(err.message || "Failed to fetch graph configuration.");
    }
  };

  return (
    <div className="w-full -screen flex flex-col justify-between py-4 bg-gray-100">
      {/* Query Result Display */}
      <div className="w-full flex flex-row pb-20"> {/* Added padding-bottom for fixed input */}
        <div className="flex flex-col justify-center p-4 overflow-auto w-8/12 text-white rounded-lg shadow-lg">
          {loading ? (
            <p className="text-green-400 text-center">Fetching data...</p>
          ) : error ? (
            <p className="text-red-500 text-center">{error}</p>
          ) : response.length > 0 ? (
            <>
              <pre className="text-green-400 max-h-screen overflow-y-scroll">
                {JSON.stringify(response.slice(0, visibleCount), null, 2)}
              </pre>
              {visibleCount < response.length && (
                <button
                  onClick={() => setVisibleCount(visibleCount + 30)}
                  className="mt-4 px-4 py-2 bg-gray-700 self-center text-white rounded-lg hover:bg-gray-800"
                >
                  View More
                </button>
              )}
            </>
          ) : (
            <p className="text-green-500 text-center">Start querying your database...</p>
          )}
        </div>
        {/* Graph Visualization */}
        {graphData && (
          <div className="w-8/12 mx-auto mt-6 bg-white p-4 rounded-lg shadow-lg">
            <h2 className="text-center text-black text-xl font-semibold mb-4">Graph Visualization</h2>
            <ResponsiveContainer width="100%" height={400}>
              {graphData.chartType === "barchart" ? (
                <BarChart data={response.slice(0, 50)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={graphData.xAxis} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey={graphData.yAxis} fill="#4CAF50" />
                </BarChart>
              ) : graphData.chartType === "linechart" ? (
                <LineChart data={response.slice(0, 50)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={graphData.xAxis} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey={graphData.yAxis} stroke="#2196F3" />
                </LineChart>
              ) : (
                <PieChart>
                  <Tooltip />
                  <Legend />
                  <Pie data={response.slice(0, 50)} dataKey={graphData.yAxis} nameKey={graphData.xAxis} fill="#FF5722" label />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>
      {/* Fixed Input & Buttons */}
      <div className="fixed bottom-0 w-full flex justify-center py-4 bg-white shadow-md">
        <div className="w-8/12 flex gap-3">
          <input
            onChange={(e) => setInput(e.target.value)}
            value={input}
            type="text"
            className="flex-1 text-black h-12 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            placeholder="Enter your query here..."
          />
          <button onClick={handleSendQuery} className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition" disabled={loading}>{loading ? "Loading..." : "Send"}</button>
          <button onClick={handleVisualize} className={`${response.length === 0 ? "cursor-not-allowed opacity-50" : ""} px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition`} disabled={response.length === 0}>Visualize Graph</button>
        </div>
      </div>
    </div>
  );
};

export default ChatBoxContent;
