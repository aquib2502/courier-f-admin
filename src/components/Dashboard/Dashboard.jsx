'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Menu, Bell, Search } from 'lucide-react';

import Sidebar from '@/components/Layout/SideBar';
import UserManagement from '@/components/UserManagement/UserManagement';
import OrderManagement from '@/components/OrderManagement/OrderManagement';
import ManifestRequests from '@/components/ManifestRequests/ManifestRequests';
import Transactions from '@/components/TransactionManagement/TransactionManagement';
import RateManagement from '@/components/RateManagement/RateManagement';
import WalletCredits from '@/components/WalletCredit/WalletCredit';
import Discounts from '@/components/DiscountManagement/DiscountManagement';
import RBFM from '@/components/RBFM/RBFM';
import Clubbing from '../Clubbing/Clubbing';

/**
 * Dashboard Home Component with Mobile Responsive Design
 */
const Dashboard = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // TODO: Replace with actual API call
    // Mock data for demo with mobile-optimized structure
    setTimeout(() => {
      setStats([
        { 
          label: 'Total Orders', 
          value: '1,234', 
          change: '+12%', 
          color: 'bg-blue-500',
          isPositive: true,
          icon: '📦'
        },
        { 
          label: 'Pending Orders', 
          value: '56', 
          change: '-5%', 
          color: 'bg-yellow-500',
          isPositive: false,
          icon: '⏳'
        },
        { 
          label: 'Completed Orders', 
          value: '1,178', 
          change: '+8%', 
          color: 'bg-green-500',
          isPositive: true,
          icon: '✅'
        },
        { 
          label: 'Total Revenue', 
          value: '₹45,678', 
          change: '+15%', 
          color: 'bg-purple-500',
          isPositive: true,
          icon: '💰'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Dashboard</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl shadow-lg animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-3 sm:h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-4 sm:h-6 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-2 sm:h-3 bg-slate-200 rounded w-1/3"></div>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-slate-200 rounded-lg sm:rounded-xl flex-shrink-0"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 sm:space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Dashboard</h1>
        <div className="text-xs sm:text-sm text-slate-600 hidden sm:block">
          Last updated: {new Date().toLocaleString()}
        </div>
        {/* Mobile timestamp */}
        <div className="text-xs text-slate-600 sm:hidden">
          {new Date().toLocaleDateString()}
        </div>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-slate-600 text-xs sm:text-sm mb-1 truncate">{stat.label}</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 mb-1 truncate">{stat.value}</p>
                <p className={`text-xs sm:text-sm font-medium truncate ${
                  stat.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  <span className="hidden sm:inline">{stat.change} from last month</span>
                  <span className="sm:hidden">{stat.change}</span>
                </p>
              </div>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 ${stat.color} rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ml-2`}>
                <span className="text-base sm:text-lg lg:text-xl">{stat.icon}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-8">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6"
        >
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4">Recent Orders</h3>
          <div className="space-y-2 sm:space-y-3">
            {[
              { id: 'ORD001', customer: 'John Doe', status: 'In Transit', amount: '₹250' },
              { id: 'ORD002', customer: 'Jane Smith', status: 'Delivered', amount: '₹180' },
              { id: 'ORD003', customer: 'Bob Wilson', status: 'Pending', amount: '₹320' },
            ].map((order) => (
              <div key={order.id} className="flex items-center justify-between p-2 sm:p-3 hover:bg-slate-50 rounded-lg transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-800 text-sm sm:text-base truncate">{order.id}</p>
                  <p className="text-xs sm:text-sm text-slate-600 truncate">{order.customer}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="font-medium text-slate-800 text-sm sm:text-base">{order.amount}</p>
                  <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                    order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                    order.status === 'In Transit' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6"
        >
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-2 sm:gap-3">
            {[
              { label: 'Add New Order', color: 'bg-blue-600', href: '/add-order' },
              { label: 'Manage Users', color: 'bg-green-600', href: '/users' },
              { label: 'View Reports', color: 'bg-purple-600', href: '/reports' },
              { label: 'Settings', color: 'bg-slate-600', href: '/settings' },
            ].map((action, index) => (
              <button
                key={index}
                className={`w-full ${action.color} text-white p-2.5 sm:p-3 rounded-lg sm:rounded-xl hover:opacity-90 active:opacity-80 transition-opacity font-medium text-sm sm:text-base`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeModule, setActiveModule] = useState(null);
  const [role, setRole] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const decodeToken = useCallback((token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    // run once on mount
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/');
      return;
    }

    const decoded = decodeToken(token);

    if (decoded?.role) {
      setRole(decoded.role);

      const initialTabFromUrl = searchParams.get('tab');
      if (initialTabFromUrl) {
        setActiveModule(initialTabFromUrl);
      } else {
        setActiveModule(decoded.role === 'SuperAdmin' ? 'dashboard' : 'users');
      }
    } else {
      localStorage.removeItem('token');
      router.push('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run only once

  // sync activeModule -> URL (avoid loops by not depending on searchParams)
  useEffect(() => {
    if (!activeModule) return;

    const currentTab = searchParams.get('tab');
    if (activeModule !== currentTab) {
      router.replace(`/dashboard?tab=${activeModule}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModule, router]);

  const renderContent = () => {
    switch (activeModule) {
      case 'dashboard': return <Dashboard />;
      case 'users': return <UserManagement />;
      case 'pickup-requests': return <ManifestRequests />;
      case 'orders': return <OrderManagement />;
      case 'transactions': return <Transactions />;
      case 'rates': return <RateManagement />;
      case 'wallet': return <WalletCredits />;
      case 'discounts': return <Discounts />;
      case 'rbfm': return <RBFM />;
      case 'clubbing': return <Clubbing />
      default: return <UserManagement />;
    }
  };

  if (!activeModule) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar 
          activeModule={activeModule} 
          setActiveModule={setActiveModule}
          isMobile={isMobile}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
        />
        
        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Mobile Header */}
          {isMobile && (
            <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Menu size={20} />
                </button>
                <h1 className="font-semibold text-slate-800 truncate mx-3">
                  The Trace Express
                </h1>
                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <Search size={18} />
                  </button>
                  <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <Bell size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Content Area */}
          <div className="p-4 sm:p-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}