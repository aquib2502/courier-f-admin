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
  AlertCircle
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-slate-200 rounded-2xl mx-auto mb-4 animate-pulse"></div>
            <div className="h-8 bg-slate-200 rounded w-64 mx-auto mb-2 animate-pulse"></div>
            <div className="h-4 bg-slate-200 rounded w-48 mx-auto animate-pulse"></div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="flex items-center justify-between p-6 border border-slate-100 rounded-xl animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-32"></div>
                      <div className="h-3 bg-slate-200 rounded w-48"></div>
                    </div>
                  </div>
                  <div className="w-24 h-10 bg-slate-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl mb-6">
              <Percent className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">User Discount Management</h1>
            <p className="text-slate-600 text-lg">Manage individual discount rates for your users</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-800">{filteredUsers.length}</div>
                  <div className="text-sm text-slate-600">Total Users</div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{getUsersWithDiscounts.length}</div>
                  <div className="text-sm text-slate-600">With Discounts</div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{getUsersWithoutDiscounts.length}</div>
                  <div className="text-sm text-slate-600">No Discounts</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Search and Actions */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
              
              <button 
                onClick={fetchUsers}
                disabled={loading}
                className="inline-flex items-center space-x-2 px-4 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Users List */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-semibold text-slate-800 flex items-center space-x-2">
                <Users size={20} />
                <span>User Discount Rates ({filteredUsers.length})</span>
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
                    className="p-6 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                            {user.fullname?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          {user.discountRate > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                              <Percent className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-slate-800">
                            {user.fullname || 'Unknown User'}
                          </h4>
                          <p className="text-slate-600">{user.email}</p>
                          {user.discountRate > 0 && (
                            <p className="text-sm text-green-600 font-medium">
                              Active discount: {user.discountRate}%
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {isEditing ? (
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="5"
                                value={displayValue}
                                onChange={(e) => handleDiscountChange(user._id, e.target.value)}
                                className="w-24 px-3 py-2 text-right border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="0"
                                autoFocus
                              />
                              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 text-sm pointer-events-none">
                                %
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleSaveDiscount(user._id)}
                                disabled={isUpdating}
                                className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                                title="Save"
                              >
                                {isUpdating ? (
                                  <RefreshCw size={16} className="animate-spin" />
                                ) : (
                                  <Save size={16} />
                                )}
                              </button>
                              
                              <button
                                onClick={() => handleCancelEdit(user._id)}
                                disabled={isUpdating}
                                className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                                title="Cancel"
                              >
                                <AlertCircle size={16} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-3">
                            <div className={`px-4 py-2 rounded-lg font-semibold ${
                              user.discountRate > 0
                                ? 'bg-green-100 text-green-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {user.discountRate || 0}%
                            </div>
                            
                            <button
                              onClick={() => handleDiscountEdit(user._id)}
                              className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                              title="Edit Discount"
                            >
                              <Edit3 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              
              {filteredUsers.length === 0 && !loading && (
                <div className="text-center py-12">
                  <Users size={48} className="mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-600 text-lg">No users found</p>
                  <p className="text-slate-500">Try adjusting your search terms</p>
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