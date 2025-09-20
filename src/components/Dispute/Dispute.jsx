  "use client";

  import React, { useState, useEffect } from "react";
  import { Search, Filter, ChevronLeft, ChevronRight, FileText, Package, AlertTriangle, Calendar, User, X, Truck, Clock, Shield } from "lucide-react";
import axios from 'axios'
  const disputeTypes = [
    { value: "weight_discrepancy", label: "Weight Discrepancy", icon: "⚖️" },
    { value: "missing_parcel", label: "Missing Parcel", icon: "📦" },
    { value: "damaged_parcel", label: "Damaged Parcel", icon: "💔" },
    { value: "incorrect_order", label: "Incorrect Order", icon: "❌" },
    { value: "late_pickup", label: "Late Pickup", icon: "⏰" },
    { value: "other", label: "Other", icon: "❓" }
  ];

  const DisputeForm = () => {
    const [activeTab, setActiveTab] = useState("orders");
    const [orders, setOrders] = useState([]);
    const [manifests, setManifests] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [filteredManifests, setFilteredManifests] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Pagination states
    const [currentOrderPage, setCurrentOrderPage] = useState(1);
    const [currentManifestPage, setCurrentManifestPage] = useState(1);
    const itemsPerPage = 10;
    
    // Filter states
    const [orderFilters, setOrderFilters] = useState({
      search: "",
      dateFrom: "",
      dateTo: "",
      customer: "",
      showFilters: false
    });
    
    const [manifestFilters, setManifestFilters] = useState({
      search: "",
      dateFrom: "",
      dateTo: "",
      showFilters: false
    });
    
    // Selected items and dispute form
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedManifest, setSelectedManifest] = useState(null);
    const [disputeType, setDisputeType] = useState("");
    const [otherTypeText, setOtherTypeText] = useState("");
    const [description, setDescription] = useState("");
    const [showDisputeForm, setShowDisputeForm] = useState(false);

    const token = typeof window !== "undefined" ? localStorage.getItem("userToken") : null;

    // Fetch data on component mount
    useEffect(() => {
      if (!token) return;
      fetchData();
    }, [token]);

    console.log(process.env.NEXT_PUBLIC_API_URL);



