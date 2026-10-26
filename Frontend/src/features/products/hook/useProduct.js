import { createProduct, getSellerProduct, getAllProducts } from "../services/product.api";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { setSellerProducts, setProducts } from "../state/product.slice";


export const useProduct = () => {
    const dispatch = useDispatch();
async function handleCreateProduct(formData) {
    const data = await createProduct(formData);
    return data.product;
}

async function handleGetSellerProducts() {
    const data = await getSellerProduct();
    dispatch(setSellerProducts(data.products));
    return data.products;
}

const handleGetAllProducts = useCallback(async () => {
    const data = await getAllProducts();
    dispatch(setProducts(data.products));
    return data.products;
}, [dispatch]);
    return { handleCreateProduct, handleGetSellerProducts,handleGetAllProducts };
}