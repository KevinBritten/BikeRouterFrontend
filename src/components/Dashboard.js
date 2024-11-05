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
  const [polylines, setPolylines] = useState([]);

  const drawingManagerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/user`, {
          method: "POST",
          body: new URLSearchParams({
            userId,
          }),
        });
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
          path: data.route.path.coordinates.map((c) => {
            return { lat: c[0], lng: c[1] };
          }), // Assuming route.path is an array of lat/lng objects
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
        route: {
          name: route.name,
          path: {
            type: "LineString",
            coordinates: route.path.map((p) => [p.lng, p.lat]),
          },
        },
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

  const handleRectangleComplete = (rectangle) => {
    polylines.forEach((polyline) => polyline.setMap(null));
    setPolylines([]); // Reset polylines state
    const bounds = rectangle.getBounds();
    const ne = bounds.getNorthEast(); // North-east corner
    const sw = bounds.getSouthWest(); // South-west corner
    const nw = { lat: ne.lat(), lng: sw.lng() }; // NW shares latitude with NE, longitude with SW
    const se = { lat: sw.lat(), lng: ne.lng() }; // SE shares latitude with SW, longitude with NE

    const soapRequest = `<?xml version="1.0" encoding="UTF-8"?>
      <soap12:Envelope xmlns:soap12="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="http://resource.bikeRouterApi/">
        <soap12:Body>
          <tns:SearchArea>
            <lat1>${ne.lat()}</lat1>
            <lng1>${ne.lng()}</lng1>
            <lat2>${nw.lat}</lat2>
            <lng2>${nw.lng}</lng2>
            <lat3>${sw.lat()}</lat3>
            <lng3>${sw.lng()}</lng3>
            <lat4>${se.lat}</lat4>
            <lng4>${se.lng}</lng4>
          </tns:SearchArea>
        </soap12:Body>
      </soap12:Envelope>`;

    fetch("http://localhost:8080/BikeRouterApi/ws/searchArea", {
      method: "POST",
      headers: {
        "Content-Type": "text/xml",
      },
      body: soapRequest,
    })
      .then((response) => response.text())
      .then((responseText) => {
        console.log("SOAP Response:", responseText);

        // Parse the XML response
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(responseText, "text/xml");

        // Extract route information and draw each as a polyline
        const routes = xmlDoc.querySelectorAll("routes");
        routes.forEach((route) => {
          const id = route.querySelector("id").textContent;
          const name = route.querySelector("name").textContent;
          const coordinates = route.querySelectorAll("coordinates");

          console.log("Route ID:", id);
          console.log("Route Name:", name);
          console.log("Coordinates:");
          coordinates.forEach((coord) => {
            const items = coord.querySelectorAll("item");
            items.forEach((item) => {
              console.log(item.textContent); // Each coordinate value
            });
          });
        });

        const newPolylines = Array.from(routes).map((route) => {
          const coordinates = Array.from(
            route.querySelectorAll("coordinates")
          ).map((item) => {
            console.log("sef");
            console.log(item.firstChild.innerHTML);
            console.log(item.lastChild.innerHTML);

            return {
              lat: parseFloat(item.lastChild.innerHTML),
              lng: parseFloat(item.firstChild.innerHTML),
            }; // Ensure latLng order matches your data
          });

          const polyline = new window.google.maps.Polyline({
            path: coordinates,
            geodesic: true,
            strokeColor: "#FF0000",
            strokeOpacity: 1.0,
            strokeWeight: 2,
          });
          polyline.setMap(mapRef.current); // Draw polyline on map
          return polyline;
        });

        // Save the new polylines to the state for future reference
        setPolylines(newPolylines);
      })
      .catch((error) => {
        console.error("Error in SOAP request:", error);
      });

    // Optionally remove the rectangle after drawing
    rectangle.setMap(null);
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
              onRectangleComplete={handleRectangleComplete}
              options={{
                drawingControl: true,
                drawingControlOptions: {
                  drawingModes: ["polyline", "rectangle"], // Enable only polyline drawing
                },
                polylineOptions: {
                  strokeColor: "#FF0000",
                  strokeWeight: 2,
                },
                rectangleOptions: {
                  strokeColor: "#FF0000",
                  strokeWeight: 2,
                  fillColor: "#FF0000",
                  fillOpacity: 0.2,
                  editable: true,
                  draggable: true,
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
