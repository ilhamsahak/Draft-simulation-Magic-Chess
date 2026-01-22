import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const redirect = sessionStorage.redirect
if (redirect) {
  sessionStorage.removeItem('redirect')
  history.replaceState(null, null, redirect)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
