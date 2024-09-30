import React, { useEffect, useState, useRef } from "react";
import { GoogleMap, LoadScript, DrawingManagerF } from "@react-google-maps/api";
import "./Dashboard.css";

const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

const center = {
  lat: 43.6532, // Example latitude (Toronto)
  lng: -79.3832, // Example longitude (Toronto)
};

function Dashboard({ setUserId, userId }) {
  const [username, setUsername] = useState("");
  const [routeIds, setRouteIds] = useState([]);
  const [routeNames, setRouteNames] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [route, setRoute] = useState({});
  const [routeName, setRouteName] = useState("");
  const drawingManagerRef = useRef(null); // Use a ref to store the DrawingManager

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

  const handleSave = async () => {
    try {
      if (!route) {
        console.error("No route to save.");
        return;
      }

      const routeData = {
        userId,
        route,
      };

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/routes/saveRoute`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(routeData),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Route saved successfully:", data);
      } else {
        const errorData = await response.json();
        console.error("Error saving route:", errorData);
      }
    } catch (error) {
      console.error("Error while saving the route:", error);
    }
  };

  const onPolylineComplete = (polyline) => {
    // Get the array of LatLng objects from the polyline path
    const pathArray = polyline
      .getPath()
      .getArray()
      .map((latLng) => ({
        lat: latLng.lat(),
        lng: latLng.lng(),
      }));

    // Create a polyline object that contains the path and additional properties
    const polylineData = {
      path: pathArray, // Array of lat/lng coordinates
      name: routeName,
    };

    setRoute(polylineData);
  };

  const handleLoad = (drawingManager) => {
    drawingManagerRef.current = drawingManager; // Store the DrawingManager instance when loaded
    console.log(drawingManager);
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
        <div className="dashboard-button-container">
          <button
            className={`${isDrawing ? "is-drawing" : ""}`}
            onClick={() => setIsDrawing(!isDrawing)}
          >
            {isDrawing ? "Stop" : "Start"} Drawing
          </button>
          <button onClick={handleSave}>Save Route</button>
          <input
            type="text"
            value={routeName}
            onChange={(e) => setRouteName(e.target.value)}
          />
        </div>
        <LoadScript
          googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
          libraries={["drawing"]}
        >
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={12}
          >
            <DrawingManagerF
              onLoad={handleLoad} // Store the DrawingManager instance
              drawingMode={!isDrawing ? "polyline" : null} // Use a string for drawingMode directly
              onPolylineComplete={onPolylineComplete}
              options={{
                drawingControl: true,
                drawingControlOptions: {
                  drawingModes: ["polyline"], // Enable only polyline drawing
                },
                polylineOptions: {
                  strokeColor: "#FF0000",
                  strokeWeight: 2,
                },
              }}
            />
          </GoogleMap>
        </LoadScript>
      </main>
    </div>
  );
}

export default Dashboard;
