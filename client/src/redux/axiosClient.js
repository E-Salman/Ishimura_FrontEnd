import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:4002",
    headers: { "Content-Type": "application/json" }
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Extract clean backend info
        const clean = {
            status: error.response?.status,
            message: error.response?.data?.title + ": " + error.response?.data?.detail,
            data: error.response?.data
        };

        // Thunk will receive this as the thrown value
        throw clean;
    }
);
export default api;