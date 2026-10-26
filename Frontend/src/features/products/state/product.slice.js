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
} = productSlice.actions;
export default productSlice.reducer;