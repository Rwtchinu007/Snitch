import { createBrowserRouter } from "react-router";
import Register from "../features/auth/pages/Register";
import Login from "../features/auth/pages/Login";
import CreateProduct from "../features/products/pages/CreateProduct";

export const routes = createBrowserRouter([
    {
        path: "/",
    },
    {
        path: "/seller/create-product",
        element: <CreateProduct />
    },
    {
        path: "/products/create",
        element: <CreateProduct />
    },
    {
        path: "/products/new",
        element: <CreateProduct />
    },
    {
        path: "/register",
        element: <Register />
    },
    {
        path: "/login",
        element: <Login />
    }
])