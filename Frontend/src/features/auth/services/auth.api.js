import { apiClient } from "../../../App/api.client";

export async function register({ email, contact, password, fullname, isSeller = false }) {
    const response = await apiClient.post("/auth/register", { email, contact, password, fullname, isSeller });
    return response.data;
}

export async function login({ email, password }) {
    const response = await apiClient.post("/auth/login", { email, password });
    return response.data;
}

export async function getMe() {
    const response = await apiClient.get("/auth/me");
    return response.data;
}

export async function logout() {
    const response = await apiClient.post("/auth/logout");
    return response.data;
}
