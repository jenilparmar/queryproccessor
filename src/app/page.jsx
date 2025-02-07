import Image from "next/image";
import MongoDBConnectionForm from "./Components/connectionStringComponent";

export default function Home() {
  return (
   <>
   <div className="w-full h-screen flex flex-col justify-center bg-white">
      <MongoDBConnectionForm/>
   </div>
   </>
  );
}
