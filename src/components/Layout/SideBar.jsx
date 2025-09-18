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
  TrendingUp,
  SquaresExclude,
  Menu,
  ShieldAlert
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
  TrendingUp,
  SquaresExclude,
  ShieldAlert
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
   * only update state if data actually changed to avoid re-renders
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
      const newMenu = data?.menu || [];

      if (res.ok) {
        setMenuItems(prev => {
          try {
            return JSON.stringify(prev) !== JSON.stringify(newMenu) ? newMenu : prev;
          } catch {
            return newMenu;
          }
        });
      } else {
        console.error('Failed to fetch menu:', data?.message || data);
      }
    } catch (error) {
      console.error('Error fetching menu:', error);
    }
  };

  useEffect(() => {
    // run only once on mount
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    const decoded = decodeToken(token);

    if (decoded?.role) {
      // update user only if different
      const newUser = {
        name: decoded.name || 'Unknown User',
        email: decoded.email || 'no-email@example.com',
        role: decoded.role,
      };

      setUser(prev => {
        try {
          return JSON.stringify(prev) !== JSON.stringify(newUser) ? newUser : prev;
        } catch {
          return newUser;
        }
      });

      // fetch menu once
      fetchMenu(token);
    } else {
      localStorage.removeItem('token');
      router.push('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run only once

  const handleNavigation = (item) => {
    setActiveModule(item.tab); // tab comes directly from backend
    if (isMobile) setIsOpen(false);
    // update URL - parent may also sync URL, so this is just navigation
    router.push(`/dashboard?tab=${item.tab}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (isMobile && isOpen) {
      const handleClickOutside = () => setIsOpen(false);
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isMobile, isOpen, setIsOpen]);

  const sidebarContent = (
    <div 
      className="h-full bg-white shadow-lg flex flex-col"
      onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside sidebar
    >
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 truncate">
              The Trace Express
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 truncate">
              {user?.role || 'Loading...'}
            </p>
          </div>
          {isMobile && (
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0 ml-2"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* User Info - Mobile Only */}
      {isMobile && user && (
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="text-sm">
            <p className="font-medium text-slate-800 truncate">{user.name}</p>
            <p className="text-slate-600 truncate">{user.email}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 sm:p-4 overflow-y-auto hide-scrollbar">

        <div className="space-y-1 sm:space-y-2">
          {menuItems.map((item) => {
            const Icon = ICONS[item.icon] || Users; // fallback icon
            return (
              <button
                key={item.tab}
                onClick={() => handleNavigation(item)}
                className={`w-full flex items-center space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 ${
                  activeModule === item.tab
                    ? 'bg-slate-800 text-white shadow-lg'
                    : 'text-slate-700 hover:bg-slate-100 active:bg-slate-200'
                }`}
              >
                <Icon size={isMobile ? 18 : 20} className="flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base truncate">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Logout */}
      <div className="p-3 sm:p-4 border-t border-slate-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors duration-200"
        >
          <LogOut size={isMobile ? 18 : 20} className="flex-shrink-0" />
          <span className="font-medium text-sm sm:text-base">Logout</span>
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
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
            />
            {/* Mobile Sidebar */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ 
                type: 'tween',
                duration: 0.3,
                ease: 'easeInOut'
              }}
              className="fixed left-0 top-0 h-full w-[280px] max-w-[80vw] z-50"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <div className="w-[240px] lg:w-[280px] h-screen sticky top-0 hidden md:block">
      {sidebarContent}
    </div>
  );
};

export default Sidebar;