const fetchData = async () => {
  setLoading(true);
  try {
    // Make both API calls in parallel using axios
    const [ordersRes, manifestsRes] = await Promise.all([
      axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/total`),
      axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/manifests/getallmanifest`),
    ]);

    // Extract data
    const allOrders = ordersRes?.data?.data || [];
    const allManifests = manifestsRes?.data?.data || [];

    setOrders(allOrders);
    setManifests(allManifests);

    // Filter eligible orders
    const eligibleOrders = allOrders.filter(
      (o) => o.orderStatus === "Shipped" && o.manifestStatus === "dispatched"
    );

    // Filter eligible manifests
    const eligibleManifests = allManifests.filter(
      (m) => m.status === "picked_up"
    );

    setFilteredOrders(eligibleOrders);
    setFilteredManifests(eligibleManifests);

  } catch (err) {
    console.error("Error fetching data:", err);
    alert("Failed to fetch data");
  } finally {
    setLoading(false);
  }
};


    // Apply filters to orders
    useEffect(() => {
      let filtered = orders.filter(
        (o) => o.orderStatus === "Shipped" && o.manifestStatus === "dispatched"
      );

      if (orderFilters.search) {
        filtered = filtered.filter(order => 
          (order.invoiceNo && order.invoiceNo.toLowerCase().includes(orderFilters.search.toLowerCase())) ||
          order._id.toLowerCase().includes(orderFilters.search.toLowerCase())
        );
      }

      if (orderFilters.customer) {
        filtered = filtered.filter(order => 
          order.user?.fullname?.toLowerCase().includes(orderFilters.customer.toLowerCase())
        );
      }

      if (orderFilters.dateFrom) {
        filtered = filtered.filter(order => 
          new Date(order.createdAt) >= new Date(orderFilters.dateFrom)
        );
      }

      if (orderFilters.dateTo) {
        filtered = filtered.filter(order => 
          new Date(order.createdAt) <= new Date(orderFilters.dateTo)
        );
      }

      setFilteredOrders(filtered);
      setCurrentOrderPage(1);
    }, [orderFilters, orders]);

    // Apply filters to manifests
    useEffect(() => {
      let filtered = manifests.filter((m) => m.status === "picked_up");

      if (manifestFilters.search) {
        filtered = filtered.filter(manifest => 
          (manifest.manifestId && manifest.manifestId.toLowerCase().includes(manifestFilters.search.toLowerCase())) ||
          manifest._id.toLowerCase().includes(manifestFilters.search.toLowerCase())
        );
      }

      if (manifestFilters.dateFrom) {
        filtered = filtered.filter(manifest => 
          new Date(manifest.createdAt) >= new Date(manifestFilters.dateFrom)
        );
      }

      if (manifestFilters.dateTo) {
        filtered = filtered.filter(manifest => 
          new Date(manifest.createdAt) <= new Date(manifestFilters.dateTo)
        );
      }

      setFilteredManifests(filtered);
      setCurrentManifestPage(1);
    }, [manifestFilters, manifests]);

    // Pagination logic
    const getCurrentPageItems = (items, currentPage) => {
      const startIndex = (currentPage - 1) * itemsPerPage;
      return items.slice(startIndex, startIndex + itemsPerPage);
    };

    const getTotalPages = (items) => Math.ceil(items.length / itemsPerPage);

    // Handle order selection
    const handleOrderSelect = (order) => {
      setSelectedOrder(order);
      // Auto-select corresponding manifest
      const correspondingManifest = filteredManifests.find(m => m._id === order.manifest);
      if (correspondingManifest) {
        setSelectedManifest(correspondingManifest);
      }
      setShowDisputeForm(true);
    };

    // Handle manifest selection
    const handleManifestSelect = (manifest) => {
      setSelectedManifest(manifest);
      setShowDisputeForm(true);
    };

    const handleDisputeSubmit = async (e) => {
  e.preventDefault();

  setLoading(true);
  try {
    // clientId only exists if an order is selected
    const clientId = selectedOrder?.user?._id || null;
    const finalDisputeType = disputeType === "other" ? otherTypeText : disputeType;

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/raise-dispute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId: selectedOrder?._id || null,
        manifestId: selectedManifest?._id || null,
        type: finalDisputeType,
        description,
        clientId,
      }),
    });

    if (response.ok) {
      alert("Dispute raised successfully!");
      // Reset form
      setSelectedOrder(null);
      setSelectedManifest(null);
      setDisputeType("");
      setOtherTypeText("");
      setDescription("");
      setShowDisputeForm(false);
    } else {
      throw new Error("Failed to raise dispute");
    }
  } catch (err) {
    console.error("Error raising dispute:", err);
    alert("Failed to raise dispute");
  } finally {
    setLoading(false);
  }
};

    const getStatusColor = (status) => {
      const statusColors = {
        'Shipped': 'bg-emerald-100 text-emerald-800 border-emerald-200',
        'dispatched': 'bg-blue-100 text-blue-800 border-blue-200',
        'picked_up': 'bg-violet-100 text-violet-800 border-violet-200',
        'default': 'bg-gray-100 text-gray-800 border-gray-200'
      };
      return statusColors[status] || statusColors.default;
    };

    const FilterSection = ({ filters, setFilters, type }) => (
      <div className={`bg-gradient-to-r from-gray-50 to-blue-50 p-6 border-b transition-all duration-500 ease-in-out ${filters.showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={type === 'order' ? "Search order/invoice..." : "Search manifest..."}
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
              />
            </div>
          </div>
          
          {type === 'order' && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Customer</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search customer..."
                  value={filters.customer}
                  onChange={(e) => setFilters(prev => ({ ...prev, customer: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                />
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Date From</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Date To</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
            />
          </div>
        </div>
        
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => setFilters(prev => ({ 
              ...prev, 
              search: "", 
              dateFrom: "", 
              dateTo: "", 
              customer: "" 
            }))}
            className="px-6 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
          >
            Clear Filters
          </button>
        </div>
      </div>
    );

    const PaginationControls = ({ currentPage, totalPages, onPageChange, itemsCount }) => (
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-t">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm font-medium text-gray-700">
            Showing <span className="text-blue-600 font-semibold">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="text-blue-600 font-semibold">{Math.min(currentPage * itemsPerPage, itemsCount)}</span> of <span className="text-blue-600 font-semibold">{itemsCount}</span> results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNumber}
                    onClick={() => onPageChange(pageNumber)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      currentPage === pageNumber
                        ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300 shadow-sm'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );

    if (loading && !orders.length && !manifests.length) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-6"></div>
            <p className="text-gray-600 text-lg font-medium">Loading data...</p>
            <p className="text-gray-400 text-sm mt-2">Please wait while we fetch your information</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <div className="bg-white shadow-lg border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Dispute Management
                  </h1>
                  <p className="text-gray-500 text-sm">Manage and track order disputes</p>
                </div>
              </div>
              
              {(selectedOrder || selectedManifest) && (
                <button
                  onClick={() => setShowDisputeForm(true)}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:from-red-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
                >
                  <Shield className="w-5 h-5 inline mr-2" />
                  Raise Dispute
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab("orders")}
                className={`py-6 px-2 border-b-3 font-semibold text-sm transition-all duration-200 ${
                  activeTab === "orders"
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Package className="w-5 h-5" />
                  <span className="text-base">Orders</span>
                  <span className="px-3 py-1 text-xs font-bold bg-blue-100 text-blue-600 rounded-full">
                    {filteredOrders.length}
                  </span>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab("manifests")}
                className={`py-6 px-2 border-b-3 font-semibold text-sm transition-all duration-200 ${
                  activeTab === "manifests"
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5" />
                  <span className="text-base">Manifests</span>
                  <span className="px-3 py-1 text-xs font-bold bg-violet-100 text-violet-600 rounded-full">
                    {filteredManifests.length}
                  </span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === "orders" && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Orders Header */}
              <div className="px-6 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Eligible Orders</h2>
                    <p className="text-gray-600 text-sm mt-1">Orders ready for dispute resolution</p>
                  </div>
                  <button
                    onClick={() => setOrderFilters(prev => ({ ...prev, showFilters: !prev.showFilters }))}
                    className={`flex items-center space-x-2 px-4 py-3 border border-gray-200 rounded-xl transition-all duration-200 font-medium ${
                      orderFilters.showFilters 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg' 
                        : 'bg-white text-gray-700 hover:bg-blue-50 hover:border-blue-300 shadow-sm'
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    <span>Filters</span>
                  </button>
                </div>
              </div>

              {/* Orders Filters */}
              <FilterSection 
                filters={orderFilters} 
                setFilters={setOrderFilters} 
                type="order" 
              />

              {/* Orders List */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Order Information
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Customer Details
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Manifest Info
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Date & Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {getCurrentPageItems(filteredOrders, currentOrderPage).map((order) => (
                      <tr key={order._id} className="hover:bg-blue-50 transition-colors duration-200 group">
                        <td className="px-6 py-6">
                          <div className="space-y-2">
                            <div className="text-sm font-bold text-gray-900">
                              {order.invoiceNo || `Order #${order._id.slice(-6)}`}
                            </div>
                           
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {order.user?.fullname || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500">Customer</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Truck className="w-4 h-4 text-violet-600" />
                              <span className="text-sm font-medium text-gray-900">
                                {order.manifest?.manifestId || 'N/A'}
                              </span>
                            </div>
                            {order.manifest?.status && (
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(order.manifest.status)}`}>
                                {order.manifest.status}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-900">
                                {new Date(order.invoiceDate).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex flex-col space-y-2">
                              <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(order.orderStatus)}`}>
                                {order.orderStatus}
                              </span>
                              <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(order.manifestStatus)}`}>
                                {order.manifestStatus}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <button
                            onClick={() => handleOrderSelect(order)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-105 ${
                              selectedOrder?._id === order._id
                                ? 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-2 border-red-300 shadow-lg'
                                : 'bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 shadow-md hover:shadow-lg'
                            }`}
                          >
                            {selectedOrder?._id === order._id ? '✓ Selected' : 'Select for Dispute'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Orders Pagination */}
              {filteredOrders.length > itemsPerPage && (
                <PaginationControls
                  currentPage={currentOrderPage}
                  totalPages={getTotalPages(filteredOrders)}
                  onPageChange={setCurrentOrderPage}
                  itemsCount={filteredOrders.length}
                />
              )}
            </div>
          )}

          {activeTab === "manifests" && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Manifests Header */}
              <div className="px-6 py-6 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Eligible Manifests</h2>
                    <p className="text-gray-600 text-sm mt-1">Manifests available for dispute</p>
                  </div>
                  <button
                    onClick={() => setManifestFilters(prev => ({ ...prev, showFilters: !prev.showFilters }))}
                    className={`flex items-center space-x-2 px-4 py-3 border border-gray-200 rounded-xl transition-all duration-200 font-medium ${
                      manifestFilters.showFilters 
                        ? 'bg-violet-600 text-white border-violet-600 shadow-lg' 
                        : 'bg-white text-gray-700 hover:bg-violet-50 hover:border-violet-300 shadow-sm'
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    <span>Filters</span>
                  </button>
                </div>
              </div>

              {/* Manifests Filters */}
              <FilterSection 
                filters={manifestFilters} 
                setFilters={setManifestFilters} 
                type="manifest" 
              />

              {/* Manifests List */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-violet-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Manifest Information
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Date Created
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {getCurrentPageItems(filteredManifests, currentManifestPage).map((manifest) => (
                      <tr key={manifest._id} className="hover:bg-violet-50 transition-colors duration-200 group">
                        <td className="px-6 py-6">
                          <div className="space-y-2">
                            <div className="text-sm font-bold text-gray-900">
                              {manifest.manifestId || `Manifest #${manifest._id.slice(-6)}`}
                            </div>
                            <div className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                              {manifest._id}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-violet-100 rounded-lg">
                              <Calendar className="w-4 h-4 text-violet-600" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {new Date(manifest.createdAt).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(manifest.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-full border shadow-sm ${getStatusColor(manifest.status)}`}>
                            <div className="w-2 h-2 bg-current rounded-full mr-2 mt-1"></div>
                            {manifest.status}
                          </span>
                        </td>
                        <td className="px-6 py-6">
                          <button
                            onClick={() => handleManifestSelect(manifest)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-105 ${
                              selectedManifest?._id === manifest._id
                                ? 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-2 border-red-300 shadow-lg'
                                : 'bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 shadow-md hover:shadow-lg'
                            }`}
                          >
                            {selectedManifest?._id === manifest._id ? '✓ Selected' : 'Select for Dispute'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Manifests Pagination */}
              {filteredManifests.length > itemsPerPage && (
                <PaginationControls
                  currentPage={currentManifestPage}
                  totalPages={getTotalPages(filteredManifests)}
                  onPageChange={setCurrentManifestPage}
                  itemsCount={filteredManifests.length}
                />
              )}
            </div>
          )}
        </div>

        {/* Dispute Form Modal */}
        {showDisputeForm && (
  <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-200 p-6 sm:p-8">
      
      {/* Modal Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Shield className="w-6 h-6 text-red-600" />
          Raise Dispute
        </h3>
        <button
          onClick={() => setShowDisputeForm(false)}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleDisputeSubmit} className="space-y-6">
        
        {/* Selected Entity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {selectedOrder && (
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl shadow-sm">
              <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                <Package className="w-5 h-5" /> Order
              </h4>
              <p className="text-gray-900 mt-1">{selectedOrder.invoiceNo || selectedOrder._id}</p>
              <p className="text-gray-600 text-sm">
                Customer: {selectedOrder.user?.fullname || "N/A"}
              </p>
            </div>
          )}
          {selectedManifest && (
            <div className="p-4 bg-violet-50 border border-violet-100 rounded-xl shadow-sm">
              <h4 className="font-semibold text-violet-800 flex items-center gap-2">
                <FileText className="w-5 h-5" /> Manifest
              </h4>
              <p className="text-gray-900 mt-1">{selectedManifest.manifestId || selectedManifest._id}</p>
              <p className="text-gray-600 text-sm">
                Status: {selectedManifest.status || "N/A"}
              </p>
            </div>
          )}
          {!selectedOrder && !selectedManifest && (
            <div className="col-span-2 p-4 text-center text-gray-500 border border-gray-200 rounded-xl">
              Select an order or a manifest to raise a dispute
            </div>
          )}
        </div>

        {/* Dispute Type */}
        <div>
          <label className="block font-semibold text-gray-800 mb-2">Dispute Type <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {disputeTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setDisputeType(type.value)}
                className={`p-3 rounded-lg border-2 text-left transition transform hover:scale-105 ${
                  disputeType === type.value
                    ? "border-red-500 bg-red-50 shadow"
                    : "border-gray-200 bg-white hover:border-red-300 hover:bg-red-50"
                }`}
              >
                <div className="text-xl mb-1">{type.icon}</div>
                <div className="text-sm font-medium text-gray-800">{type.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Other Type Input */}
        {disputeType === "other" && (
          <div>
            <input
              type="text"
              value={otherTypeText}
              onChange={(e) => setOtherTypeText(e.target.value)}
              placeholder="Specify custom dispute type"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
            />
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block font-semibold text-gray-800 mb-2">Description <span className="text-red-500">*</span></label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the dispute..."
            required
            rows={5}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition resize-none"
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setShowDisputeForm(false)}
            className="px-6 py-2 border border-gray-200 rounded-xl bg-gray-100 hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || (!selectedOrder && !selectedManifest)}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "Submitting..." : "Raise Dispute"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

        {/* Selected Items Summary (Premium floating bar) */}
        {(selectedOrder || selectedManifest) && !showDisputeForm && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-40">
            <div className="bg-gradient-to-r from-red-50 to-pink-50 p-6">
              <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex-1">
                  <div className="text-lg font-bold text-gray-900 mb-2 flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-red-600" />
                    Selected for Dispute:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                    {selectedOrder && (
                      <div className="flex items-center space-x-2 bg-white p-3 rounded-lg shadow-sm border border-blue-100">
                        <Package className="w-4 h-4 text-blue-600" />
                        <div>
                          <span className="font-semibold">Order:</span>
                          <span className="ml-1">{selectedOrder.invoiceNo || selectedOrder._id}</span>
                        </div>
                      </div>
                    )}
                    {selectedManifest && (
                      <div className="flex items-center space-x-2 bg-white p-3 rounded-lg shadow-sm border border-violet-100">
                        <FileText className="w-4 h-4 text-violet-600" />
                        <div>
                          <span className="font-semibold">Manifest:</span>
                          <span className="ml-1">{selectedManifest.manifestId || selectedManifest._id}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedOrder(null);
                      setSelectedManifest(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
                  >
                    Clear Selection
                  </button>
                  <button
                    onClick={() => setShowDisputeForm(true)}
                    disabled={!selectedOrder || !selectedManifest}
                    className="px-6 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white text-sm font-semibold rounded-lg hover:from-red-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                  >
                    <Shield className="w-4 h-4 inline mr-1" />
                    Raise Dispute
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add bottom padding when selection bar is visible */}
        {(selectedOrder || selectedManifest) && !showDisputeForm && (
          <div className="h-32 lg:h-24"></div>
        )}
      </div>
    );
  };

  export default DisputeForm;