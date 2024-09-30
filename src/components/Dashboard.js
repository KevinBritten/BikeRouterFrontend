import React, { useEffect, useState } from "react";
import "./Dashboard.css"; // Import the CSS file

function Dashboard({ setUserId, userId }) {
  const [username, setUsername] = useState("");
  const [routeIds, setRouteIds] = useState([]);
  const [routeNames, setRouteNames] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/user?userId=${userId}`
        );
        const data = await response.json();

        if (response.ok) {
          setUsername(data.user.username); // Set the username from the user object
          setRouteIds(data.user.routeIds); // Set the routes from the user object
          setRouteNames(data.user.routeNames); // Set the route names from the user object
        } else {
          console.error(data); // Handle error when user is not found
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [userId]);

  const handleLogout = () => {
    setUserId(null); // Clear userId to simulate logout
  };

  const handleRouteChange = (event) => {
    setSelectedRoute(event.target.value);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="user-info">
          <span>
            Signed in as: {username} ({userId})
          </span>
        </div>
        <div className="route-select">
          <label htmlFor="routes">Select Route:</label>
          <select
            id="routes"
            value={selectedRoute}
            onChange={handleRouteChange}
          >
            <option value="" disabled>
              -- Select a route --
            </option>
            {routeNames.map((routeName, index) => (
              <option key={index} value={routeIds[index]}>
                {routeName}
              </option>
            ))}
          </select>
        </div>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </header>
      <main className="dashboard-content">
        <h2>Dashboard</h2>
      </main>
    </div>
  );
}

export default Dashboard;
