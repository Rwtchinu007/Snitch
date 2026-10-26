import {useSelector} from "react-redux";
import {useProduct} from "../hook/useProduct";
import { useEffect } from "react";
const Home = () => {
    const products = useSelector((state) => state.products.products);
    const { handleGetAllProducts } = useProduct();
     
    console.log("Products from Redux state:", products);

    useEffect(() => {
        handleGetAllProducts();
    }, [handleGetAllProducts]);

  return <div>Home</div>;
};

export default Home;
