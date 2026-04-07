const axios = require("axios");

async function test() {
  try {
    console.log("Testing Admin login...");
    const res = await axios.post("http://localhost:5000/api/auth/admin/login", {
      email: "test@admin.com",
      password: "password" // We don't know the password but we can see the error
    });
    console.log("Admin login success!", res.data.token.substring(0, 10));
  } catch (err) {
    if (err.response) {
       console.error("API Error:", err.response.status, err.response.data);
    } else {
       console.error("Network/Crash Error:", err.message);
    }
  }
}
test();
