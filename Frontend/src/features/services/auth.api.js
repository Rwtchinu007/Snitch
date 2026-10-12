import axios from "axios";

const authApiInstance = axios.create({
    baseURL: "http://localhost:5000/api/auth",
    withCredentials: true
});

export async function register({ email, contact, password, fullname }){
    const response = await authApiInstance.post("/register",{email,contact,password,fullname});
    return response.data;
}