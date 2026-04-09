import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Itinerary from './components/Itinerary';
import Expenses from './components/Expenses';
import Memories from './components/Memories';
import { ToastProvider } from './components/Toast';

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/itinerary" replace />} />
            <Route path="Itinerary" element={<Itinerary />} />
            <Route path="Expenses" element={<Expenses />} />
            <Route path="Memories" element={<Memories />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
