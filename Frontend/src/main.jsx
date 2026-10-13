import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App/App.jsx'
import { Provider } from 'react-redux'
import { store } from './App/app.store'

createRoot(document.getElementById('root')).render(
  <Provider store={store}>

    <App />

  </Provider>,
)
