import React, { useState } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

function App() {
  const [userId, setUserId] = useState(null); // userId is null by default

  return (
    <div>
      {userId ? (
        <Dashboard setUserId={setUserId} userId={userId} /> // If userId is set, show the Dashboard
      ) : (
        <Login setUserId={setUserId} /> // If userId is null, show the Login form
      )}
    </div>
  );
}

export default App;
