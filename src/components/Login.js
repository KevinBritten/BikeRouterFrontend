import React, { useState } from "react";
import "./Login.css";

function Login({ setUserId }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const [signupUsername, setSignupUsername] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(null);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          username: username,
          password: password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserId(data.userId); // Set the userId upon successful login
      } else {
        const errorMessage = await response.text();
        setError(errorMessage); // Handle error
      }
    } catch (error) {
      setError("Network error, please try again later.");
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}signup/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          username: signupUsername,
          password: signupPassword,
        }),
      });

      if (response.ok) {
        setSignupSuccess("Signup Successful!"); // Handle error
      } else {
        const errorMessage = await response.text();
        console.log(errorMessage);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="login-container">
      <div className="form-container">
        <h2>Login</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleLoginSubmit}>
          <div className="input-container">
            <label>Username:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="input-container">
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="form-button">
            Login
          </button>
        </form>
      </div>

      <div className="form-container">
        <h2>Signup</h2>
        {signupSuccess && <p className="success">{signupSuccess}</p>}
        <form onSubmit={handleSignupSubmit}>
          <div className="input-container">
            <label>Username:</label>
            <input
              type="text"
              value={signupUsername}
              onChange={(e) => setSignupUsername(e.target.value)}
              required
            />
          </div>
          <div className="input-container">
            <label>Password:</label>
            <input
              type="password"
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="form-button">
            Signup
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
