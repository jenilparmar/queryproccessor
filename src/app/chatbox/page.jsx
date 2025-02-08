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
import { Spinner } from "react-bootstrap"; // Import a spinner component
import "bootstrap/dist/css/bootstrap.min.css";

const ChatBoxContent = () => {
  const searchParams = useSearchParams();
  const dbName = searchParams.get("dbName");
  const colName = searchParams.get("colName");
  const uri = searchParams.get("uri")?.trim().replace(/\s/g, "+"); // Replace spaces with '+'

  const [input, setInput] = useState("");
  const [response, setResponse] = useState([]);
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(0);
  const [error, setError] = useState("");
  const [visibleCount, setVisibleCount] = useState(30); // Initial visible entries
  const [graphStartIndex, setGraphStartIndex] = useState(0);
  const [graphEndIndex, setGraphEndIndex] = useState(50);
  // Handle Query Submission
  const handleSendQuery = async () => {
    if (!input.trim()) return;
    setError("");
    setLoading(1);
    try {
      const res = await fetch("/api/GetResponseOfQuery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: input,
          dbname: dbName,
          colName: colName,
          uri: uri,
        }),
      });

      if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);

      const data = await res.json();
      setResponse(Array.isArray(data) ? data : []);
      setVisibleCount(30); // Reset visible count
    } catch (err) {
      setError(err.message || "Something went wrong!");
    } finally {
      setLoading(0);
    }
  };

  // Handle Visualization
  const handleVisualize = async () => {
    if (response.length === 0) return;
    setLoading(2);
    const slicedData = response.slice(graphStartIndex, graphEndIndex);
    if (!slicedData.length) {
      setError("No data available in the selected range.");
      return;
    }

    try {
      const res = await fetch("/api/GetVisualisation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sampleData: slicedData }),
      });

      if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);

      const graphConfig = await res.json();
      setGraphData(graphConfig);
      setLoading(0);
    } catch (err) {
      setError(err.message || "Failed to fetch graph configuration.");
    }
  };
  return (
    <div className="w-full h-screen flex flex-col justify-between py-4 bg-gray-100">
      {/* Query Result Display */}
     <div>
     <div className="w-full max-h-screen flex flex-col lg:flex-row md:flex-row gap-2 lg:gap-6 md:gap-4 pb-20">
        {" "}
        {/* Added padding-bottom for fixed input */}
        <div className="w-full flex flex-col justify-center p-4 overflow-auto  text-white rounded-lg shadow-lg">
          {loading == 1 ? (
            <div className="flex justify-center items-center">
              <Spinner animation="border" variant="success" />{" "}
              {/* Loading spinner */}
              <p className="text-green-400 text-center ml-2">
                Fetching data...
              </p>
            </div>
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
                  className="mt-4 px-4 py-2 bg-gray-700 self-center text-white rounded-lg hover:bg-gray-800">
                  View More
                </button>
              )}
            </>
          ) : (
            <p className="text-green-500 text-center">
              Start querying your database...
            </p>
          )}
        </div>
        {/* Graph Visualization */}
        {graphData && (
          <div className="w-full md:w-8/12 mx-auto flex flex-col mt-6 bg-white md:p-4 rounded-lg shadow-lg">
            <h2 className="text-center text-black text-xl font-semibold my-4">
              Graph Visualization
            </h2>
            <ResponsiveContainer
              className={"self-center"}
              width="100%"
              height={400}>
              {graphData.chartType === "barchart" ? (
                <BarChart data={response.slice(graphStartIndex, graphEndIndex)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={graphData.xAxis} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey={graphData.yAxis} fill="#4CAF50" />
                </BarChart>
              ) : graphData.chartType === "linechart" ? (
                <LineChart
                  data={response.slice(graphStartIndex, graphEndIndex)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={graphData.xAxis} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey={graphData.yAxis}
                    stroke="#2196F3"
                  />
                </LineChart>
              ) : (
                <PieChart>
                  <Tooltip />
                  <Legend />
                  <Pie
                    data={response.slice(graphStartIndex, graphEndIndex)}
                    dataKey={graphData.yAxis}
                    nameKey={graphData.xAxis}
                    fill="#FF5722"
                    label
                  />
                </PieChart>
              )}
            </ResponsiveContainer>
            <div className=" px-2 flex items-center md:gap-4 mt-4">
              <label className="text-black">Start Index:</label>
              <input
                type="number"
                value={graphStartIndex}
                onChange={(e) =>
                  setGraphStartIndex(Math.max(0, Number(e.target.value)))
                }
                className="border px-2 py-1 w-20 rounded-md"
              />

              <label className="text-black">End Index:</label>
              <input
                type="number"
                value={graphEndIndex}
                onChange={(e) =>
                  setGraphEndIndex(
                    Math.min(response.length, Number(e.target.value))
                  )
                }
                className="border px-2 py-1 w-20 rounded-md"
              />
            </div>
          </div>
        )}
      </div>
     </div>
      {/* Fixed Input & Buttons */}
      <div className="w-full flex justify-center py-4 bg-white shadow-md">
        <div className="w-full max-w-4xl px-4 flex flex-col md:flex-row gap-3">
          {/* Input Field */}
          <input
            onChange={(e) => setInput(e.target.value)}
            value={input}
            type="text"
            className="w-full md:flex-1 px-3 py-3 text-black text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            placeholder="Enter your query here..."
            disabled={loading} // Disable input while loading
          />

          {/* Button Container (For Better Mobile Layout) */}
          <div className="flex gap-2 md:gap-3 justify-center md:justify-start w-full md:w-auto">
            {/* Send Button */}
            <button
              onClick={handleSendQuery}
              className="w-full md:w-24 h-12 px-4 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition"
              disabled={loading}>
              {loading == 1 ? <Spinner animation="border" size="sm" /> : "Send"}
            </button>

            {/* Visualize Graph Button */}
            <button
              onClick={handleVisualize}
              className={`w-full md:w-32 h-12 px-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition ${
                response.length === 0 ? "cursor-not-allowed opacity-50" : ""
              }`}
              disabled={response.length === 0 || loading}>
              {loading == 2 ? (
                <Spinner animation="border" size="sm" />
              ) : (
                "Visualize"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChatBoxPage = () => {
  return (
    <Suspense
      fallback={<p className="text-center text-gray-500">Loading chat...</p>}>
      <ChatBoxContent />
    </Suspense>
  );
};

export default ChatBoxPage;
