'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  User, 
  DollarSign, 
  Plus, 
  Minus,
  Eye,
  TrendingUp,
  TrendingDown,
  Calendar,
  Search,
  Filter
} from 'lucide-react';

const WalletCredit = () => {
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreditForm, setShowCreditForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [creditForm, setCreditForm] = useState({
    userId: '',
    userName: '',
    amount: '',
    type: 'credit',
    description: ''
  });

  useEffect(() => {
    fetchWallets();
    fetchTransactions();
  }, []);

  const fetchWallets = async () => {
    // TODO: Replace with actual API call
    // try {
    //   const response = await axios.get('/api/wallets');
    //   setWallets(response.data);
    // } catch (error) {
    //   console.error('Failed to fetch wallets:', error);
    // }
    
    // Mock data
    setWallets([
      { 
        id: 1, 
        userId: 'USR001',
        userName: 'John Doe',
        userEmail: 'john@example.com',
        balance: 1250.50, 
        lastTransaction: '2024-01-15T14:30:00',
        totalCredits: 2500.00,
        totalDebits: 1249.50,
        status: 'active'
      },
      { 
        id: 2, 
        userId: 'USR002',
        userName: 'Jane Smith',
        userEmail: 'jane@example.com',
        balance: 850.75, 
        lastTransaction: '2024-01-14T10:15:00',
        totalCredits: 1500.00,
        totalDebits: 649.25,
        status: 'active'
      },
      { 
        id: 3, 
        userId: 'USR003',
        userName: 'Bob Wilson',
        userEmail: 'bob@example.com',
        balance: 0.00, 
        lastTransaction: '2024-01-10T16:45:00',
        totalCredits: 500.00,
        totalDebits: 500.00,
        status: 'inactive'
      },
      { 
        id: 4, 
        userId: 'USR004',
        userName: 'Alice Brown',
        userEmail: 'alice@example.com',
        balance: 2150.25, 
        lastTransaction: '2024-01-16T09:20:00',
        totalCredits: 3000.00,
        totalDebits: 849.75,
        status: 'active'
      }
    ]);
  };

  const fetchTransactions = async () => {
    // TODO: Replace with actual API call
    // try {
    //   const response = await axios.get('/api/wallet-transactions');
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
          userId: 'USR001',
          userName: 'John Doe',
          type: 'credit',
          amount: 500.00,
          balance: 1250.50,
          description: 'Wallet top-up',
          date: '2024-01-15T14:30:00',
          adminUser: 'Admin User'
        },
        {
          id: 'TXN002',
          userId: 'USR002',
          userName: 'Jane Smith',
          type: 'debit',
          amount: 150.25,
          balance: 850.75,
          description: 'Order payment',
          date: '2024-01-14T10:15:00',
          adminUser: 'System'
        },
        {
          id: 'TXN003',
          userId: 'USR001',
          userName: 'John Doe',
          type: 'credit',
          amount: 750.50,
          balance: 750.50,
          description: 'Refund credited',
          date: '2024-01-13T16:20:00',
          adminUser: 'Admin User'
        }
      ]);
      setLoading(false);
    }, 1000);
  };

  const handleCreditWallet = async (e) => {
    e.preventDefault();
    
    // TODO: Replace with actual API call
    // try {
    //   await axios.post(`/api/users/${creditForm.userId}/wallet`, {
    //     amount: parseFloat(creditForm.amount),
    //     type: creditForm.type,
    //     description: creditForm.description
    //   });
    //   fetchWallets();
    //   fetchTransactions();
    // } catch (error) {
    //   console.error('Wallet operation failed:', error);
    // }
    
    console.log('Wallet operation:', creditForm);
    
    // Update wallet balance
    const amount = parseFloat(creditForm.amount);
    setWallets(prev => prev.map(wallet => {
      if (wallet.userId === creditForm.userId) {
        const newBalance = creditForm.type === 'credit' 
          ? wallet.balance + amount 
          : wallet.balance - amount;
        return {
          ...wallet,
          balance: Math.max(0, newBalance),
          lastTransaction: new Date().toISOString(),
          totalCredits: creditForm.type === 'credit' ? wallet.totalCredits + amount : wallet.totalCredits,
          totalDebits: creditForm.type === 'debit' ? wallet.totalDebits + amount : wallet.totalDebits
        };
      }
      return wallet;
    }));

    // Add transaction
    const newTransaction = {
      id: `TXN${Date.now()}`,
      userId: creditForm.userId,
      userName: creditForm.userName,
      type: creditForm.type,
      amount: amount,
      balance: 0, // Will be calculated
      description: creditForm.description,
      date: new Date().toISOString(),
      adminUser: 'Current Admin'
    };
    
    setTransactions(prev => [newTransaction, ...prev]);

    // Reset form
    setCreditForm({
      userId: '',
      userName: '',
      amount: '',
      type: 'credit',
      description: ''
    });
    setShowCreditForm(false);
  };

  const handleUserSelect = (wallet) => {
    setCreditForm(prev => ({
      ...prev,
      userId: wallet.userId,
      userName: wallet.userName
    }));
  };

  const filteredWallets = wallets.filter(wallet =>
    wallet.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wallet.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wallet.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransactions = selectedUser 
    ? transactions.filter(t => t.userId === selectedUser)
    : transactions;

  const totalWalletBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
  const activeWallets = wallets.filter(w => w.status === 'active').length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">Wallet Credits</h1>
          <div className="w-32 h-10 bg-slate-200 rounded-xl animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-lg animate-pulse">
              <div className="h-8 bg-slate-200 rounded mb-2"></div>
              <div className="h-4 bg-slate-200 rounded w-20"></div>
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Wallet Credits</h1>
        <button 
          onClick={() => setShowCreditForm(!showCreditForm)}
          className="bg-slate-800 text-white px-4 py-2 rounded-xl hover:bg-slate-700 transition-colors flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Credit/Debit Wallet</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Total Balance</p>
              <p className="text-2xl font-bold text-slate-800">{transactions.length}</p>
            </div>
            <TrendingUp size={24} className="text-blue-600" />
          </div>
        </div>
      </div>

      {/* Credit/Debit Form */}
      {showCreditForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Credit/Debit Wallet</h3>
          <form onSubmit={handleCreditWallet} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select User
                </label>
                <select
                  value={creditForm.userId}
                  onChange={(e) => {
                    const selectedWallet = wallets.find(w => w.userId === e.target.value);
                    if (selectedWallet) {
                      handleUserSelect(selectedWallet);
                    }
                  }}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500"
                  required
                >
                  <option value="">Choose a user</option>
                  {wallets.map((wallet) => (
                    <option key={wallet.userId} value={wallet.userId}>
                      {wallet.userName} - ₹{wallet.balance.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={creditForm.amount}
                  onChange={(e) => setCreditForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500"
                  placeholder="Enter amount"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <textarea
                value={creditForm.description}
                onChange={(e) => setCreditForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500"
                placeholder="Enter description"
                rows="3"
                required
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowCreditForm(false)}
                className="px-6 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={() => setCreditForm(prev => ({ ...prev, type: 'credit' }))}
                className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>Credit</span>
              </button>
              <button
                type="submit"
                onClick={() => setCreditForm(prev => ({ ...prev, type: 'debit' }))}
                className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <Minus size={16} />
                <span>Debit</span>
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>
          <div className="relative">
            <Filter size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="pl-10 pr-8 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 appearance-none bg-white"
            >
              <option value="">All Transactions</option>
              {wallets.map((wallet) => (
                <option key={wallet.userId} value={wallet.userId}>
                  {wallet.userName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Wallets Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">User Wallets</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">User</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Balance</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Total Credits</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Total Debits</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Last Transaction</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredWallets.map((wallet) => (
                <motion.tr 
                  key={wallet.id} 
                  className="hover:bg-slate-50 transition-colors"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-slate-400 to-slate-600 rounded-full flex items-center justify-center">
                        <User size={16} className="text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{wallet.userName}</p>
                        <p className="text-sm text-slate-600">{wallet.userEmail}</p>
                        <p className="text-sm text-slate-500">{wallet.userId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign size={16} className="text-slate-600" />
                      <span className="text-lg font-bold text-slate-800">₹{wallet.balance.toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <TrendingUp size={14} className="text-green-600" />
                      <span className="font-medium text-green-600">₹{wallet.totalCredits.toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <TrendingDown size={14} className="text-red-600" />
                      <span className="font-medium text-red-600">₹{wallet.totalDebits.toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Calendar size={14} className="text-slate-400" />
                      <span className="text-sm text-slate-600">
                        {new Date(wallet.lastTransaction).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      wallet.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      {wallet.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          handleUserSelect(wallet);
                          setShowCreditForm(true);
                        }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Credit/Debit"
                      >
                        <DollarSign size={16} />
                      </button>
                      <button
                        onClick={() => setSelectedUser(wallet.userId)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Transactions"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredWallets.length === 0 && (
          <div className="text-center py-12">
            <Wallet size={48} className="mx-auto text-slate-400 mb-4" />
            <p className="text-slate-600">No wallets found</p>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-lg">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">
            {selectedUser ? `Transactions for ${wallets.find(w => w.userId === selectedUser)?.userName}` : 'Recent Transactions'}
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {filteredTransactions.slice(0, 10).map((transaction) => (
              <motion.div
                key={transaction.id}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:shadow-md transition-shadow"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${
                    transaction.type === 'credit' 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {transaction.type === 'credit' ? <Plus size={20} /> : <Minus size={20} />}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{transaction.userName}</p>
                    <p className="text-sm text-slate-600">{transaction.description}</p>
                    <p className="text-sm text-slate-500">by {transaction.adminUser}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                  </p>
                  <p className="text-sm text-slate-500">
                    {new Date(transaction.date).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            ))}
            
            {filteredTransactions.length === 0 && (
              <div className="text-center py-8">
                <p className="text-slate-600">No transactions found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default WalletCredit;