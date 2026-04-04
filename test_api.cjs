const axios = require('axios');

async function testApi() {
  try {
    const categoryId = '69bbf007d8c2f117369f3ca7'; // Clothing
    const url = `http://localhost:5000/api/categories/${categoryId}/subcategories`;
    console.log(`URL: ${url}`);
    const response = await axios.get(url);
    console.log('Response Success:', response.data.success);
    console.log('Count:', response.data.data.length);
    if (response.data.data.length > 0) {
      console.log('First 5 items:');
      response.data.data.slice(0, 5).forEach(i => console.log(`- ${i.name} (ID: ${i._id})`));
    } else {
      console.log('Data is empty');
    }
  } catch (err) {
    console.error('Error:', err.message);
    if (err.response) {
      console.error('Response Data:', err.response.data);
    }
  }
}

testApi();
