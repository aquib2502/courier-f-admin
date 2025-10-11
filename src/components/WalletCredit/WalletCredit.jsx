'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  User, 
  DollarSign, 
  Plus,
  TrendingUp,
  Calendar,
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  Loader2,
  CreditCard,
  ShoppingBag
} from 'lucide-react';
import axios from 'axios';

const WalletCredit = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showCreditForm, setShowCreditForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [creditAmount, setCreditAmount] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, searchTerm, filterType]);

  const fetchUsers = async () => {
  setLoading(true);
  setError(null);

  try {
    const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`);

    console.log("Fetched data:", data); // <-- Debugging

    // Access the users array properly
    const usersArray = data.users || [];

  
    // ✅ Filter users whose KYC is approved
    const approvedUsers = usersArray.filter(user => user.kycStatus === 'approved');

    setUsers(approvedUsers);
  } catch (err) {
    setError(err.response?.data?.message || err.message || 'Failed to fetch users. Please try again.');
    console.error('Error fetching users:', err);
  } finally {
    setLoading(false);
  }
};

  const applyFilters = () => {
    let filtered = [...users];

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    switch (filterType) {
      case 'creditUsed':
        filtered = filtered.filter(user => user.usedCredit > 0);
        break;
      case 'nearExhaustion':
        filtered = filtered.filter(user => {
          const percentage = (user.usedCredit / user.creditLimit) * 100;
          return percentage >= 80;
        });
        break;
      default:
        break;
    }

    setFilteredUsers(filtered);
  };

 const handleCreditSubmit = async (e) => {
  e.preventDefault();
  if (!selectedUser || !creditAmount) return;

  setSubmitting(true);
  setError(null);

  try {
    const apiUrl = selectedUser.hasCredit
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/update-credit`  // already has credit → update
      : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/give-credit`;   // no credit → give credit

    const method = selectedUser.hasCredit ? 'PUT' : 'POST';

    const response = await fetch(apiUrl, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: selectedUser._id,
        creditLimit: parseFloat(creditAmount),
        resetUsedCredit: selectedUser.hasCredit // optional: reset used credit when updating
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update credit');
    }

    setSuccessMessage(result.message || `Credit updated successfully for ${selectedUser.fullname}!`);
    setTimeout(() => setSuccessMessage(''), 5000);

    await fetchUsers();

    setCreditAmount('');
    setShowCreditForm(false);
    setSelectedUser(null);
  } catch (err) {
    setError(err.message || 'Failed to update credit. Please try again.');
    console.error('Error updating credit:', err);
  } finally {
    setSubmitting(false);
  }
};


  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setCreditAmount(user.creditLimit.toString());
    setShowCreditForm(true);
    setError(null);
  };

 const getNextResetDate = (currentResetDate) => {
  if (!currentResetDate) return 'N/A';
  
  const date = new Date(currentResetDate);
  
  // Add 1 month
  date.setMonth(date.getMonth() + 1);
  
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};


  const getCreditPercentage = (used, limit) => {
    if (limit === 0) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getStatusColor = (percentage) => {
    if (percentage >= 80) return 'bg-red-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 size={48} className="mx-auto text-slate-600 animate-spin mb-4" />
          <p className="text-slate-600 text-lg">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Credit Management</h1>
            <p className="text-slate-600 mt-1">Manage user credit limits and wallets</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-white px-4 py-2 rounded-xl shadow">
            <User size={16} />
            <span>{filteredUsers.length} credit users</span>
          </div>
        </div>

        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3"
            >
              <CheckCircle size={20} className="text-green-600" />
              <p className="text-green-800">{successMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3"
          >
            <AlertCircle size={20} className="text-red-600" />
            <p className="text-red-800">{error}</p>
          </motion.div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
              />
            </div>
            <div className="relative w-full md:w-64">
              <Filter size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 appearance-none bg-white cursor-pointer transition-all"
              >
                <option value="all">All Users</option>
                <option value="creditUsed">Credit Used</option>
                <option value="nearExhaustion">Near Exhaustion (≥80%)</option>
              </select>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showCreditForm && selectedUser && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <div className="bg-gradient-to-r from-slate-600 to-slate-800 px-6 py-4">
                <h3 className="text-lg font-semibold text-white">Update Credit Limit</h3>
                <p className="text-slate-200 text-sm mt-1">for {selectedUser.fullname}</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      New Credit Limit (₹)
                    </label>
                    <div className="relative">
                      <DollarSign size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={creditAmount}
                        onChange={(e) => setCreditAmount(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500"
                        placeholder="Enter credit limit"
                      />
                    </div>
                    <p className="text-sm text-slate-500 mt-2">
                      Current limit: ₹{selectedUser.creditLimit.toFixed(2)}
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreditForm(false);
                        setSelectedUser(null);
                        setCreditAmount('');
                      }}
                      className="flex-1 px-6 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                   <button
  type="button"
  onClick={handleCreditSubmit}  // use the new unified function
  className="flex-1 px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
  disabled={submitting || !creditAmount}
>
  {submitting ? (
    <>
      <Loader2 size={16} className="animate-spin" />
      <span>Updating...</span>
    </>
  ) : (
    <>
      <CheckCircle size={16} />
      <span>{selectedUser?.hasCredit ? 'Update Credit' : 'Give Credit'}</span>
    </>
  )}  
</button>

                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {filteredUsers.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Wallet size={48} className="mx-auto text-slate-400 mb-4" />
            <p className="text-slate-600 text-lg">No users found</p>
            <p className="text-slate-500 text-sm mt-2">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'No users with credit enabled'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => {
              const creditPercentage = getCreditPercentage(user.usedCredit, user.creditLimit);
              const isSelected = selectedUser?._id === user._id;
              
              return (
                <motion.div
                  key={user._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all hover:shadow-xl ${
                    isSelected ? 'ring-2 ring-slate-800 shadow-2xl' : ''
                  }`}
                  onClick={() => handleUserSelect(user)}
                >
                  <div className="bg-gradient-to-r from-slate-600 to-slate-800 p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                        <User size={20} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate">{user.fullname}</h3>
                        <p className="text-slate-200 text-sm truncate">{user.email}</p>
                        {!user.hasCredit && (
  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-md ml-2">
    No Credit
  </span>
)}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Wallet size={16} className="text-slate-600" />
                        <span className="text-sm text-slate-600">Wallet</span>
                      </div>
                      <span className="text-lg font-bold text-slate-800">
                        ₹{user.walletBalance.toFixed(2)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Credit Limit</span>
                        <span className="font-semibold text-slate-800">
                          ₹{user.creditLimit.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Used Credit</span>
                        <span className="font-semibold text-red-600">
                          ₹{user.usedCredit.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${creditPercentage}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className={`h-full ${getStatusColor(creditPercentage)}`}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>{creditPercentage.toFixed(0)}% used</span>
                          <span>₹{(user.creditLimit - user.usedCredit).toFixed(2)} available</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500">Reset Date</p>
                          <p className="text-xs font-medium text-slate-700">
                            {getNextResetDate(user.creditResetDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShoppingBag size={14} className="text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500">Orders</p>
                          <p className="text-xs font-medium text-slate-700">
                            {user.totalOrders || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUserSelect(user);
                      }}
                      className="w-full py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <CreditCard size={16} />
                      <span>Update Credit</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default WalletCredit;