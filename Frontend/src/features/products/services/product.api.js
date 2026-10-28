import { apiClient } from "../../../App/api.client";

export async function createProduct(formData, onUploadProgress){
    const response = await apiClient.post("/products", formData, { onUploadProgress });
    return response.data;
}

export async function updateProduct(productId, formData, onUploadProgress){
    const response = await apiClient.put(`/products/${productId}`, formData, { onUploadProgress });
    return response.data;
}

export async function deleteProduct(productId){
    const response = await apiClient.delete(`/products/${productId}`);
    return response.data;
}

export async function getSellerProduct(){
    const response = await apiClient.get("/products/seller");
    return response.data;
}

export async function getAllProducts(){
    const response = await apiClient.get("/products");
    return response.data;
}

export async function getProductById(productId){
    const response = await apiClient.get(`/products/detail/${productId}`);
    return response.data;
}
