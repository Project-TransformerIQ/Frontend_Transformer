import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // -> http://localhost:8080/api
  withCredentials: false,                // keep false unless you add auth cookies
});

// optional: basic response error logging
axiosClient.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("API error:", err?.response?.status, err?.response?.data || err.message);
    return Promise.reject(err);
  }
);

export default axiosClient;
