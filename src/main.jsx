import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import App from './App.jsx'
import Homepage from './components/Homepage.jsx';
import MapPage from './pages/MapPage.jsx';

import './index.css'
import 'leaflet/dist/leaflet.css'

// Định nghĩa các trang
const router = createBrowserRouter([
  {
    path: "/", // Đường dẫn gốc (Trang chủ)
    element: <App />, // Dùng App.jsx làm Layout chung
    children: [
      {
        path: "/", // Trang chủ (Landing page)
        element: <Homepage />,
      },
      {
        path: "ban-do", // Trang Bản đồ (Map page)
        element: <MapPage />,
      },
    ],
  },
]);


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)