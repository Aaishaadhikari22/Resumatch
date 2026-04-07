const axios = require("axios");

async function test() {
  try {
    // 1. Register a test user or login
    console.log("Logging in...");
    const loginRes = await axios.post("http://localhost:5000/api/auth/user/login", {
      email: "testuser@example.com",
      password: "password123"
    }).catch(async (err) => {
      console.log("Login failed, registering new user...");
      return await axios.post("http://localhost:5000/api/auth/user/register", {
        name: "Test User",
        email: "testuser@example.com",
        password: "password123"
      });
    });

    const token = loginRes.data.token;
    console.log("Token:", token.substring(0, 20) + "...");

    // 2. Fetch dashboard stats
    console.log("Fetching dashboard stats...");
    const dashRes = await axios.get("http://localhost:5000/api/user/dashboard", {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Dashboard Stats Success!");
    console.log(dashRes.data);
  } catch (err) {
    if (err.response) {
      console.error("API Error:", err.response.status, err.response.data);
    } else {
      console.error("Error:", err.message);
    }
  }
}

test();
