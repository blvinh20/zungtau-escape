import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Bell, Settings, Compass, Wallet, Image as ImageIcon } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Layout() {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-background/70 backdrop-blur-md shadow-[0_12px_32px_rgba(28,28,17,0.06)]">
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <div className="text-2xl font-bold tracking-tighter text-primary font-headline">
            Vũng Tàu Escape
          </div>
          <div className="hidden md:flex items-center space-x-8 font-headline font-bold tracking-tight">
            <NavLink
              to="/itinerary"
              className={({ isActive }) =>
                cn(
                  "transition-colors duration-300",
                  isActive ? "text-primary border-b-2 border-primary pb-1" : "text-secondary opacity-80 hover:text-primary"
                )
              }
            >
              Itinerary
            </NavLink>
            <NavLink
              to="/expenses"
              className={({ isActive }) =>
                cn(
                  "transition-colors duration-300",
                  isActive ? "text-primary border-b-2 border-primary pb-1" : "text-secondary opacity-80 hover:text-primary"
                )
              }
            >
              Expenses
            </NavLink>
            <NavLink
              to="/memories"
              className={({ isActive }) =>
                cn(
                  "transition-colors duration-300",
                  isActive ? "text-primary border-b-2 border-primary pb-1" : "text-secondary opacity-80 hover:text-primary"
                )
              }
            >
              Memories
            </NavLink>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-primary hover:opacity-70 transition-opacity">
              <Bell size={24} />
            </button>
            <button className="text-primary hover:opacity-70 transition-opacity">
              <Settings size={24} />
            </button>
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjv_hio9mMYMqFkDm9eZXTJ8Hs2mxKr0nwu4QhNmO_kmAB-WpRwgFw-qweppxxt-n2dfL8vTrQW4MDumrZsIsKD7-PjXeX6aDtHNleXK_5Q1NkiLQ2FymNJ7HhQpZGOvFHMfUSUcZ5TWV6LCo7EZjdp78v4DYB1YVQ-ygA-8V2uaRfc88xWt3zf3sEiUN5IHuRSYPkMFxqpSRwbKS4BxTmhezVDnl2UuZG3bv_sSD47WEHHGYIRDdio4CtrStCPkDTkh8vYOcgZ0I"
                alt="User profile"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="pt-20 pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* Bottom Navigation Bar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-4 pt-2 bg-background/70 backdrop-blur-md shadow-[0_-8px_24px_rgba(28,28,17,0.04)] z-50 rounded-t-[1rem]">
        <NavLink
          to="/itinerary"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center px-4 py-1.5 transition-all duration-200 rounded-xl",
              isActive ? "bg-primary text-on-primary" : "text-secondary hover:bg-surface-container"
            )
          }
        >
          <Compass size={24} />
          <span className="text-[10px] font-semibold mt-1">Trip</span>
        </NavLink>
        <NavLink
          to="/expenses"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center px-4 py-1.5 transition-all duration-200 rounded-xl",
              isActive ? "bg-primary text-on-primary" : "text-secondary hover:bg-surface-container"
            )
          }
        >
          <Wallet size={24} />
          <span className="text-[10px] font-semibold mt-1">Split</span>
        </NavLink>
        <NavLink
          to="/memories"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center px-4 py-1.5 transition-all duration-200 rounded-xl",
              isActive ? "bg-primary text-on-primary" : "text-secondary hover:bg-surface-container"
            )
          }
        >
          <ImageIcon size={24} />
          <span className="text-[10px] font-semibold mt-1">Gallery</span>
        </NavLink>
      </nav>
    </div>
  );
}
