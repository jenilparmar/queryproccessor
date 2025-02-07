"use client";
import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";

const ChatBoxContent = () => {
  const searchParams = useSearchParams();
  const dbName = searchParams.get("dbName");
  const colName = searchParams.get("colName");

  return (
    <div className="w-full min-h-screen flex flex-col justify-between py-4 bg-gray-100">
      {/* Header */}
      <div className="text-center p-4 bg-green-600 text-white text-lg font-bold rounded-b-lg shadow-md">
        Chat with <span className="text-yellow-300">{colName}</span> in{" "}
        <span className="text-yellow-300">{dbName}</span>
      </div>

      {/* Messages Section (Placeholder) */}
      <div className="flex-1 p-4 overflow-auto">
        <p className="text-gray-500 text-center">Start querying your database...</p>
      </div>

      {/* Query Input */}
      <div className="w-full flex justify-center py-4 bg-white shadow-md">
        <div className="w-8/12 flex gap-3">
          <input
            type="text"
            className="flex-1 h-12 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            placeholder="Enter your query here..."
          />
          <button className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition">
            Send
          </button>
          <button className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition">
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
