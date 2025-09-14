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
  AlertCircle
} from 'lucide-react';
import axios from 'axios';

const ManifestRequest = () => {
  const [manifests, setManifests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [scanningManifest, setScanningManifest] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scanInput, setScanInput] = useState('');

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

          // ✅ Properly stop decoding
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

        // Ignore NotFoundException errors
        if (error && error.name !== 'NotFoundException') {
          console.error('ZXing scan error:', error);
          setScanError('Camera error. Please try again.');
        }
      }
    );
  } catch (err) {
    console.error('Failed to start scanning:', err);
    setScanError('Unable to access camera. Check permissions.');
  }
};

// Stop scanner when modal closes
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
        // Refresh the manifests list
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
        // Refresh manifests to show updated status
        await fetchManifests();
        setScanningManifest(null);
        setScanInput('');
        // Show success notification
        alert('Manifest marked as picked up successfully!');
      }
    } catch (error) {
      console.error('Failed to mark manifest as picked up:', error);
      setScanError('Failed to mark manifest as picked up. Please try again.');
    } finally {
      setScanLoading(false);
    }
  };

  const handleScanSubmit = (e) => {
    e.preventDefault();
    if (!scanInput.trim()) {
      setScanError('Please enter a manifest ID');
      return;
    }

    // Find the manifest to verify it exists and is pickup_requested (ready for pickup)
    const manifestExists = manifests.find(m => 
      (m._id === scanInput.trim() || m.manifestId === scanInput.trim()) && 
      m.status === 'pickup_requested'
    );

    if (!manifestExists) {
      setScanError('Manifest ID not found or not ready for pickup');
      return;
    }

    // Use the actual MongoDB _id for the API call
    const actualManifestId = manifestExists._id;
    handleMarkAsPickedUp(actualManifestId);
  };

  const filteredManifests = manifests.filter(manifest => 
    filterStatus === 'all' || manifest.status === filterStatus
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'pickup_requested': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'picked_up': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <Check size={16} className="text-green-600" />;
      case 'pickup_requested': return <Truck size={16} className="text-blue-600" />;
      case 'pending': return <Clock size={16} className="text-yellow-600" />;
      case 'rejected': return <X size={16} className="text-red-600" />;
      case 'picked_up': return <Check size={16} className="text-green-600" />;
      default: return <FileText size={16} className="text-slate-600" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
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
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Pickup Requests</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Filter size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-8 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="pickup_requested">Ready for Pickup</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="picked_up">Picked Up</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-lg">
          <div className="text-2xl font-bold text-slate-800">{manifests.length}</div>
          <div className="text-sm text-slate-600">Total Requests</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {manifests.filter(m => m.status === 'pending').length}
          </div>
          <div className="text-sm text-slate-600">Pending</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg">
          <div className="text-2xl font-bold text-blue-600">
            {manifests.filter(m => m.status === 'pickup_requested').length}
          </div>
          <div className="text-sm text-slate-600">Ready for Pickup</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg">
          <div className="text-2xl font-bold text-green-600">
            {manifests.filter(m => m.status === 'approved').length}
          </div>
          <div className="text-sm text-slate-600">Approved</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg">
          <div className="text-2xl font-bold text-red-600">
            {manifests.filter(m => m.status === 'rejected').length}
          </div>
          <div className="text-sm text-slate-600">Rejected</div>
        </div>
      </div>
      
      {/* Manifest Cards */}
      <div className="space-y-4">
        {filteredManifests.map((manifest) => (
          <motion.div 
            key={manifest._id} 
            className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                {/* Left Section - Main Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                      <FileText size={24} className="text-slate-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">{manifest.manifestId}</h3>
                      <p className="text-slate-600 flex items-center space-x-1">
                        <User size={14} />
                        <span>{manifest.user?.fullname}</span>
                      </p>
                      <p className="text-sm text-slate-500">{manifest.user?.email}</p>
                    </div>
                  </div>
                  
                  {/* Pickup Address */}
                  {manifest.pickupAddress && (
                    <div className="bg-slate-50 rounded-xl p-4 mb-4">
                      <div className="flex items-start space-x-2">
                        <MapPin size={16} className="text-slate-600 mt-1" />
                        <div>
                          <p className="font-medium text-slate-800">{manifest.pickupAddress.name}</p>
                          <p className="text-sm text-slate-600">{manifest.pickupAddress.address}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm">
                            <div className="flex items-center space-x-1">
                              <User size={12} />
                              <span>{manifest.pickupAddress.contactPerson}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Phone size={12} />
                              <span>{manifest.pickupAddress.contactNumber}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500 mb-1">Orders</p>
                      <p className="font-medium text-slate-800 flex items-center">
                        <Package size={14} className="mr-1" />
                        {manifest.totalOrders}
                      </p>
                    </div>
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
                  </div>

                  {/* Pickup Schedule */}
                  {manifest.pickupDate && manifest.pickupTime && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Calendar size={16} className="text-blue-600" />
                        <span className="font-medium text-blue-800">
                          Scheduled Pickup: {new Date(manifest.pickupDate).toLocaleDateString()} at {manifest.pickupTime}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* AWB Number */}
                  {manifest.pickupAWB && (
                    <div className="mt-3">
                      <p className="text-sm text-slate-500">AWB Number:</p>
                      <p className="font-mono font-medium text-slate-800">{manifest.pickupAWB}</p>
                    </div>
                  )}

                  {/* Orders List */}
                  {manifest.orders && manifest.orders.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-slate-700 mb-2">Orders in this manifest:</p>
                      <div className="space-y-1">
                        {manifest.orders.map((order) => (
                          <div key={order._id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                            <div>
                              <span className="font-mono text-sm">{order.invoiceNo}</span>
                              <span className="text-slate-600 ml-2">{order.firstName} {order.lastName}</span>
                            </div>
                            <span className="text-sm text-slate-500">{order.weight}kg</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Section - Status and Actions */}
                <div className="flex flex-col items-end space-y-4 min-w-[200px]">
                  <div className="flex items-center space-x-2">
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(manifest.status)}`}>
                      {getStatusIcon(manifest.status)}
                      <span className="font-medium capitalize">{manifest.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-slate-500 flex items-center">
                    <Calendar size={14} className="mr-1" />
                    {new Date(manifest.createdAt).toLocaleDateString()}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col items-end space-y-2 w-full">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors" title="View Details">
                        <Eye size={16} />
                      </button>
                      
                      {manifest.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleManifestAction(manifest._id, 'approve')}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleManifestAction(manifest._id, 'reject')}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>

                    {/* Scan for Pickup Button */}
                    {manifest.status === 'pickup_requested' && (
                      <button
                        onClick={() => setScanningManifest(manifest._id)}
                        className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center space-x-2"
                      >
                        <Scan size={16} />
                        <span>Scan for Pickup</span>
                      </button>
                    )}

                    {manifest.status === 'picked_up' && (
                      <div className="w-full bg-green-50 border border-green-200 px-4 py-3 rounded-lg">
                        <div className="flex items-center justify-center space-x-2 text-green-700">
                          <Check size={16} />
                          <span className="text-sm font-medium">Already Picked Up</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredManifests.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
          <FileText size={48} className="mx-auto text-slate-400 mb-4" />
          <p className="text-slate-600">No pickup requests found</p>
        </div>
      )}

      {/* Scanning Modal */}
            <AnimatePresence>
        {scanningManifest && (
          <motion.div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-800">
                  Scan Manifest for Pickup
                </h3>
                <button
                  onClick={() => {
                    setScanningManifest(null);
                    setScanError('');
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Live video feed */}
              <div className="w-full aspect-video bg-black rounded-lg overflow-hidden mb-4">
                <video ref={videoRef} className="w-full h-full object-cover" />
              </div>

              {scanError && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle size={16} className="text-red-600" />
                  <p className="text-sm text-red-700">{scanError}</p>
                </div>
              )}

              <div className="mt-4 text-sm text-slate-500">
                Point your camera at the barcode. The system will automatically mark it as picked up.
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ManifestRequest;