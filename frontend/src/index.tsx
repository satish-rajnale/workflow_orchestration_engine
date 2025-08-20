import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './pages/App'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Builder from './pages/Builder'

const router = createBrowserRouter([
  { path: '/', element: <App /> , children: [
    { path: '/', element: <Dashboard /> },
    { path: '/builder/:id?', element: <Builder /> }
  ]},
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> }
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
