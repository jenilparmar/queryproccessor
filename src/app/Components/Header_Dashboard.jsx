import React from "react";

const Header_Dashboard = ({ name, isConnected }) => {
  return (
    <div className="w-10/12 p-2 sm:w-11/12 md:w-3/5 lg:w-3/5 text-xl md:text-2xl bg-gray-100 shadow-xl rounded-2xl h-1/6 flex flex-row self-center justify-between">
      <p className="text-green-500 font-semibold">{name}</p>
      <p
        className={`${
          isConnected ? "text-green-500" : "text-red-500"
        } font-medium`}>
        {isConnected ? "🟢Connected" : "🔴Disconnected"}
      </p>
    </div>
  );
};

export default Header_Dashboard;
