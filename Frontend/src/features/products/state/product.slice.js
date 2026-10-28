import { createSlice } from "@reduxjs/toolkit";

const productSlice = createSlice({
    name: "products",
    initialState: {
        sellerProducts: [],
        products: [],
        // loading:false,
        // error:null
    },
    reducers: {
        setSellerProducts: (state, action) => {
            state.sellerProducts = action.payload;
        },
        removeSellerProduct: (state, action) => {
            state.sellerProducts = state.sellerProducts.filter((p) => p._id !== action.payload);
            state.products = state.products.filter((p) => p._id !== action.payload);
        },
        setProducts:(state,action)=>{
            state.products = action.payload;
        }
        // setLoading:(state,action)=>{
        //     state.loading = action.payload;
        // },
        // setError:(state,action)=>{
        //     state.error = action.payload;
        // }
    }
})

export const {
    setSellerProducts,
    setProducts,
    removeSellerProduct,
} = productSlice.actions;
export default productSlice.reducer;