import React from "react";

function Dashboard({ setUserId }) {
  const handleLogout = () => {
    setUserId(null); // Clear userId to simulate logout
  };

  return (
    <div>
      <h2>Dashboard</h2>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default Dashboard;
