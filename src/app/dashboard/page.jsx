'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import Sidebar from '@/components/Layout/SideBar';
import UserManagement from '@/components/UserManagement/UserManagement';
import OrderManagement from '@/components/OrderManagement/OrderManagement';
import DashboardContent from '@/components/Dashboard/Dashboard'; 
import ManifestRequests from '@/components/ManifestRequests/ManifestRequests';
import Transactions from '@/components/TransactionManagement/TransactionManagement';
import RateManagement from '@/components/RateManagement/RateManagement';
import WalletCredits from '@/components/WalletCredit/WalletCredit';
import Discounts from '@/components/DiscountManagement/DiscountManagement';
import RBFM from '@/components/RBFM/RBFM';

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeModule, setActiveModule] = useState(null);
  const [role, setRole] = useState(null);

  /**
   * Decode JWT token manually
   */
  const decodeToken = (token) => {
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
  };

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/'); // Redirect to login
      return;
    }

    const decoded = decodeToken(token);

    if (decoded?.role) {
      setRole(decoded.role);

      // Determine default tab based on role
      const initialTabFromUrl = searchParams.get('tab');

      if (initialTabFromUrl) {
        setActiveModule(initialTabFromUrl);
      } else {
        if (decoded.role === 'SuperAdmin') {
          setActiveModule('dashboard'); // SuperAdmin lands on Dashboard
        } else {
          setActiveModule('users'); // Operator or PickUp lands on User Management
        }
      }
    } else {
      localStorage.removeItem('token');
      router.push('/');
    }
  }, [router, searchParams]);

  /**
   * Sync active module to URL whenever it changes
   */
  useEffect(() => {
    if (activeModule) {
      const currentTab = searchParams.get('tab');
      if (activeModule !== currentTab) {
        const query = new URLSearchParams(searchParams.toString());
        query.set('tab', activeModule);
        router.replace(`/dashboard?${query.toString()}`);
      }
    }
  }, [activeModule, router, searchParams]);

  /**
   * Render content based on active module
   */
  const renderContent = () => {
    switch (activeModule) {
      case 'dashboard': return <DashboardContent />;
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
      {/* Sidebar wrapped in Suspense */}
      <Suspense fallback={<div className="p-6">Loading sidebar...</div>}>
        <Sidebar 
          activeModule={activeModule} 
          setActiveModule={setActiveModule} 
        />
      </Suspense>

      <main className="flex-1 p-6">
        {/* Active module wrapped in Suspense */}
        <Suspense fallback={<div>Loading content...</div>}>
          {renderContent()}
        </Suspense>
      </main>
    </div>
  );
}
