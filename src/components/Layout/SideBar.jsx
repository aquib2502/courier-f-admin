'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Users,
  FileText,
  Package,
  CreditCard,
  Settings,
  Wallet,
  Plus,
  Percent,
  X,
  LogOut,
  TrendingUp
} from 'lucide-react';

// Map string icon names from backend to Lucide icons
const ICONS = {
  Users,
  FileText,
  Package,
  CreditCard,
  Settings,
  Wallet,
  Plus,
  Percent,
  TrendingUp
};

const Sidebar = ({ activeModule, setActiveModule, isMobile, isOpen, setIsOpen }) => {
  const [user, setUser] = useState(null);
  const [menuItems, setMenuItems] = useState([]); // menu fetched from backend
  const router = useRouter();

  /**
   * Decode JWT token manually (without external libraries like jwt-decode)
   */
  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  };

  /**
   * Fetch menus based on role from backend
   */
  const fetchMenu = async (token) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/roles/menu`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        setMenuItems(data.menu || []);
      } else {
        console.error('Failed to fetch menu:', data.message);
      }
    } catch (error) {
      console.error('Error fetching menu:', error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/'); // Redirect to login
      return;
    }

    const decoded = decodeToken(token);
    if (decoded?.role) {
      setUser({
        name: decoded.name || 'Unknown User',
        email: decoded.email || 'no-email@example.com',
        role: decoded.role,
      });

      // Fetch dynamic menus
      fetchMenu(token);
    } else {
      // If no valid role found, force re-login
      localStorage.removeItem('token');
      router.push('/');
    }
  }, [router]);

  const handleNavigation = (item) => {
    setActiveModule(item.tab); // tab comes directly from backend
    if (isMobile) setIsOpen(false);
    router.push(`/dashboard?tab=${item.tab}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  const sidebarContent = (
    <div className="h-full bg-white shadow-lg flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">The Trace Express</h2>
            <p className="text-sm text-slate-600 mt-1">{user?.role}</p>
          </div>
          {isMobile && (
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = ICONS[item.icon] || Users; // fallback icon
            return (
              <button
                key={item.tab}
                onClick={() => handleNavigation(item)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  activeModule === item.tab
                    ? 'bg-slate-800 text-white shadow-lg'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
            />
            {/* Mobile Sidebar */}
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="fixed left-0 top-0 h-full w-[280px] z-50"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <div className="w-[280px] h-screen sticky top-0">
      {sidebarContent}
    </div>
  );
};

export default Sidebar;
