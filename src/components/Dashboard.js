import React, { useEffect, useState, useRef } from "react";
import {
  GoogleMap,
  LoadScript,
  DrawingManagerF,
  Polyline,
} from "@react-google-maps/api";
import "./Dashboard.css";

const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

const center = {
  lat: 45.5019,
  lng: -73.5674,
};

function Dashboard({ setUserId, userId }) {
  const [username, setUsername] = useState("");
  const [routeIds, setRouteIds] = useState([]);
  const [routeNames, setRouteNames] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [route, setRoute] = useState({});
  const [routeName, setRouteName] = useState("");
  const [currentPolyline, setCurrentPolyline] = useState(null);
  const drawingManagerRef = useRef(null);
  const mapRef = useRef(null);

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

  const handleLogout = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/logout`, {
        method: "POST",
        credentials: "include", // Include credentials to send the cookie
        body: new URLSearchParams({
          userId,
        }),
      });

      if (response.ok) {
        setUserId(null); // Clear userId if logout was successful
      } else {
        console.error("Logout failed:", await response.text()); // Log any errors
      }
    } catch (error) {
      console.error("Network error during logout:", error);
    }
  };

  const handleRouteChange = async (event) => {
    setSelectedRouteId(event.target.value);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/routes/getRoute?routeId=${event.target.value}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Route data received:", data);
        setRoute(data.route);

        // Clear current polyline if it exists
        if (currentPolyline) {
          currentPolyline.setMap(null); // Removes the current polyline from the map
        }

        // Draw the new polyline
        const newPolyline = new window.google.maps.Polyline({
          path: data.route.path, // Assuming route.path is an array of lat/lng objects
          geodesic: true,
          strokeColor: "#FF0000",
          strokeOpacity: 1.0,
          strokeWeight: 2,
        });

        // Set the polyline on the map and update the state
        newPolyline.setMap(mapRef.current);
        setCurrentPolyline(newPolyline); // Save the new polyline reference
      } else {
        console.error("Route not found");
      }
    } catch (error) {
      console.error("Error fetching route:", error);
    }
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
        `${process.env.REACT_APP_API_URL}/routes/addRoute`,
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

    setRoute((oldRoute) => {
      return {
        ...oldRoute,
        path: pathArray,
      };
    });
  };

  const handleLoad = (drawingManager) => {
    drawingManagerRef.current = drawingManager; // Store the DrawingManager instance when loaded
  };

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setRouteName(newName);
    setRoute((oldRoute) => {
      return {
        ...oldRoute,
        name: newName,
      };
    });
  };

  const onMapLoad = (map) => {
    mapRef.current = map; // Store the map instance
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
            value={selectedRouteId}
            onChange={handleRouteChange}
          >
            <option value="">-- Select a route --</option>
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

          <input type="text" value={routeName} onChange={handleNameChange} />
        </div>
        <LoadScript
          googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
          libraries={["drawing"]}
        >
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={12}
            onLoad={onMapLoad}
          >
            <DrawingManagerF
              onLoad={handleLoad} // Store the DrawingManager instance
              drawingMode={isDrawing ? "polyline" : null} // Use a string for drawingMode directly
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
