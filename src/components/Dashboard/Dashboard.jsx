'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Menu, Bell, Search, Save, StickyNote } from 'lucide-react';

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
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import DisputeForm from '../Dispute/Dispute';

/**
 * Dashboard Home Component with Mobile Responsive Design
 */
const Dashboard = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [title, setTitle] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  
  const fetchOrdersData = async () => {
  try {
    setLoading(true);
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/total`);

    if (response.status === 200 && response.data?.data) {
      const orders = response.data.data; // <-- Array of orders

      // Total orders count
      const totalOrders = orders.length;

      // Create counts for each status
      const statuses = [
        'Drafts',
        'Ready',
        'Packed',
        'Manifested',
        'Shipped',
        'Delivered',
        'Cancelled',
        'Refunded',
      ];

      const statusCounts = statuses.reduce((acc, status) => {
        acc[status] = orders.filter(order => order.orderStatus === status).length;
        return acc;
      }, {});

      // Update state
      setOrderData({ totalOrders, statusCounts });

      // Update stats cards
      const processedStats = [
        {
          label: 'Total Orders',
          value: totalOrders,
          change: '+12%',
          color: 'bg-blue-500',
          isPositive: true,
          icon: '📦',
        },
        {
          label: 'Ready/Packed Orders',
          value: statusCounts.Ready + statusCounts.Packed,
          change: '+8%',
          color: 'bg-green-500',
          isPositive: true,
          icon: '✅',
        },
        {
          label: 'Shipped Orders',
          value: statusCounts.Shipped,
          change: '+15%',
          color: 'bg-purple-500',
          isPositive: true,
          icon: '🚚',
        },
        {
          label: 'Manifested Orders',
          value: statusCounts.Manifested,
          change: '-5%',
          color: 'bg-yellow-500',
          isPositive: false,
          icon: '⏳',
        },
      ];

      setStats(processedStats);
    }
  } catch (error) {
    console.error('Error fetching orders data:', error);
    toast.error('Failed to fetch orders data');

  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchOrdersData();
  }, []);

  const addNote = async () => {
    if (!note.trim() || !title.trim()) {
      toast.warning('Please enter both title and note content');
      return;
    }

    try {
      setNoteLoading(true);
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/addnote`, {
        content: note,
        title
      });

      if (response.status === 201) {
        toast.success('Note added successfully');
        setNote('');
        setTitle('');
      } else {
        toast.info('Note submitted successfully');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Error adding note');
      console.error('Error adding note:', error?.response?.data?.message || error.message);
    } finally {
      setNoteLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      addNote();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800">Dashboard</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-white p-4 sm:p-6 rounded-xl shadow-lg animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-6 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                  </div>
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-slate-200 rounded-xl flex-shrink-0"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        className="z-50"
      />
      
      <div className="p-3 sm:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 sm:space-y-6 lg:space-y-8"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800">Dashboard</h1>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                <span className="hidden sm:inline">Last updated:</span>
                <span>{new Date().toLocaleString()}</span>
              </div>
            </div>
            
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1 mr-3">
                      <p className="text-slate-600 text-xs sm:text-sm mb-2 font-medium">{stat.label}</p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 mb-2">{stat.value}</p>
                      <p className={`text-xs sm:text-sm font-medium flex items-center gap-1 ${
                        stat.isPositive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <span>{stat.isPositive ? '↗' : '↘'}</span>
                        <span className="hidden sm:inline">{stat.change} from last month</span>
                        <span className="sm:hidden">{stat.change}</span>
                      </p>
                    </div>
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 ${stat.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
                      <span className="text-lg sm:text-xl lg:text-2xl">{stat.icon}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Order Status Breakdown
            {orderData && orderData.statusCounts && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-xl shadow-lg p-4 sm:p-6"
              >
                <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <span>📊</span>
                  Order Status Breakdown
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {['Drafts', 'Ready', 'Packed', 'Manifested', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'].map((status) => (
                    <div key={status} className="bg-gray-50 p-3 sm:p-4 rounded-lg text-center hover:bg-gray-100 transition-colors">
                      <p className="text-lg sm:text-xl font-bold text-slate-800">{orderData.statusCounts[status] || 0}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">{status}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )} */}

            {/* Notes Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl shadow-lg p-4 sm:p-6"
            >
              <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <StickyNote className="w-5 h-5" />
                Add Note
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="note-title" className="block text-sm font-medium text-slate-700">
                    Note Title
                  </label>
                  <input
                    id="note-title"
                    type="text"
                    placeholder="Enter note title..."
                    className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="note-content" className="block text-sm font-medium text-slate-700">
                    Note Content
                  </label>
                  <textarea
                    id="note-content"
                    placeholder="Enter your note here..."
                    rows={4}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-vertical text-sm sm:text-base"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <p className="text-xs text-slate-500">
                    Tip: Press Ctrl+Enter to save quickly
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={addNote}
                  disabled={noteLoading || !note.trim() || !title.trim()}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium text-sm sm:text-base transition-all duration-200 flex items-center justify-center gap-2 min-w-[120px]"
                >
                  {noteLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Note
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
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
      case 'inward-scan': return <DisputeForm />
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