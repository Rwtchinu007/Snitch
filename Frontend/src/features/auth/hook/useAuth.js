import { setLoading, setUser } from "../state/auth.slice";
import { register, login, getMe, logout } from "../services/auth.api"
import { setSellerProducts } from "../../products/state/product.slice";
import { useCallback } from "react";
import { useDispatch } from "react-redux";



export const useAuth = () => {
    const dispatch = useDispatch();

    const handleRegister = useCallback(async ({ email, contact, password, fullname, isSeller = false }) => {
        const data = await register({ email, contact, password, fullname, isSeller });
        dispatch(setUser(data.user))
        return data.user;
    }, [dispatch]);


    const handleLogin = useCallback(async ({ email, password }) => {
        const data = await login({ email, password });
        dispatch(setUser(data.user))
        dispatch(setLoading(false))
        return data.user;
    }, [dispatch]);

    const handleGetMe = useCallback(async () => {
        try {
            dispatch(setLoading(true));
            const data = await getMe();
            dispatch(setUser(data.user))
        } catch {
            // 401 just means "not logged in"
            dispatch(setUser(null));
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    const handleLogout = useCallback(async () => {
        try {
            await logout();
        } finally {
            dispatch(setUser(null));
            dispatch(setSellerProducts([]));
        }
    }, [dispatch]);

    return { handleRegister, handleLogin, handleGetMe, handleLogout }
}
