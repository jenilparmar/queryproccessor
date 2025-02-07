"use client";
import React, { useEffect, useState } from "react";
import Header_Dashboard from "../Components/Header_Dashboard";
import { useSearchParams } from "next/navigation";
import { MdKeyboardArrowDown } from "react-icons/md";
import { BsChatDots } from "react-icons/bs";
import Router from "next/navigation";
const DashboardPage = () => {
  const searchParams = useSearchParams();
  const mongodbUri = searchParams.get("uri");
const router = useRouter();  
  const [databases, setDatabases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDb, setOpenDb] = useState({}); // Track which DB is expanded
    const handleRouting = (colName , dbName)=>{
        const encodedDbName = encodeURIComponent(dbName);
        const encodedColName = encodeURIComponent(colName);
        router.push(`/chatBox?dbName=${encodedDbName}&colName=${encodedColName}`)
    }
  useEffect(() => {
    if (!mongodbUri) {
      setError("MongoDB URI not found in URL.");
      setLoading(false);
      return;
    }

    async function fetchDb_Col(_mongodbUri) {
      try {
        const res = await fetch("/api/get-db-collections", {
          method: "POST",
          body: JSON.stringify({ mongodbUri: _mongodbUri }), // Ensure key matches API
          headers: { "Content-Type": "application/json" },
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to fetch data");

        setDatabases(data.databases);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDb_Col(mongodbUri);
  }, [mongodbUri]);

  // Toggle function to show/hide collections
  const toggleCollections = (dbName) => {
    setOpenDb((prevState) => ({
      ...prevState,
      [dbName]: !prevState[dbName],
    }));
  };

  return (
    <div className="w-full min-h-screen gap-4 flex flex-col justify-start py-4 bg-white">
      <Header_Dashboard name={"Jenil"} isConnected={!!databases.length} />

      <div className=" w-8/12 mx-auto p-6 bg-gray-100 rounded-lg shadow-md mt-6">
        <h2 className="text-2xl font-bold text-center mb-4">
          Database Collections
        </h2>

        {loading && <p className="text-center text-gray-600">Loading...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        {databases.length > 0 && (
          <>
            {databases.map((db) => (
              <div key={db.database} className="p-4   rounded-lg shadow mb-4">
                <div className="flex justify-between items-center">
                  <strong className="text-3xl text-green-600">
                    {db.database}
                  </strong>
                  <button
                    onClick={() => toggleCollections(db.database)}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 hover:scale-105 transition-all duration-200 ">
                    <MdKeyboardArrowDown />
                  </button>
                </div>

                {openDb[db.database] && (
                  <ul className="ml-4 mt-2 list-disc list-inside text-gray-700">
                    {db.collections.length > 0 ? (
                      db.collections.map((col) => (
                        <div
                          key={col}
                          className="w-full flex flex-row justify-between px-2 py-4 hover:bg-gray-300 font-semibold text-green-600">
                          <p>{col}</p>
                          <BsChatDots className="text-2xl hover:text-green-600 hover:scale-105 transition-all duration-200" />
                        </div>
                      ))
                    ) : (
                      <li className="text-gray-400">No collections</li>
                    )}
                  </ul>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
