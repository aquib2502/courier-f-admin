'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  IndianRupee,
  Search,
  Users,
  RefreshCw,
  Save,
  Edit3,
  CheckCircle,
  AlertCircle,
  X,
  Package,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import axios from 'axios';

const DiscountManagement = () => {
  // State
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [tempDiscountValues, setTempDiscountValues] = useState({});

  // Packages by country
  const packagesByCountry = {
    'United States': ['Super Saver', 'Direct', 'USPS Special', 'First Class', 'Premium', 'Express', 'Self'],
    'United Kingdom': ['Direct', 'First Class', 'Premium'],
    'Canada': ['Direct', 'First Class', 'Premium', 'Special'],
    'Australia': ['Direct'],
    'European Union': ['Direct', 'Direct Yun', 'Premium DPD', 'Worldwide']
  };

  // Flatten all packages for default structure
  const getAllPackages = () => {
    const packages = {};
    Object.entries(packagesByCountry).forEach(([country, countryPackages]) => {
      countryPackages.forEach(pkg => {
        packages[`${country}-${pkg}`] = 0;
      });
    });
    return packages;
  };

  // Fetch users from API
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`);
      let rawUsers = Array.isArray(response?.data?.users) ? response.data.users : [response?.data?.user];

      // Clean packageDiscounts to ensure plain object
      const cleanedUsers = rawUsers.map(user => {
        let pkgDiscounts = user.packageDiscounts || {};
        if (pkgDiscounts instanceof Map) {
          pkgDiscounts = Object.fromEntries(pkgDiscounts);
        } else if (typeof pkgDiscounts !== 'object' || Array.isArray(pkgDiscounts)) {
          try {
            pkgDiscounts = JSON.parse(pkgDiscounts);
          } catch {
            pkgDiscounts = {};
          }
        }
        return { ...user, packageDiscounts: pkgDiscounts };
      });

      setUsers(cleanedUsers.filter(u => u.kycStatus === "approved"));
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Update user discounts
  const updateUserDiscount = async (userId, packageDiscounts) => {
    setUpdatingUserId(userId);
    try {
      // Only send non-zero discounts
      const nonZeroDiscounts = Object.entries(packageDiscounts)
        .filter(([_, value]) => value > 0)
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/user/updateuser/${userId}`, {
        packageDiscounts: nonZeroDiscounts
      });

      // Update local state
      setUsers(prev => prev.map(user => user._id === userId 
        ? { ...user, packageDiscounts: nonZeroDiscounts } 
        : user
      ));

      // Clear editing state
      setEditingUserId(null);
      setTempDiscountValues(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    } catch {
      // Reset temp values on error
      setTempDiscountValues(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Start editing discounts
  const handleDiscountEdit = (userId) => {
    setEditingUserId(userId);
    setExpandedUserId(userId);

    const user = users.find(u => u._id === userId);
    const currentDiscounts = { ...getAllPackages(), ...(user?.packageDiscounts || {}) };
    setTempDiscountValues(prev => ({ ...prev, [userId]: currentDiscounts }));
  };

  // Change discount value for a package
  const handlePackageDiscountChange = (userId, packageKey, value) => {
    const discountValue = Math.max(0, parseInt(value) || 0);
    setTempDiscountValues(prev => ({
      ...prev,
      [userId]: { ...(prev[userId] || getAllPackages()), [packageKey]: discountValue }
    }));
  };

  // Save discount changes
  const handleSaveDiscount = (userId) => {
    const newValue = tempDiscountValues[userId];
    if (newValue) updateUserDiscount(userId, newValue);
  };

  // Cancel editing
  const handleCancelEdit = (userId) => {
    setEditingUserId(null);
    setTempDiscountValues(prev => {
      const updated = { ...prev };
      delete updated[userId];
      return updated;
    });
  };

  // Expand/collapse user packages
  const toggleUserExpand = (userId) => {
    setExpandedUserId(expandedUserId === userId ? null : userId);
  };

  // Utility: total discount
  const getTotalDiscount = (packageDiscounts) => {
    if (!packageDiscounts || typeof packageDiscounts !== 'object') return 0;
    return Object.values(packageDiscounts)
      .filter(v => typeof v === 'number')
      .reduce((sum, val) => sum + val, 0);
  };

  // Utility: count active discounts
  const getActiveDiscountsCount = (packageDiscounts) => {
    if (!packageDiscounts || typeof packageDiscounts !== 'object') return 0;
    return Object.values(packageDiscounts).filter(v => v > 0).length;
  };

  // Filtered users by search
  const filteredUsers = users.filter(user => 
    user.fullname?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  // Users with/without discounts
  const getUsersWithDiscounts = filteredUsers.filter(u => getActiveDiscountsCount(u.packageDiscounts) > 0);
  const getUsersWithoutDiscounts = filteredUsers.filter(u => getActiveDiscountsCount(u.packageDiscounts) === 0);

  // Loading skeleton
  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-3 sm:p-6 flex justify-center items-center">
      <RefreshCw size={32} className="animate-spin text-slate-400" />
    </div>
  );


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
              <IndianRupee className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
              Package Discount Management
            </h1>
            <p className="text-slate-600 text-sm sm:text-base lg:text-lg">
              Manage package-specific discounts for KYC approved users (in ₹)
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
                  <div className="text-xs sm:text-sm text-slate-600">KYC Approved Users</div>
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
                const isExpanded = expandedUserId === user._id;
                
                // For display: merge defaults with actual discounts
                const displayValue = isEditing 
                  ? (tempDiscountValues[user._id] || { ...getAllPackages(), ...(user.packageDiscounts || {}) }) 
                  : { ...getAllPackages(), ...(user.packageDiscounts || {}) };
                
                const activeDiscountsCount = getActiveDiscountsCount(user.packageDiscounts);
                const totalDiscount = getTotalDiscount(user.packageDiscounts);
                
                return (
                  <motion.div
                    key={user._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {/* User Header */}
                    <div className="p-4 sm:p-6">
                      <div className="flex items-start sm:items-center justify-between space-x-3">
                        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                          <div className="relative flex-shrink-0">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-lg">
                              {user.fullname?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            {activeDiscountsCount > 0 && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">{activeDiscountsCount}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm sm:text-lg font-semibold text-slate-800 truncate">
                              {user.fullname || 'Unknown User'}
                            </h4>
                            <p className="text-xs sm:text-base text-slate-600 truncate">{user.email}</p>
                            {totalDiscount > 0 && (
                              <p className="text-xs sm:text-sm text-green-600 font-medium flex items-center gap-1">
                                <IndianRupee size={12} />
                                Total: ₹{totalDiscount} across {activeDiscountsCount} packages
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {!isEditing && (
                            <>
                              <button
                                onClick={() => toggleUserExpand(user._id)}
                                className="p-1.5 sm:p-2 bg-blue-100 text-blue-600 rounded-md sm:rounded-lg hover:bg-blue-200 transition-colors touch-manipulation"
                                title={isExpanded ? "Collapse" : "Expand"}
                              >
                                {isExpanded ? <ChevronUp size={14} className="sm:w-4 sm:h-4" /> : <ChevronDown size={14} className="sm:w-4 sm:h-4" />}
                              </button>
                              <button
                                onClick={() => handleDiscountEdit(user._id)}
                                className="p-1.5 sm:p-2 bg-purple-100 text-purple-600 rounded-md sm:rounded-lg hover:bg-purple-200 transition-colors touch-manipulation"
                                title="Edit Discounts"
                              >
                                <Edit3 size={14} className="sm:w-4 sm:h-4" />
                              </button>
                            </>
                          )}
                          {isEditing && (
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
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Package Discounts */}
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-4 sm:px-6 pb-4 sm:pb-6"
                      >
                        <div className="bg-slate-50 rounded-lg sm:rounded-xl p-3 sm:p-4 space-y-3 sm:space-y-4">
                          {Object.entries(packagesByCountry).map(([country, packages]) => (
                            <div key={country} className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Package size={14} className="text-slate-600 sm:w-4 sm:h-4" />
                                <h5 className="text-xs sm:text-sm font-semibold text-slate-700">{country}</h5>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 ml-5 sm:ml-6">
                                {packages.map(pkg => {
                                  const packageKey = `${country}-${pkg}`;
                                  const value = displayValue[packageKey] || 0;
                                  return (
                                    <div key={packageKey} className="flex items-center justify-between bg-white rounded-md sm:rounded-lg p-2 sm:p-3 border border-slate-200">
                                      <span className="text-xs sm:text-sm text-slate-700 font-medium truncate mr-2">{pkg}</span>
                                      {isEditing ? (
                                        <div className="relative flex items-center">
                                          <IndianRupee size={12} className="absolute left-2 text-slate-500" />
                                          <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={value}
                                            onChange={(e) => handlePackageDiscountChange(user._id, packageKey, e.target.value)}
                                            className="w-20 sm:w-24 pl-6 pr-2 py-1 text-xs sm:text-sm text-right border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                          />
                                        </div>
                                      ) : (
                                        <span className={`text-xs sm:text-sm font-semibold flex items-center ${value > 0 ? 'text-green-600' : 'text-slate-400'}`}>
                                          <IndianRupee size={12} />
                                          {value}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
              
              {filteredUsers.length === 0 && !loading && (
                <div className="text-center py-8 sm:py-12 px-4">
                  <Users size={32} className="sm:w-12 sm:h-12 mx-auto text-slate-400 mb-3 sm:mb-4" />
                  <p className="text-slate-600 text-base sm:text-lg font-medium">No KYC approved users found</p>
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