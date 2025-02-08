"use client";
import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

const ChatBoxContent = () => {
  const searchParams = useSearchParams();
  const dbName = searchParams.get("dbName");
  const colName = searchParams.get("colName");

  const uri = searchParams.get("uri")?.trim().replace(/\s/g, "+"); // Replace spaces with '+'
  

  const [input, setInput] = useState("");
  const [response, setResponse] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

 const handleSendQuery = async () => {
  if (!input.trim()) return;

  // setLoading(true);
  setError("");

  try {
    const res = await fetch("/api/GetResponseOfQuery", {  // Ensure correct API path
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: input, dbname: dbName, colName: colName, uri: uri }),
    });

    if (!res.ok) {
      const errorText = await res.text(); // Read error message
      throw new Error(`Error ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    
    if (Array.isArray(data)) {  // Ensure valid response before updating state
      setResponse(data);
    } else {
      throw new Error("Unexpected response format");
    }
  } catch (err) {
    console.error("API Request Error:", err.message);
    setError(err.message || "Something went wrong! Please try again.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="w-full min-h-screen flex flex-col justify-between py-4 bg-gray-100">

      {/* Messages Section */}
      <div className="flex-1 p-4 overflow-auto bg-black w-8/12 self-center text-white rounded-lg shadow-lg">
        {loading ? (
          <p className="text-gray-400 text-center">Fetching data...</p>
        ) : error ? (
          <p className="text-red-500 text-center">{error}</p>
        ) : response.length > 0 ? (
          <pre className="text-green-400">{JSON.stringify(response, null, 2)}</pre>
        ) : (
          <p className="text-gray-500 text-center">Start querying your database...</p>
        )}
      </div>

      {/* Query Input */}
      <div className="w-full flex justify-center py-4 bg-white shadow-md">
        <div className="w-8/12 flex gap-3">
          <input
            onChange={(e) => setInput(e.target.value)}
            value={input}
            type="text"
            className="flex-1 text-black h-12 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            placeholder="Enter your query here..."
          />
          <button
            onClick={handleSendQuery}
            className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition"
            disabled={loading}
          >
            {loading ? "Loading..." : "Send"}
          </button>
          <button
            className={`${response.length === 0 ? "cursor-not-allowed opacity-50" : ""} px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition`}
            disabled={response.length === 0}
          >
            Visualize Graph
          </button>
        </div>
      </div>
    </div>
  );
};

const ChatBoxPage = () => {
  return (
    <Suspense fallback={<p className="text-center text-gray-500">Loading chat...</p>}>
      <ChatBoxContent />
    </Suspense>
  );
};

export default ChatBoxPage;
