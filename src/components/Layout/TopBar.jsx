'use client';

import React from 'react';
import { Menu, Search, Bell } from 'lucide-react';

const TopBar = ({ isMobile, setIsOpen }) => {
  return (
    <div className="bg-white shadow-sm border-b border-slate-200 px-6 py-4 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          {isMobile && (
            <button 
              onClick={() => setIsOpen(true)} 
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
          )}
          
          {/* Search Bar */}
          <div className="relative">
            <Search 
              size={20} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" 
            />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 w-80 max-w-full"
            />
          </div>
        </div>
        
        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="p-2 hover:bg-slate-100 rounded-xl relative transition-colors">
            <Bell size={20} className="text-slate-600" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
          </button>
          
          {/* Profile Button - Optional */}
          <div className="hidden md:flex items-center space-x-2">
            <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );

  
};

export default TopBar;