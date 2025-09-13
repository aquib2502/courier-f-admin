'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Percent,
  Search,
  Users,
  RefreshCw,
  Save,
  Edit3,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import axios from 'axios';

const DiscountManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [tempDiscountValues, setTempDiscountValues] = useState({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`);
      setUsers(response?.data?.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserDiscount = async (userId, discountRate) => {
    setUpdatingUserId(userId);
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/updateuser/${userId}`, {
        discountRate: parseFloat(discountRate)
      });
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === userId 
            ? { ...user, discountRate: parseFloat(discountRate) }
            : user
        )
      );
      
      // Clear editing state
      setEditingUserId(null);
      setTempDiscountValues(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
      
    } catch (error) {
      console.error('Failed to update user discount:', error);
      // Reset to original value on error
      setTempDiscountValues(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDiscountEdit = (userId) => {
    setEditingUserId(userId);
    const user = users.find(u => u._id === userId);
    setTempDiscountValues(prev => ({
      ...prev,
      [userId]: user?.discountRate || 0
    }));
  };

  const handleDiscountChange = (userId, value) => {
    const discountRate = Math.max(0, Math.min(100, parseFloat(value) || 0));
    setTempDiscountValues(prev => ({
      ...prev,
      [userId]: discountRate
    }));
  };

  const handleSaveDiscount = (userId) => {
    const newValue = tempDiscountValues[userId];
    if (newValue !== undefined) {
      updateUserDiscount(userId, newValue);
    }
  };

  const handleCancelEdit = (userId) => {
    setEditingUserId(null);
    setTempDiscountValues(prev => {
      const updated = { ...prev };
      delete updated[userId];
      return updated;
    });
  };

  const filteredUsers = users.filter(user => 
    user.fullname?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const getUsersWithDiscounts = filteredUsers.filter(user => user.discountRate > 0);
  const getUsersWithoutDiscounts = filteredUsers.filter(user => !user.discountRate || user.discountRate === 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-3 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-200 rounded-2xl mx-auto mb-4 animate-pulse"></div>
            <div className="h-6 sm:h-8 bg-slate-200 rounded w-48 sm:w-64 mx-auto mb-2 animate-pulse"></div>
            <div className="h-3 sm:h-4 bg-slate-200 rounded w-36 sm:w-48 mx-auto animate-pulse"></div>
          </div>
          
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="flex items-center justify-between p-3 sm:p-6 border border-slate-100 rounded-lg sm:rounded-xl animate-pulse">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-200 rounded-full flex-shrink-0"></div>
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="h-3 sm:h-4 bg-slate-200 rounded w-24 sm:w-32"></div>
                      <div className="h-2 sm:h-3 bg-slate-200 rounded w-32 sm:w-48"></div>
                    </div>
                  </div>
                  <div className="w-16 h-8 sm:w-24 sm:h-10 bg-slate-200 rounded-lg flex-shrink-0"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 sm:space-y-8"
        >
          {/* Header */}
          <div className="text-center px-2">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl sm:rounded-2xl mb-4 sm:mb-6">
              <Percent className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
              User Discount Management
            </h1>
            <p className="text-slate-600 text-sm sm:text-base lg:text-lg">
              Manage individual discount rates for your users
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-slate-100"
            >
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-xl sm:text-2xl font-bold text-slate-800">{filteredUsers.length}</div>
                  <div className="text-xs sm:text-sm text-slate-600">Total Users</div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-slate-100"
            >
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-xl sm:text-2xl font-bold text-green-600">{getUsersWithDiscounts.length}</div>
                  <div className="text-xs sm:text-sm text-slate-600">With Discounts</div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-slate-100 sm:col-span-2 lg:col-span-1"
            >
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-xl sm:text-2xl font-bold text-orange-600">{getUsersWithoutDiscounts.length}</div>
                  <div className="text-xs sm:text-sm text-slate-600">No Discounts</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Search and Actions */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-slate-100">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:space-x-4">
              <div className="relative flex-1 max-w-full sm:max-w-md">
                <Search size={18} className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm sm:text-base"
                />
                {userSearchTerm && (
                  <button
                    onClick={() => setUserSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              
              <button 
                onClick={fetchUsers}
                disabled={loading}
                className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 sm:py-3 bg-slate-800 text-white rounded-lg sm:rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-w-0 flex-shrink-0"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Users List */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-100">
              <h3 className="text-lg sm:text-xl font-semibold text-slate-800 flex items-center space-x-2">
                <Users size={18} className="sm:w-5 sm:h-5" />
                <span>Users ({filteredUsers.length})</span>
              </h3>
            </div>
            
            <div className="divide-y divide-slate-100">
              {filteredUsers.map((user) => {
                const isEditing = editingUserId === user._id;
                const isUpdating = updatingUserId === user._id;
                const displayValue = isEditing ? (tempDiscountValues[user._id] || 0) : (user.discountRate || 0);
                
                return (
                  <motion.div
                    key={user._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 sm:p-6 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start sm:items-center justify-between space-x-3">
                      <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-lg">
                            {user.fullname?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          {user.discountRate > 0 && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full flex items-center justify-center">
                              <Percent className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm sm:text-lg font-semibold text-slate-800 truncate">
                            {user.fullname || 'Unknown User'}
                          </h4>
                          <p className="text-xs sm:text-base text-slate-600 truncate">{user.email}</p>
                          {user.discountRate > 0 && (
                            <p className="text-xs sm:text-sm text-green-600 font-medium">
                              {user.discountRate}% discount
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                        {isEditing ? (
                          <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="5"
                                value={displayValue}
                                onChange={(e) => handleDiscountChange(user._id, e.target.value)}
                                className="w-16 sm:w-20 px-2 py-1.5 sm:px-3 sm:py-2 text-right text-sm border border-purple-300 rounded-md sm:rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="0"
                                autoFocus
                              />
                              <span className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-slate-500 text-xs sm:text-sm pointer-events-none">
                                %
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <button
                                onClick={() => handleSaveDiscount(user._id)}
                                disabled={isUpdating}
                                className="p-1.5 sm:p-2 bg-green-100 text-green-600 rounded-md sm:rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 touch-manipulation"
                                title="Save"
                              >
                                {isUpdating ? (
                                  <RefreshCw size={14} className="sm:w-4 sm:h-4 animate-spin" />
                                ) : (
                                  <Save size={14} className="sm:w-4 sm:h-4" />
                                )}
                              </button>
                              
                              <button
                                onClick={() => handleCancelEdit(user._id)}
                                disabled={isUpdating}
                                className="p-1.5 sm:p-2 bg-slate-100 text-slate-600 rounded-md sm:rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 touch-manipulation"
                                title="Cancel"
                              >
                                <X size={14} className="sm:w-4 sm:h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                            <div className={`px-2 py-1 sm:px-4 sm:py-2 rounded-md sm:rounded-lg font-semibold text-xs sm:text-sm ${
                              user.discountRate > 0
                                ? 'bg-green-100 text-green-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {user.discountRate || 0}%
                            </div>
                            
                            <button
                              onClick={() => handleDiscountEdit(user._id)}
                              className="p-1.5 sm:p-2 bg-purple-100 text-purple-600 rounded-md sm:rounded-lg hover:bg-purple-200 transition-colors touch-manipulation"
                              title="Edit Discount"
                            >
                              <Edit3 size={14} className="sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              
              {filteredUsers.length === 0 && !loading && (
                <div className="text-center py-8 sm:py-12 px-4">
                  <Users size={32} className="sm:w-12 sm:h-12 mx-auto text-slate-400 mb-3 sm:mb-4" />
                  <p className="text-slate-600 text-base sm:text-lg font-medium">No users found</p>
                  <p className="text-slate-500 text-sm sm:text-base">Try adjusting your search terms</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DiscountManagement;