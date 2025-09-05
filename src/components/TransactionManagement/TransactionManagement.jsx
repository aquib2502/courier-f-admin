'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Calendar, 
  User, 
  Search, 
  Filter, 
  Download,
  Eye,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

const TransactionManagement = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    // TODO: Replace with actual API call
    // try {
    //   const response = await axios.get('/api/transactions');
    //   setTransactions(response.data);
    // } catch (error) {
    //   console.error('Failed to fetch transactions:', error);
    // } finally {
    //   setLoading(false);
    // }
    
    // Mock data
    setTimeout(() => {
      setTransactions([
        { 
          id: 'TXN001', 
          user: 'John Doe',
          userEmail: 'john@example.com',
          orderId: 'ORD001',
          type: 'payment', 
          amount: 250, 
          status: 'completed', 
          date: '2024-01-15T14:30:00',
          paymentMethod: 'Credit Card',
          transactionFee: 5,
          netAmount: 245
        },
        { 
          id: 'TXN002', 
          user: 'Jane Smith',
          userEmail: 'jane@example.com',
          orderId: 'ORD002',
          type: 'refund', 
          amount: 80, 
          status: 'pending', 
          date: '2024-01-14T10:15:00',
          paymentMethod: 'Wallet',
          transactionFee: 0,
          netAmount: 80
        },
        { 
          id: 'TXN003', 
          user: 'Bob Wilson',
          userEmail: 'bob@example.com',
          orderId: 'ORD003',
          type: 'payment', 
          amount: 320, 
          status: 'failed', 
          date: '2024-01-16T16:45:00',
          paymentMethod: 'UPI',
          transactionFee: 6.4,
          netAmount: 313.6
        },
        { 
          id: 'TXN004', 
          user: 'Alice Brown',
          userEmail: 'alice@example.com',
          orderId: 'ORD004',
          type: 'wallet_credit', 
          amount: 500, 
          status: 'completed', 
          date: '2024-01-13T09:20:00',
          paymentMethod: 'Bank Transfer',
          transactionFee: 0,
          netAmount: 500
        },
        { 
          id: 'TXN005', 
          user: 'Charlie Davis',
          userEmail: 'charlie@example.com',
          orderId: 'ORD005',
          type: 'payment', 
          amount: 195, 
          status: 'completed', 
          date: '2024-01-12T12:30:00',
          paymentMethod: 'Debit Card',
          transactionFee: 3.9,
          netAmount: 191.1
        }
      ]);
      setLoading(false);
    }, 1000);
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.orderId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'payment': return 'text-blue-600';
      case 'refund': return 'text-orange-600';
      case 'wallet_credit': return 'text-green-600';
      default: return 'text-slate-600';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'payment': return <ArrowUpCircle size={16} className="text-blue-600" />;
      case 'refund': return <ArrowDownCircle size={16} className="text-orange-600" />;
      case 'wallet_credit': return <TrendingUp size={16} className="text-green-600" />;
      default: return <CreditCard size={16} className="text-slate-600" />;
    }
  };

  const totalRevenue = transactions
    .filter(t => t.type === 'payment' && t.status === 'completed')
    .reduce((sum, t) => sum + t.netAmount, 0);

  const totalRefunds = transactions
    .filter(t => t.type === 'refund' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-800">Transaction Management</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-white p-4 rounded-xl shadow-lg animate-pulse">
              <div className="h-8 bg-slate-200 rounded mb-2"></div>
              <div className="h-4 bg-slate-200 rounded w-20"></div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="animate-pulse border-b border-slate-200 pb-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                    <div className="h-3 bg-slate-200 rounded w-32"></div>
                  </div>
                  <div className="h-6 bg-slate-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Transaction Management</h1>
        <div className="flex items-center space-x-3">
          <button className="bg-slate-800 text-white px-4 py-2 rounded-xl hover:bg-slate-700 transition-colors flex items-center space-x-2">
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">₹{totalRevenue.toFixed(2)}</p>
            </div>
            <TrendingUp size={24} className="text-green-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Total Refunds</p>
              <p className="text-2xl font-bold text-orange-600">₹{totalRefunds.toFixed(2)}</p>
            </div>
            <TrendingDown size={24} className="text-orange-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Completed</p>
              <p className="text-2xl font-bold text-slate-800">
                {transactions.filter(t => t.status === 'completed').length}
              </p>
            </div>
            <CreditCard size={24} className="text-green-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Pending</p>
              <p className="text-2xl font-bold text-slate-800">
                {transactions.filter(t => t.status === 'pending').length}
              </p>
            </div>
            <CreditCard size={24} className="text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>
          <div className="relative">
            <Filter size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full pl-10 pr-8 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 appearance-none bg-white"
            >
              <option value="all">All Types</option>
              <option value="payment">Payment</option>
              <option value="refund">Refund</option>
              <option value="wallet_credit">Wallet Credit</option>
            </select>
          </div>
          <div className="relative">
            <Filter size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-8 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Transactions Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Transaction ID</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">User</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Order ID</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Type</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Date</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTransactions.map((transaction) => (
                <motion.tr 
                  key={transaction.id} 
                  className="hover:bg-slate-50 transition-colors"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <td className="px-6 py-4 font-medium text-slate-800">{transaction.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <User size={16} className="text-slate-400" />
                      <div>
                        <p className="font-medium text-slate-800">{transaction.user}</p>
                        <p className="text-sm text-slate-600">{transaction.userEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{transaction.orderId}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(transaction.type)}
                      <span className={`font-medium capitalize ${getTypeColor(transaction.type)}`}>
                        {transaction.type.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-800">₹{transaction.amount}</p>
                      {transaction.transactionFee > 0 && (
                        <p className="text-sm text-slate-500">Fee: ₹{transaction.transactionFee}</p>
                      )}
                      <p className="text-sm text-slate-600">Net: ₹{transaction.netAmount}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-slate-800">{new Date(transaction.date).toLocaleDateString()}</p>
                      <p className="text-sm text-slate-500">{new Date(transaction.date).toLocaleTimeString()}</p>
                      <p className="text-sm text-slate-600">{transaction.paymentMethod}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Details">
                        <Eye size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <CreditCard size={48} className="mx-auto text-slate-400 mb-4" />
            <p className="text-slate-600">No transactions found matching your criteria</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TransactionManagement;