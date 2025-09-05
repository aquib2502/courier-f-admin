'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

import Sidebar from '@/components/Layout/SideBar';
import UserManagement from '@/components/UserManagement/UserManagement';
import OrderManagement from '@/components/OrderManagement/OrderManagement';
import ManifestRequests from '@/components/ManifestRequests/ManifestRequests';
import Transactions from '@/components/TransactionManagement/TransactionManagement';
import RateManagement from '@/components/RateManagement/RateManagement';
import WalletCredits from '@/components/WalletCredit/WalletCredit';
import Discounts from '@/components/DiscountManagement/DiscountManagement';
import RBFM from '@/components/RBFM/RBFM';

/**
 * NOTE:
 * Previously this file imported itself which caused infinite recursion.
 * If you have a dedicated dashboard main component (e.g. DashboardMain.jsx),
 * replace the inline DashboardHome below with that import.
 */

const Dashboard = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // TODO: Replace with actual API call
    // const fetchStats = async () => {
    //   try {
    //     const response = await axios.get('/api/dashboard/stats');
    //     setStats(response.data);
    //   } catch (error) {
    //     console.error('Failed to fetch stats:', error);
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchStats();
    
    // Mock data for demo
    setTimeout(() => {
      setStats([
        { 
          label: 'Total Orders', 
          value: '1,234', 
          change: '+12%', 
          color: 'bg-blue-500',
          isPositive: true
        },
        { 
          label: 'Pending Orders', 
          value: '56', 
          change: '-5%', 
          color: 'bg-yellow-500',
          isPositive: false
        },
        { 
          label: 'Completed Orders', 
          value: '1,178', 
          change: '+8%', 
          color: 'bg-green-500',
          isPositive: true
        },
        { 
          label: 'Total Revenue', 
          value: '₹45,678', 
          change: '+15%', 
          color: 'bg-purple-500',
          isPositive: true
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-white p-6 rounded-2xl shadow-lg animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-24"></div>
                  <div className="h-6 bg-slate-200 rounded w-16"></div>
                  <div className="h-3 bg-slate-200 rounded w-12"></div>
                </div>
                <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
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
      className="space-y-6"
    >
        {/* Header */}
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <div className="text-sm text-slate-600">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-800 mb-1">{stat.value}</p>
                <p className={`text-sm font-medium ${
                  stat.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change} from last month
                </p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                <div className="w-6 h-6 bg-white bg-opacity-30 rounded"></div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {[
              { id: 'ORD001', customer: 'John Doe', status: 'In Transit', amount: '₹250' },
              { id: 'ORD002', customer: 'Jane Smith', status: 'Delivered', amount: '₹180' },
              { id: 'ORD003', customer: 'Bob Wilson', status: 'Pending', amount: '₹320' },
            ].map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
                <div>
                  <p className="font-medium text-slate-800">{order.id}</p>
                  <p className="text-sm text-slate-600">{order.customer}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-slate-800">{order.amount}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
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
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            {[
              { label: 'Add New Order', color: 'bg-blue-600', href: '/add-order' },
              { label: 'Manage Users', color: 'bg-green-600', href: '/users' },
              { label: 'View Reports', color: 'bg-purple-600', href: '/reports' },
              { label: 'Settings', color: 'bg-slate-600', href: '/settings' },
            ].map((action, index) => (
              <button
                key={index}
                className={`w-full ${action.color} text-white p-3 rounded-xl hover:opacity-90 transition-opacity font-medium`}
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
      default: return <UserManagement />;
    }
  };

  if (!activeModule) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar activeModule={activeModule} setActiveModule={setActiveModule} />
      <main className="flex-1 p-6">
        {renderContent()}
      </main>
    </div>
  );
}
