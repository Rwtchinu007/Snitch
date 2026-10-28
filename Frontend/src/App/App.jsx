import './App.css'
import { RouterProvider } from 'react-router'
import { routes } from './app.routes'
import { useDispatch } from 'react-redux'
import { useAuth } from '../features/auth/hook/useAuth'
import { setUser } from '../features/auth/state/auth.slice'
import { setUnauthorizedHandler } from './api.client'
import { useEffect } from 'react'

function App() {
  const { handleGetMe } = useAuth();
  const dispatch = useDispatch();

  useEffect(() => {
    // Session expired mid-use: drop the user so protected routes redirect to /login
    setUnauthorizedHandler(() => dispatch(setUser(null)));
    handleGetMe();
  }, [handleGetMe, dispatch]);

  return (
    <RouterProvider router={routes} />
  )
}

export default App
