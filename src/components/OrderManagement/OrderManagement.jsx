'use client';

import React, { useState, useEffect } from 'react';
import ScanAndClub from './ScanAndClub';
import { motion } from 'framer-motion';
import { 
  Package, 
  Eye, 
  MapPin, 
  Calendar, 
  User, 
  Phone,
  ScanLine,
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
  Plus,
  Mail,
  CheckSquare,
  Square,
  ShoppingBag,
  CreditCard,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  FileTextIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import axios from 'axios';
import { ToastContainer,toast } from 'react-toastify';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all');
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [showScanAndClub, setShowScanAndClub] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  
  // Clubbing functionality state
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showClubbingModal, setShowClubbingModal] = useState(false);
  const [clubName, setClubName] = useState('');
  const [clubbingLoading, setClubbingLoading] = useState(false);

  // For status dropdown + modal
  const [activeAction, setActiveAction] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState('');
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/total`)
      if (response.status === 200) {
        setOrders(response?.data?.data || []);
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setLoading(false);
    }
  };

  const handleStatusChangeClick = (orderId, status) => {
    setPendingOrderId(orderId);
    setPendingStatus(status);
    setShowConfirmModal(true);
    setActiveAction(null);
  };

  const confirmStatusChange = async () => {
    if (!pendingOrderId || !pendingStatus) return;

    setUpdatingStatus(true);
    try {
      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/updateorderstatus/${pendingOrderId}`,
        { status: pendingStatus }
      );

      if (res.status === 200) {
        toast(`Order status updated to ${pendingStatus}`);
        fetchOrders();
      }
    } catch (err) {
      console.error('Status update failed:', err);
      toast(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdatingStatus(false);
      setShowConfirmModal(false);
      setPendingOrderId(null);
      setPendingStatus('');
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

  // Handle select all orders (only current page)
  const handleSelectAll = () => {
    if (selectedOrders.length === paginatedOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(paginatedOrders.map(order => order._id));
    }
  };

  // Handle card expansion
  const toggleCardExpansion = (orderId) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedCards(newExpanded);
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
        fetchOrders();
      }
    } catch (error) {
      console.error('Failed to club orders:', error);
      alert(error.response?.data?.message || 'Failed to club orders');
    } finally {
      setClubbingLoading(false);
    }
  };

  // Filter orders
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

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterPaymentStatus, rowsPerPage]);

  // Pagination handlers
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToPage = (page) => setCurrentPage(page);

  // Get page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const showPages = 5; // Number of page buttons to show
    
    if (totalPages <= showPages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

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

  const getUniqueStatuses = () => {
    return [...new Set(orders.map(order => order.orderStatus).filter(Boolean))];
  };

  // Mobile Order Card Component
  const MobileOrderCard = ({ order }) => {
    const isExpanded = expandedCards.has(order._id);
    const isSelected = selectedOrders.includes(order._id);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white rounded-xl shadow-lg p-4 mb-4 border-2 transition-all ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-100'
        }`}
      >
        {/* Card Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <button
              onClick={() => handleOrderSelection(order._id)}
              className="flex-shrink-0 p-1"
            >
              {isSelected ? (
                <CheckSquare size={20} className="text-blue-600" />
              ) : (
                <Square size={20} className="text-slate-400" />
              )}
            </button>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-800 truncate text-sm">
                {order.invoiceNo}
              </p>
              <p className="text-xs text-slate-600 flex items-center">
                <Calendar size={12} className="mr-1" />
                {new Date(order.invoiceDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(order.orderStatus)}`}>
              {getStatusIcon(order.orderStatus)} {order.orderStatus}
            </span>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-3 p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <User size={14} className="text-slate-500 flex-shrink-0" />
            <span className="font-medium text-slate-800 text-sm">
              {order.firstName} {order.lastName}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Phone size={14} className="text-slate-500 flex-shrink-0" />
            <span className="text-sm text-slate-700">{order.mobile}</span>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center space-x-1">
              <DollarSign size={12} className="text-green-600" />
              <span className="text-xs font-semibold text-green-800">
                {calculateTotalAmount(order.productItems, order.invoiceCurrency)}
              </span>
            </div>
            <p className="text-xs text-green-600">Amount</p>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center space-x-1">
              <Weight size={12} className="text-blue-600" />
              <span className="text-xs font-semibold text-blue-800">{order.weight}kg</span>
            </div>
            <p className="text-xs text-blue-600">Weight</p>
          </div>
          <div className="text-center p-2 bg-purple-50 rounded-lg">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
              {order.paymentStatus}
            </span>
          </div>
        </div>

        {/* Expandable Content */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 pt-3 border-t border-slate-200"
          >
            {/* Destination */}
            <div>
              <h4 className="text-sm font-medium text-slate-800 mb-2 flex items-center">
                <MapPin size={14} className="mr-1" />
                Destination
              </h4>
              <div className="pl-5 space-y-1">
                <div className="flex items-center space-x-2">
                  <Globe size={12} className="text-blue-600" />
                  <span className="text-sm font-medium text-slate-800">{order.country}</span>
                </div>
                <p className="text-sm text-slate-600">{order.state}, {order.city}</p>
                <p className="text-xs text-slate-500">{order.pincode}</p>
                <p className="text-xs text-slate-500 line-clamp-2">{order.address1}</p>
              </div>
            </div>

            {/* Products */}
            <div>
              <h4 className="text-sm font-medium text-slate-800 mb-2 flex items-center">
                <ShoppingBag size={14} className="mr-1" />
                Products
              </h4>
              <div className="pl-5">
                <p className="text-sm text-slate-700">{formatProductItems(order.productItems)}</p>
              </div>
            </div>

            {/* Shipment Details */}
            <div>
              <h4 className="text-sm font-medium text-slate-800 mb-2 flex items-center">
                <Package size={14} className="mr-1" />
                Shipment
              </h4>
              <div className="pl-5 space-y-1">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {order.shipmentType}
                </span>
                <p className="text-xs text-slate-600">
                  Dimensions: {order.length}×{order.width}×{order.height}cm
                </p>
                {order.manifestStatus && (
                  <p className="text-xs text-slate-500">Manifest: {order.manifestStatus}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 mt-3">
          <button
            onClick={() => toggleCardExpansion(order._id)}
            className="flex items-center space-x-1 text-slate-600 hover:text-slate-800 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp size={16} />
                <span className="text-sm">Less</span>
              </>
            ) : (
              <>
                <ChevronDown size={16} />
                <span className="text-sm">More</span>
              </>
            )}
          </button>

          <div className="flex items-center space-x-2">
            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <Eye size={16} />
            </button>
            {order?.shipmentDetails?.pdf ? (
              <a
                href={order.shipmentDetails.pdf}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors inline-flex items-center justify-center"
                title="View Shipment PDF"
              >
                <FileTextIcon size={16} />
              </a>
            ) : (
              <button
                disabled
                className="p-2 text-slate-400 bg-slate-50 rounded-lg cursor-not-allowed"
                title="No PDF available"
              >
                <FileTextIcon size={16} />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Order Management</h1>
        
        {/* Mobile Loading */}
        {isMobile ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-4 animate-pulse">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-5 h-5 bg-slate-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  </div>
                  <div className="w-16 h-6 bg-slate-200 rounded-full"></div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="h-12 bg-slate-200 rounded-lg"></div>
                  <div className="h-12 bg-slate-200 rounded-lg"></div>
                  <div className="h-12 bg-slate-200 rounded-lg"></div>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                  <div className="w-16 h-6 bg-slate-200 rounded"></div>
                  <div className="flex space-x-2">
                    <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
                    <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Desktop Loading */
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
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 sm:space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Order Management</h1>
        <div className="flex items-center space-x-2 sm:space-x-3">
          {selectedOrders.length > 0 && (
            <button 
              onClick={() => setShowClubbingModal(true)}
              className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base"
            >
              <Users size={isMobile ? 14 : 16} />
              <span className="hidden sm:inline">Club Selected</span>
              <span className="sm:hidden">Club</span>
              <span>({selectedOrders.length})</span>
            </button>
          )}
          {/* New Scan & Club Button */}
          <button 
            onClick={() => setShowScanAndClub(true)}
            className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl hover:bg-green-700 transition-colors flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base"
          >
            <ScanLine size={isMobile ? 14 : 16} />
            <span className="hidden sm:inline">Scan & Club</span>
            <span className="sm:hidden">Scan</span>
          </button>
          <button className="bg-slate-800 text-white px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl hover:bg-slate-700 transition-colors flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base">
            <Download size={isMobile ? 14 : 16} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-lg">
          <div className="text-lg sm:text-2xl font-bold text-slate-800">{orders.length}</div>
          <div className="text-xs sm:text-sm text-slate-600">Total</div>
        </div>  
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-lg">
          <div className="text-lg sm:text-2xl font-bold text-yellow-600">
            {orders.filter(o => o.orderStatus?.toLowerCase() === 'ready').length}
          </div>
          <div className="text-xs sm:text-sm text-slate-600">Ready</div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-lg">
          <div className="text-lg sm:text-2xl font-bold text-blue-600">
            {orders.filter(o => o.orderStatus?.toLowerCase() === 'shipped').length}
          </div>
          <div className="text-xs sm:text-sm text-slate-600">Shipped</div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-lg">
          <div className="text-lg sm:text-2xl font-bold text-green-600">
            {orders.filter(o => o.orderStatus?.toLowerCase() === 'delivered').length}
          </div>
          <div className="text-xs sm:text-sm text-slate-600">Delivered</div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-lg">
          <div className="text-lg sm:text-2xl font-bold text-purple-600">
            {orders.filter(o => o.orderStatus?.toLowerCase() === 'manifested').length}
          </div>
          <div className="text-xs sm:text-sm text-slate-600">Manifested</div>
        </div>
      </div>

      {/* Mobile Filter Toggle */}
      {isMobile && (
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="w-full bg-white rounded-xl shadow-lg p-3 flex items-center justify-between"
        >
          <div className="flex items-center space-x-2">
            <Filter size={18} className="text-slate-600" />
            <span className="font-medium text-slate-800">Filters & Search</span>
          </div>
          <motion.div
            animate={{ rotate: showMobileFilters ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={18} className="text-slate-600" />
          </motion.div>
        </button>
      )}

      {/* Filters */}
      <motion.div
        className={`bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 ${
          isMobile ? (showMobileFilters ? 'block' : 'hidden') : 'block'
        }`}
        initial={isMobile ? { height: 0, opacity: 0 } : false}
        animate={isMobile ? { 
          height: showMobileFilters ? 'auto' : 0, 
          opacity: showMobileFilters ? 1 : 0 
        } : false}
      >
        <div className="flex flex-col gap-4">
          {/* Rows Per Page Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-3">
              <label className="text-sm font-medium text-slate-700 whitespace-nowrap">
                Rows per page:
              </label>
              <select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white text-sm font-medium"
              >
                <option value={50}>50</option>
                <option value={200}>200</option>
                <option value={500}>500</option>
                <option value={1000}>1000</option>
              </select>
              <span className="text-sm text-slate-600">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length}
              </span>
            </div>
          </div>

          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Order ID, Customer, Mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm sm:text-base"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <Filter size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 appearance-none bg-white text-sm sm:text-base"
              >
                <option value="all">All Status</option>
                {getUniqueStatuses().map(status => (
                  <option key={status} value={status.toLowerCase()}>{status}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <DollarSign size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <select
                value={filterPaymentStatus}
                onChange={(e) => setFilterPaymentStatus(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 appearance-none bg-white text-sm sm:text-base"
              >
                <option value="all">All Payments</option>
                <option value="received">Payment Received</option>
                <option value="pending">Pending Payment</option>
              </select>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Select All on Mobile */}
      {isMobile && paginatedOrders.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-4">
          <button
            onClick={handleSelectAll}
            className="flex items-center space-x-2 w-full text-left"
          >
            {selectedOrders.length === paginatedOrders.length && paginatedOrders.length > 0 ? (
              <CheckSquare size={20} className="text-blue-600" />
            ) : (
              <Square size={20} className="text-slate-400" />
            )}
            <span className="font-medium text-slate-800">
              Select All ({paginatedOrders.length} on this page)
            </span>
          </button>
        </div>
      )}

      {/* Mobile View - Cards */}
      {isMobile ? (
        <div className="space-y-4">
          {paginatedOrders.map((order) => (
            <MobileOrderCard key={order._id} order={order} />
          ))}
        </div>
      ) : (
        /* Desktop View - Table */
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <ToastContainer />
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedOrders.length === paginatedOrders.length && paginatedOrders.length > 0}
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
                {paginatedOrders.map((order) => (
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
                        <div className="relative">
                          <button
                            onClick={() => setActiveAction(order._id === activeAction ? null : order._id)}
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Actions"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {activeAction === order._id && (
                            <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded-lg shadow-xl z-50">
                              {[
                                'Drafts',
                                'Ready',
                                'Packed',
                                'Manifested',
                                'Shipped',
                                'Delivered',
                                'Cancelled',
                                'Refunded',
                                'Disputed'
                              ].map(status => (
                                <button
                                  key={status}
                                  onClick={() => handleStatusChangeClick(order._id, status)}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 text-slate-700"
                                >
                                  {status}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {order?.shipmentDetails?.pdf ? (
                          <a
                            href={order.shipmentDetails.pdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors inline-flex items-center justify-center"
                            title="View Shipment PDF"
                          >
                            <FileTextIcon size={16} />
                          </a>
                        ) : (
                          <button
                            disabled
                            className="p-2 text-slate-400 bg-slate-50 rounded-lg cursor-not-allowed"
                            title="No PDF available"
                          >
                            <FileTextIcon size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {filteredOrders.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Page Info */}
            <div className="text-sm text-slate-600">
              Page {currentPage} of {totalPages}
            </div>

            {/* Pagination Buttons */}
            <div className="flex items-center space-x-2">
              {/* First Page */}
              <button
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="First Page"
              >
                <ChevronsLeft size={18} />
              </button>

              {/* Previous Page */}
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Previous Page"
              >
                <ChevronLeft size={18} />
              </button>

              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {getPageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-2 text-slate-400">
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {page}
                    </button>
                  )
                ))}
              </div>

              {/* Next Page */}
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Next Page"
              >
                <ChevronRight size={18} />
              </button>

              {/* Last Page */}
              <button
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Last Page"
              >
                <ChevronsRight size={18} />
              </button>
            </div>

            {/* Jump to Page (Desktop only) */}
            <div className="hidden sm:flex items-center space-x-2">
              <span className="text-sm text-slate-600">Go to:</span>
              <input
                type="number"
                min="1"
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const page = parseInt(e.target.value);
                  if (page >= 1 && page <= totalPages) {
                    goToPage(page);
                  }
                }}
                className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {filteredOrders.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl sm:rounded-2xl shadow-lg">
          <Package size={48} className="mx-auto text-slate-400 mb-4" />
          <p className="text-slate-600">No orders found matching your criteria</p>
        </div>
      )}

      {/* Clubbing Modal */}
      {showClubbingModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-md shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-bold flex items-center text-slate-800">
                <Users size={20} className="mr-2" />
                Club Orders
              </h3>
              <button
                onClick={() => setShowClubbingModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Selected Orders */}
              <div>
                <p className="text-sm font-semibold mb-2 text-slate-800">
                  Selected Orders: <span className="font-bold text-blue-600">{selectedOrders.length}</span>
                </p>
                <div className="max-h-32 overflow-y-auto bg-slate-50 rounded-lg p-3">
                  {selectedOrders.map(orderId => {
                    const order = orders.find(o => o._id === orderId);
                    return (
                      <div key={orderId} className="text-sm font-medium mb-1 text-slate-700">
                        {order?.invoiceNo} - {order?.firstName} {order?.lastName}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Club Name Input */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-800">
                  Club Name *
                </label>
                <input
                  type="text"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  placeholder="Enter club name..."
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                <button
                  onClick={() => setShowClubbingModal(false)}
                  className="flex-1 px-4 py-2.5 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClubOrders}
                  disabled={clubbingLoading || !clubName.trim()}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium"
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

      {/* Scan & Club Modal */}
      <ScanAndClub
        isOpen={showScanAndClub}
        onClose={() => setShowScanAndClub(false)}
        orders={orders}
        onClubSuccess={() => {
          fetchOrders(); // Refresh orders list
          setShowScanAndClub(false);
        }}
      />

      {/* Confirm Status Change Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blur bg-opacity-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-amber-100 rounded-2xl shadow-2xl p-6 max-w-sm w-full"
          >
            <h3 className="text-lg font-bold text-slate-800 mb-3">Confirm Status Change</h3>
            <p className="text-slate-600 mb-6">
              Are you sure you want to change the status to{' '}
              <span className="font-semibold text-blue-600">{pendingStatus}</span>?
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                disabled={updatingStatus}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {updatingStatus ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default OrderManagement;