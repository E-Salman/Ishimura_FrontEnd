import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:4002",
    headers: { "Content-Type": "application/json" }
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const clean = {
            status: error.response?.status,
            message: error.response?.data?.title + ": " + error.response?.data?.detail,
            data: error.response?.data
        };
        throw clean;
    }
);
export default api;