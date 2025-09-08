'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  Eye, 
  MapPin, 
  Calendar, 
  User, 
  Phone,
  DollarSign,
  Truck,
  Search,
  Filter,
  Download,
  FileText,
  Globe,
  Weight,
  Users,
  X,
  Plus
} from 'lucide-react';
import axios from 'axios';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all');
  
  // Clubbing functionality state
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showClubbingModal, setShowClubbingModal] = useState(false);
  const [clubName, setClubName] = useState('');
  const [clubbingLoading, setClubbingLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      // TODO: Replace with actual API call
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/total`)
      if (response.status === 200) {
        setOrders(response?.data?.data || []);
        setLoading(false);
      }
      // Mock data using your API structure
      
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setLoading(false);
    }
  };

  // Handle order selection for clubbing
  const handleOrderSelection = (orderId) => {
    setSelectedOrders(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };

  // Handle select all orders
  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(order => order._id));
    }
  };

  // Handle clubbing orders
  const handleClubOrders = async () => {
    if (selectedOrders.length === 0) {
      alert('Please select at least one order to club');
      return;
    }

    if (!clubName.trim()) {
      alert('Please enter a club name');
      return;
    }

    setClubbingLoading(true);
    try {
      // Get unique user IDs from selected orders
const selectedOrdersData = orders.filter(order => selectedOrders.includes(order._id));
const userIds = [...new Set(selectedOrdersData.map(order => order.user?._id || order.user).filter(Boolean))];


      if (userIds.length === 0) {
        alert('Selected orders must have valid user IDs');
        setClubbingLoading(false);
        return;
      }

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/club`, {
        userIds,
        orderIds: selectedOrders,
        clubName: clubName.trim()
      });

      if (response.status === 201) {
        alert('Orders clubbed successfully!');
        setShowClubbingModal(false);
        setSelectedOrders([]);
        setClubName('');
        // Optionally refresh orders or update UI to show clubbing status
        fetchOrders();
      }
    } catch (error) {
      console.error('Failed to club orders:', error);
      alert(error.response?.data?.message || 'Failed to club orders');
    } finally {
      setClubbingLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const searchFields = [
      order._id,
      order.firstName,
      order.lastName,
      order.mobile,
      order.invoiceNo,
      order.city,
      order.country
    ].join(' ').toLowerCase();

    const matchesSearch = searchFields.includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.orderStatus?.toLowerCase() === filterStatus.toLowerCase();
    const matchesPayment = filterPaymentStatus === 'all' || order.paymentStatus?.toLowerCase().includes(filterPaymentStatus.toLowerCase());
    
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const getStatusColor = (status) => {
    if (!status) return 'bg-slate-100 text-slate-800 border-slate-200';
    
    switch (status.toLowerCase()) {
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'in transit': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getPaymentStatusColor = (status) => {
    if (!status) return 'bg-slate-100 text-slate-800';
    
    switch (status.toLowerCase()) {
      case 'payment received': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusIcon = (status) => {
    if (!status) return '📋';
    
    switch (status.toLowerCase()) {
      case 'delivered': return '✅';
      case 'in transit': return '🚚';
      case 'processing': return '⚙️';
      case 'pending': return '⏳';
      case 'cancelled': return '❌';
      default: return '📋';
    }
  };

  const formatProductItems = (items) => {
    if (!items || items.length === 0) return 'No items';
    return items.map(item => `${item.productName} (${item.productQuantity})`).join(', ');
  };

  const calculateTotalAmount = (items, currency = 'USD') => {
    if (!items || items.length === 0) return `0 ${currency}`;
    const total = items.reduce((sum, item) => sum + (item.productPrice * item.productQuantity), 0);
    return `${total} ${currency}`;
  };

  // Get unique statuses for filter
  const getUniqueStatuses = () => {
    return [...new Set(orders.map(order => order.orderStatus).filter(Boolean))];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-800">Order Management</h1>
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="animate-pulse border-b border-slate-200 pb-4 last:border-b-0">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-5 bg-slate-200 rounded w-32"></div>
                    <div className="h-4 bg-slate-200 rounded w-48"></div>
                    <div className="h-8 bg-slate-200 rounded w-24"></div>
                  </div>
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
        <h1 className="text-2xl font-bold text-slate-800">Order Management</h1>
        <div className="flex items-center space-x-3">
          {selectedOrders.length > 0 && (
            <button 
              onClick={() => setShowClubbingModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Users size={16} />
              <span>Club Selected ({selectedOrders.length})</span>
            </button>
          )}
          <button className="bg-slate-800 text-white px-4 py-2 rounded-xl hover:bg-slate-700 transition-colors flex items-center space-x-2">
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-lg">
          <div className="text-2xl font-bold text-slate-800">{orders.length}</div>
          <div className="text-sm text-slate-600">Total Orders</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {orders.filter(o => o.orderStatus?.toLowerCase() === 'pending').length}
          </div>
          <div className="text-sm text-slate-600">Pending</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg">
          <div className="text-2xl font-bold text-blue-600">
            {orders.filter(o => o.orderStatus?.toLowerCase() === 'in transit').length}
          </div>
          <div className="text-sm text-slate-600">In Transit</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg">
          <div className="text-2xl font-bold text-green-600">
            {orders.filter(o => o.orderStatus?.toLowerCase() === 'delivered').length}
          </div>
          <div className="text-sm text-slate-600">Delivered</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg">
          <div className="text-2xl font-bold text-purple-600">
            {orders.filter(o => o.orderStatus?.toLowerCase() === 'processing').length}
          </div>
          <div className="text-sm text-slate-600">Processing</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Order ID, Customer Name, Mobile, Invoice..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>
          <div className="relative">
            <Filter size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-8 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 appearance-none bg-white"
            >
              <option value="all">All Status</option>
              {getUniqueStatuses().map(status => (
                <option key={status} value={status.toLowerCase()}>{status}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <DollarSign size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <select
              value={filterPaymentStatus}
              onChange={(e) => setFilterPaymentStatus(e.target.value)}
              className="pl-10 pr-8 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 appearance-none bg-white"
            >
              <option value="all">All Payments</option>
              <option value="received">Payment Received</option>
              <option value="pending">Pending Payment</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Orders List */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Select</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Order Details</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Customer</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Destination</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Shipment</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Products</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Payment</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredOrders.map((order) => (
                <motion.tr 
                  key={order._id} 
                  className={`hover:bg-slate-50 transition-colors ${selectedOrders.includes(order._id) ? 'bg-blue-50' : ''}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order._id)}
                      onChange={() => handleOrderSelection(order._id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm text-slate-600 flex items-center mt-1">
                        <FileText size={12} className="mr-1" />
                        {order.invoiceNo}
                      </p>
                      <p className="text-sm text-slate-500 flex items-center">
                        <Calendar size={12} className="mr-1" />
                        {new Date(order.invoiceDate).toLocaleDateString()}
                      </p>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-800 flex items-center">
                        <User size={14} className="mr-2" />
                        {order.firstName} {order.lastName}
                      </p>
                      <p className="text-sm text-slate-600 flex items-center mt-1">
                        <Phone size={12} className="mr-1" />
                        {order.mobile}
                      </p>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Globe size={14} className="text-blue-600" />
                        <span className="text-sm font-medium text-slate-800">{order.country}</span>
                      </div>
                      <p className="text-sm text-slate-600">{order.state}, {order.city}</p>
                      <p className="text-xs text-slate-500">{order.pincode}</p>
                      <p className="text-xs text-slate-500 truncate" title={order.address1}>
                        {order.address1}
                      </p>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-2">
                        {order.shipmentType}
                      </span>
                      <div className="flex items-center space-x-1 text-sm text-slate-600">
                        <Weight size={12} />
                        <span>{order.weight}kg</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {order.length}×{order.width}×{order.height}cm
                      </p>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm text-slate-800 font-medium">
                        {formatProductItems(order.productItems)}
                      </p>
                      <p className="text-sm text-green-600 font-medium">
                        {calculateTotalAmount(order.productItems, order.invoiceCurrency)}
                      </p>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(order.orderStatus)}`}>
                        <span>{getStatusIcon(order.orderStatus)}</span>
                        <span>{order.orderStatus}</span>
                      </div>
                      {order.manifestStatus && (
                        <div className="text-xs text-slate-500">
                          Manifest: {order.manifestStatus}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button 
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" 
                        title="Track Shipment"
                      >
                        <Truck size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-slate-400 mb-4" />
            <p className="text-slate-600">No orders found matching your criteria</p>
          </div>
        )}
      </div>

    {/* Clubbing Modal */}
{showClubbingModal && (
  <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gray-800 text-white border border-gray-700 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl pointer-events-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold flex items-center">
          <Users size={20} className="mr-2" />
          Club Orders
        </h3>
        <button
          onClick={() => setShowClubbingModal(false)}
          className="text-gray-300 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-4">
        {/* Selected Orders */}
        <div>
          <p className="text-sm font-semibold mb-2">
            Selected Orders: <span className="font-bold">{selectedOrders.length}</span>
          </p>
          <div className="max-h-32 overflow-y-auto bg-gray-700 rounded-lg p-3">
            {selectedOrders.map(orderId => {
              const order = orders.find(o => o._id === orderId);
              return (
                <div key={orderId} className="text-sm font-medium mb-1">
                  {order?.invoiceNo} - {order?.firstName} {order?.lastName}
                </div>
              );
            })}
          </div>
        </div>

        {/* Club Name Input */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Club Name *
          </label>
          <input
            type="text"
            value={clubName}
            onChange={(e) => setClubName(e.target.value)}
            placeholder="Enter club name..."
            className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            onClick={() => setShowClubbingModal(false)}
            className="flex-1 px-4 py-2 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleClubOrders}
            disabled={clubbingLoading || !clubName.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-bold"
          >
            {clubbingLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Plus size={16} className="mr-1" />
                Club Orders
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  </div>
)}

    </motion.div>
  );
};

export default OrderManagement;