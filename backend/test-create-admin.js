import axios from 'axios';

async function test() {
  try {
    const res = await axios.post('http://localhost:5000/api/admin/create', {
      name: "Test Admin",
      email: "test@admin.com",
      password: "password123",
      gender: "Male",
      qualification: "BSc",
      phone: "1234567890",
      role: "super_admin"
    });
    console.log("Success:", res.data);
  } catch (error) {
    console.log("Error:", error.response ? error.response.data : error.message);
  }
}

test();
