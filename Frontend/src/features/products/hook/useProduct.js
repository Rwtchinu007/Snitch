import { createProduct, updateProduct, deleteProduct, getSellerProduct, getAllProducts, getProductById, createVariant, updateVariant, deleteVariant } from "../services/product.api";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { setSellerProducts, setProducts, removeSellerProduct } from "../state/product.slice";


export const useProduct = () => {
    const dispatch = useDispatch();

    const handleCreateProduct = useCallback(async (formData, onUploadProgress) => {
        const data = await createProduct(formData, onUploadProgress);
        return data.product;
    }, []);

    const handleUpdateProduct = useCallback(async (productId, formData, onUploadProgress) => {
        const data = await updateProduct(productId, formData, onUploadProgress);
        return data.product;
    }, []);

    const handleDeleteProduct = useCallback(async (productId) => {
        await deleteProduct(productId);
        dispatch(removeSellerProduct(productId));
    }, [dispatch]);

    const handleGetSellerProducts = useCallback(async () => {
        const data = await getSellerProduct();
        dispatch(setSellerProducts(data.products));
        return data.products;
    }, [dispatch]);

    const handleGetProductById = useCallback(async (productId) => {
        const data = await getProductById(productId);
        return data.product;
    }, []);

    const handleGetAllProducts = useCallback(async () => {
        const data = await getAllProducts();
        dispatch(setProducts(data.products));
        return data.products;
    }, [dispatch]);

    const handleCreateVariant = useCallback(async (productId, formData, onUploadProgress) => {
        const data = await createVariant(productId, formData, onUploadProgress);
        return data.variant;
    }, []);

    const handleUpdateVariant = useCallback(async (productId, variantId, formData, onUploadProgress) => {
        const data = await updateVariant(productId, variantId, formData, onUploadProgress);
        return data.variant;
    }, []);

    const handleDeleteVariant = useCallback(async (productId, variantId) => {
        await deleteVariant(productId, variantId);
    }, []);

    return { handleCreateProduct, handleUpdateProduct, handleDeleteProduct, handleGetSellerProducts, handleGetAllProducts, handleGetProductById, handleCreateVariant, handleUpdateVariant, handleDeleteVariant };
}
