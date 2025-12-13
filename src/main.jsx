import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import App from './App.jsx'
import Homepage from './pages/Homepage.jsx';
import MapPage from './pages/MapPage.jsx';
import ContactPage from './pages/ContactPage.jsx';

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
      {
        path: "lien-he",
        element: <ContactPage />,
      },

    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)