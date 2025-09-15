'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { DecodeHintType, BarcodeFormat } from '@zxing/library';
import { 
  FileText, 
  Calendar, 
  Package, 
  User, 
  Check, 
  X, 
  Eye, 
  Clock, 
  Filter, 
  MapPin,
  Phone,
  Truck,
  Scan,
  Camera,
  AlertCircle,
  Search,
  ChevronDown,
  ChevronUp,
  MoreHorizontal
} from 'lucide-react';
import axios from 'axios';

const ManifestRequest = () => {
  const [manifests, setManifests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });
  const [scanningManifest, setScanningManifest] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState('');
  const [expandedManifest, setExpandedManifest] = useState(null);
  const [displayCount, setDisplayCount] = useState(10);

  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

  const startBarcodeScan = async () => {
    setScanError('');

    if (!codeReaderRef.current) {
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128]);
      codeReaderRef.current = new BrowserMultiFormatReader(hints);
    }

    try {
      await codeReaderRef.current.decodeFromVideoDevice(
        null,
        videoRef.current,
        (result, error) => {
          if (result) {
            const scannedId = result.getText();

            try { codeReaderRef.current.stopContinuousDecode(); } catch (_) {}
            try { codeReaderRef.current.stopStreams(); } catch (_) {}

            const manifestExists = manifests.find(
              (m) =>
                (m._id === scannedId || m.manifestId === scannedId) &&
                m.status === 'pickup_requested'
            );

            if (!manifestExists) {
              setScanError('Manifest not found or not ready for pickup');
              return;
            }

            handleMarkAsPickedUp(manifestExists._id);
          }

          if (error) {
            if (
              error.name === 'NotFoundException' ||
              error.message?.includes('No MultiFormat Readers')
            ) {
              return;
            }

            console.error('ZXing scan error:', error);
            setScanError('Unable to scan. Try adjusting the barcode position.');
          }
        }
      );
    } catch (err) {
      console.error('Failed to start scanning:', err);
      setScanError('Unable to access camera. Check permissions.');
    }
  };

  useEffect(() => {
    if (!scanningManifest && codeReaderRef.current) {
      try { codeReaderRef.current.stopContinuousDecode(); } catch (_) {}
      try { codeReaderRef.current.stopStreams(); } catch (_) {}
    }
  }, [scanningManifest]);

  useEffect(() => {
    if (scanningManifest) startBarcodeScan();
  }, [scanningManifest]);

  useEffect(() => {
    fetchManifests();
  }, []);

  const fetchManifests = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/manifests/getallmanifest`);
      if (response.data.success) {
        setManifests(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch manifests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManifestAction = async (manifestId, action) => {
    try {
      const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/manifests/${manifestId}/status`, {
        status: action === 'approve' ? 'approved' : 'rejected'
      });
      
      if (response.data.success) {
        fetchManifests();
      }
    } catch (error) {
      console.error(`Failed to ${action} manifest:`, error);
    }
  };

  const handleMarkAsPickedUp = async (manifestId) => {
    setScanLoading(true);
    setScanError('');

    try {
      const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/manifests/${manifestId}/status`, {
        status: 'picked_up'
      });

      if (response.data.success) {
        await fetchManifests();
        setScanningManifest(null);
        alert('Manifest marked as picked up successfully!');
      }
    } catch (error) {
      console.error('Failed to mark manifest as picked up:', error);
      setScanError('Failed to mark manifest as picked up. Please try again.');
    } finally {
      setScanLoading(false);
    }
  };

  // Filter and search logic
  const filteredManifests = manifests.filter(manifest => {
    const matchesStatus = filterStatus === 'all' || manifest.status === filterStatus;
    const matchesSearch = !searchQuery || 
      manifest.manifestId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      manifest.user?.fullname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      manifest.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      manifest.courierPartner?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const manifestDate = new Date(manifest.createdAt);
    const matchesDateFrom = !dateFilter.from || manifestDate >= new Date(dateFilter.from);
    const matchesDateTo = !dateFilter.to || manifestDate <= new Date(dateFilter.to);
    
    return matchesStatus && matchesSearch && matchesDateFrom && matchesDateTo;
  });

  const displayedManifests = filteredManifests.slice(0, displayCount);
  const hasMore = displayCount < filteredManifests.length;

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pickup_requested': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'picked_up': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <Clock size={16} className="text-yellow-600" />;
      case 'pickup_requested': return <Truck size={16} className="text-blue-600" />;
      case 'picked_up': return <Check size={16} className="text-green-600" />;
      default: return <FileText size={16} className="text-slate-600" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <h1 className="text-2xl font-bold text-slate-800">Pickup Requests</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-5 bg-slate-200 rounded w-32"></div>
                  <div className="h-4 bg-slate-200 rounded w-48"></div>
                </div>
                <div className="h-8 bg-slate-200 rounded w-24"></div>
              </div>
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
      className="space-y-6 p-4"
    >
      {/* Header */}
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Pickup Requests</h1>
        
        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Manifest ID, User, or Courier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>
          
          {/* Status Filter */}
          <div className="relative">
            <Filter size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-8 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 appearance-none bg-white min-w-[150px]"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="pickup_requested">Ready for Pickup</option>
              <option value="picked_up">Picked Up</option>
            </select>
          </div>
          
          {/* Date Filters */}
          <div className="flex gap-2">
            <input
              type="date"
              value={dateFilter.from}
              onChange={(e) => setDateFilter({...dateFilter, from: e.target.value})}
              className="px-3 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500"
              placeholder="From"
            />
            <input
              type="date"
              value={dateFilter.to}
              onChange={(e) => setDateFilter({...dateFilter, to: e.target.value})}
              className="px-3 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500"
              placeholder="To"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-lg">
          <div className="text-2xl font-bold text-slate-800">{manifests.length}</div>
          <div className="text-sm text-slate-600">Total Requests</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {manifests.filter(m => m.status === 'open').length}
          </div>
          <div className="text-sm text-slate-600">Open</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg">
          <div className="text-2xl font-bold text-blue-600">
            {manifests.filter(m => m.status === 'pickup_requested').length}
          </div>
          <div className="text-sm text-slate-600">Ready for Pickup</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg">
          <div className="text-2xl font-bold text-green-600">
            {manifests.filter(m => m.status === 'picked_up').length}
          </div>
          <div className="text-sm text-slate-600">Picked Up</div>
        </div>
      </div>
      
      {/* Results Info */}
      <div className="text-sm text-slate-600">
        Showing {displayedManifests.length} of {filteredManifests.length} results
      </div>

      {/* Manifest Cards - Compact View */}
      <div className="space-y-3">
        {displayedManifests.map((manifest) => (
          <motion.div 
            key={manifest._id} 
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Compact Header */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={20} className="text-slate-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="text-lg font-semibold text-slate-800 truncate">{manifest.manifestId}</h3>
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full border text-xs ${getStatusColor(manifest.status)}`}>
                        {getStatusIcon(manifest.status)}
                        <span className="font-medium capitalize">{manifest.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-slate-600">
                      <div className="flex items-center space-x-1">
                        <User size={14} />
                        <span className="truncate">{manifest.user?.fullname}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Package size={14} />
                        <span>{manifest.totalOrders} orders</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar size={14} />
                        <span>{new Date(manifest.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  {/* Actions for mobile and desktop */}
                  {manifest.status === 'pickup_requested' && (
                    <button
                      onClick={() => setScanningManifest(manifest._id)}
                      className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center space-x-1"
                    >
                      <Scan size={14} />
                      <span className="hidden sm:inline">Scan</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => setExpandedManifest(expandedManifest === manifest._id ? null : manifest._id)}
                    className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    {expandedManifest === manifest._id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
              {expandedManifest === manifest._id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-slate-200"
                >
                  <div className="p-4 space-y-4">
                    {/* Pickup Addresses */}
                    {manifest.pickupAddresses && manifest.pickupAddresses.length > 0 && (
                      <div className="bg-slate-50 rounded-lg p-4">
                        <h4 className="font-medium text-slate-800 mb-3">Pickup Addresses</h4>
                        <div className="space-y-3">
                          {manifest.pickupAddresses.map((address, index) => (
                            <div key={address._id || index} className="flex items-start space-x-2">
                              <MapPin size={16} className="text-slate-600 mt-1 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-800">
                                  {address.addressLine1}
                                  {address.addressLine2 && `, ${address.addressLine2}`}
                                  {address.addressLine3 && `, ${address.addressLine3}`}
                                </p>
                                <p className="text-sm text-slate-600">
                                  {address.city}, {address.state} - {address.postalCode}, {address.country}
                                </p>
                                <div className="flex items-center space-x-4 mt-2 text-sm">
                                  <div className="flex items-center space-x-1">
                                    <User size={12} />
                                    <span>{address.contactPerson}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Phone size={12} />
                                    <span>{address.contactNumber}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 mb-1">Total Weight</p>
                        <p className="font-medium text-slate-800">{manifest.totalWeight}kg</p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1">Total Value</p>
                        <p className="font-medium text-slate-800">₹{manifest.totalValue}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1">Courier Partner</p>
                        <p className="font-medium text-slate-800">{manifest.courierPartner}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1">User Email</p>
                        <p className="font-medium text-slate-800 truncate">{manifest.user?.email}</p>
                      </div>
                    </div>

                    {/* AWB Number */}
                    {manifest.pickupAWB && (
                      <div>
                        <p className="text-sm text-slate-500 mb-1">AWB Number:</p>
                        <p className="font-mono font-medium text-slate-800 bg-slate-100 px-3 py-2 rounded-lg">{manifest.pickupAWB}</p>
                      </div>
                    )}

                    {/* Estimated Pickup */}
                    {manifest.estimatedPickup && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Calendar size={16} className="text-blue-600" />
                          <span className="font-medium text-blue-800">
                            Estimated Pickup: {new Date(manifest.estimatedPickup).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Orders List */}
                    {manifest.orders && manifest.orders.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">Orders in this manifest:</p>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {manifest.orders.map((order) => (
                            <div key={order._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                              <div className="flex-1 min-w-0">
                                <span className="font-mono text-sm">{order.invoiceNo}</span>
                                <span className="text-slate-600 ml-2 truncate">{order.firstName} {order.lastName}</span>
                              </div>
                              <span className="text-sm text-slate-500 flex-shrink-0">{order.weight}kg</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Show More Button */}
      {hasMore && (
        <div className="text-center">
          <button
            onClick={() => setDisplayCount(prev => prev + 10)}
            className="bg-slate-600 text-white px-6 py-3 rounded-lg hover:bg-slate-700 transition-colors font-medium"
          >
            Show More ({filteredManifests.length - displayCount} remaining)
          </button>
        </div>
      )}

      {filteredManifests.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
          <FileText size={48} className="mx-auto text-slate-400 mb-4" />
          <p className="text-slate-600">No pickup requests found</p>
          <p className="text-sm text-slate-500 mt-2">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Scanning Modal */}
      <AnimatePresence>
        {scanningManifest && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-800">
                  Scan Manifest for Pickup
                </h3>
                <button
                  onClick={() => {
                    setScanningManifest(null);
                    setScanError('');
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="w-full aspect-video bg-black rounded-lg overflow-hidden mb-4">
                <video ref={videoRef} className="w-full h-full object-cover" />
              </div>

              {scanError && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                  <AlertCircle size={16} className="text-red-600" />
                  <p className="text-sm text-red-700">{scanError}</p>
                </div>
              )}

              <div className="text-sm text-slate-500 text-center">
                Point your camera at the barcode. The system will automatically mark it as picked up.
              </div>

              {scanLoading && (
                <div className="mt-4 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-slate-600">Processing...</span>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ManifestRequest;