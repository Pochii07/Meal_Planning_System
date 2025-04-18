const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://chefit-backend.azurewebsites.net'
  : 'http://localhost:4000'; // or whatever port your backend runs on locally

export default API_BASE_URL;