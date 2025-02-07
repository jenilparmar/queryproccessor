'use client'
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function MongoDBConnectionForm() {
  const [connectionString, setConnectionString] = useState("");
  const router = useRouter();  

  const handleSubmit = async () => {
    if (!connectionString) {
      setMessage("Please enter a connection string.");
      return;
    }
    const encodeduri  = encodeURIComponent(connectionString);
    router.push(`/dashboard?uri=${encodeduri}`)
   
   
  };

  return (
    <div className="w-1/3 border-2 border-black  h-1/4 bg-gray-100 rounded-2xl flex flex-col justify-center gap-3 p-4 self-center shadow-lg">
      <p className="text-green-600 text-center font-bold text-2xl mb-4">Connect to DB</p>
      <input 
        type="text" 
        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400" 
        placeholder="Enter the connection string" 
        value={connectionString} 
        onChange={(e) => setConnectionString(e.target.value)}
      />
      <button 
        className="w-full rounded-xl bg-green-500 p-3 mt-4 text-white font-semibold hover:bg-green-600 transition duration-300"
        onClick={handleSubmit}
      >
        Connect
      </button>
     
    </div>
  );
}