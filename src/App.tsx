import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Itinerary from './components/Itinerary';
import Expenses from './components/Expenses';
import Memories from './components/Memories';
import Settlement from './components/Settlement';
import { ToastProvider } from './components/Toast';
import ParticipantProvider from './components/ParticipantContext';

export default function App() {
  return (
    <ToastProvider>
      <ParticipantProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/itinerary" replace />} />
              <Route path="itinerary" element={<Itinerary />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="settlement" element={<Settlement />} />
              <Route path="memories" element={<Memories />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ParticipantProvider>
    </ToastProvider>
  );
}
