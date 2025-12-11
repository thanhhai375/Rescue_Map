import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import App from './App.jsx'
import Homepage from './pages/Homepage.jsx';
import MapPage from './pages/MapPage.jsx';
import ContactPage from './pages/ContactPage.jsx'; // Dòng này đang bị mờ

import './index.css'
import 'leaflet/dist/leaflet.css'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <Homepage />,
      },
      {
        path: "ban-do",
        element: <MapPage />,
      },
      // 👇 BẠN ĐANG THIẾU ĐOẠN NÀY NÊN NÓ MỚI MỜ 👇
      {
        path: "lien-he",
        element: <ContactPage />, // <--- Đây là lúc bạn "dùng" nó
      },
      // 👆 HÃY THÊM ĐOẠN TRÊN VÀO 👆
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)