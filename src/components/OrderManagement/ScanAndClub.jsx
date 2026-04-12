'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Camera,
  Users,
  Trash2,
  ScanLine,
  CheckCircle,
  AlertCircle,
  Package,
  Loader2,
  ChevronDown,
  Minimize2,
  Maximize2,
} from 'lucide-react';

const ScanAndClub = ({ isOpen, onClose, orders, onClubSuccess }) => {
  const [codeReader, setCodeReader] = useState(null);
  const codeReaderRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState('');

  const [scannedOrderIds, setScannedOrderIds] = useState([]);
  const [clubName, setClubName] = useState('');
  const [clubbingLoading, setClubbingLoading] = useState(false);
  const [scanFeedback, setScanFeedback] = useState({ type: '', message: '' });

  // Mobile/responsive state
  const [isMobile, setIsMobile] = useState(false);
  const [showOrdersList, setShowOrdersList] = useState(false);
  const [isVideoMinimized, setIsVideoMinimized] = useState(false);

  // refs
  const videoRef = useRef(null);
  const scanTimeoutRef = useRef(null);
  const recentlyScannedRef = useRef(new Set());

  /* ---------------------------
     Resize / mobile detection
     --------------------------- */
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /* ---------------------------
     Start scanner when modal opens and stop when it closes.
     --------------------------- */
  useEffect(() => {
    if (isOpen) {
      if (!isMobile || !showOrdersList) {
        initializeScanner();
      }
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  /* ---------------------------
     Switch between Scanner <-> Orders on mobile
     --------------------------- */
  useEffect(() => {
    if (!isOpen || !isMobile) return;

    if (showOrdersList) {
      stopScanning();
    } else {
      setTimeout(() => {
        initializeScanner();
      }, 150);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showOrdersList, isMobile, isOpen]);

  /* ---------------------------
     Initialize scanner
     --------------------------- */
  const initializeScanner = async () => {
    try {
      if (codeReaderRef.current && typeof codeReaderRef.current.stopContinuousDecode === 'function') {
        try {
          await codeReaderRef.current.stopContinuousDecode();
        } catch (e) {
          console.warn('Error while stopping previous reader:', e);
        }
      }
      codeReaderRef.current = null;
      setCodeReader(null);
      setIsScanning(false);

      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const { DecodeHintType, BarcodeFormat } = await import('@zxing/library');

      const reader = new BrowserMultiFormatReader();
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      reader.hints = hints;

      codeReaderRef.current = reader;
      setCodeReader(reader);

      const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();

      if (!videoInputDevices || videoInputDevices.length === 0) {
        setScannerError('No camera detected. Please check device permissions.');
        return;
      }

      const backCamera = videoInputDevices.find(
        (d) => (d.label || '').toLowerCase().includes('back') || (d.label || '').toLowerCase().includes('rear')
      );
      const selectedDeviceId = backCamera ? backCamera.deviceId : videoInputDevices[0].deviceId;

      await reader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            handleScanResult(result.getText());
          }
          if (error && error.name !== 'NotFoundException') {
            console.error('Scan error:', error);
          }
        }
      );

      setIsScanning(true);
      setScannerError('');
    } catch (err) {
      console.error('Failed to initialize scanner:', err);
      setScannerError('Failed to access the camera. Please allow permissions.');
      setIsScanning(false);
    }
  };

  /* ---------------------------
     Stop scanning and release camera
     --------------------------- */
  const stopScanning = async () => {
    try {
      if (codeReaderRef.current) {
        if (typeof codeReaderRef.current.stopContinuousDecode === 'function') {
          try {
            await codeReaderRef.current.stopContinuousDecode();
          } catch (e) {
            console.warn('stopContinuousDecode failed:', e);
          }
        } else if (typeof codeReaderRef.current.reset === 'function') {
          try {
            codeReaderRef.current.reset();
          } catch (e) {
            console.warn('reset failed:', e);
          }
        }
      }

      if (videoRef.current && videoRef.current.srcObject) {
        try {
          const stream = videoRef.current.srcObject;
          if (stream.getTracks) {
            stream.getTracks().forEach((t) => t.stop());
          }
        } catch (e) {
          console.warn('Error stopping video tracks:', e);
        }
        try {
          videoRef.current.srcObject = null;
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      console.warn('Error while stopping scanner:', e);
    } finally {
      codeReaderRef.current = null;
      setCodeReader(null);
      setIsScanning(false);
    }
  };

  /* ---------------------------
     Scan handler
     - Shows "already scanned" if the order is in scannedOrderIds
     - Shows "already clubbed" if the order has clubInfo.clubbed from the orders prop
     - 2s hardware dedupe via recentlyScannedRef
     --------------------------- */
  const handleScanResult = (scannedCode) => {
    // Fast hardware dedupe: ignore physically repeated reads within 2s
    if (recentlyScannedRef.current.has(scannedCode)) return;

    recentlyScannedRef.current.add(scannedCode);
    setTimeout(() => recentlyScannedRef.current.delete(scannedCode), 2000);

    const foundOrder = orders.find((o) => o._id === scannedCode || o.invoiceNo === scannedCode);

    if (!foundOrder) {
      showScanFeedback('error', `Order not found: ${scannedCode}`);
      if (navigator.vibrate) navigator.vibrate([100, 100, 100]);
      return;
    }

    // 1️⃣ Already in the current scan session
    if (scannedOrderIds.includes(foundOrder._id)) {
      showScanFeedback(
        'warning',
        `Order ${foundOrder.invoiceNo} already scanned in this session!`
      );
      if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
      return;
    }

    // 2️⃣ Already clubbed in another club (server-side info carried in clubInfo)
    if (foundOrder.clubInfo?.clubbed) {
      showScanFeedback(
        'error',
        `Order ${foundOrder.invoiceNo} is already clubbed in "${foundOrder.clubInfo.clubName}". Cannot add to another club.`
      );
      if (navigator.vibrate) navigator.vibrate([100, 100, 100]);
      return;
    }

    // All clear — add to session
    setScannedOrderIds((prev) => [...prev, foundOrder._id]);
    showScanFeedback(
      'success',
      `Added: ${foundOrder.invoiceNo} — ${foundOrder.firstName} ${foundOrder.lastName}`
    );
    if (navigator.vibrate) navigator.vibrate(200);
  };

  const showScanFeedback = (type, message) => {
    setScanFeedback({ type, message });
    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    scanTimeoutRef.current = setTimeout(() => setScanFeedback({ type: '', message: '' }), 3500);
  };

  const removeScannedOrder = (orderId) => setScannedOrderIds((p) => p.filter((id) => id !== orderId));
  const clearAllScanned = () => {
    setScannedOrderIds([]);
    recentlyScannedRef.current.clear();
  };

  const getScannedOrderDetails = () =>
    scannedOrderIds.map((id) => orders.find((o) => o._id === id)).filter(Boolean);

  /* ---------------------------
     Club orders
     - Also validates on the client side that no scanned order is already clubbed
       (in case orders list was stale when modal opened)
     --------------------------- */
  const handleClubOrders = async () => {
    try {
      console.log('[ClubOrders] Button clicked');
      if (scannedOrderIds.length === 0) {
        return showScanFeedback('error', 'Please scan at least one order');
      }
      if (!clubName.trim()) {
        return showScanFeedback('error', 'Please enter a club name');
      }

      // Client-side guard: check if any scanned order is already clubbed
      const scannedOrdersData = getScannedOrderDetails();
      const alreadyClubbed = scannedOrdersData.filter((o) => o.clubInfo?.clubbed);
      if (alreadyClubbed.length > 0) {
        const msgs = alreadyClubbed.map(
          (o) => `${o.invoiceNo} (in "${o.clubInfo.clubName}")`
        );
        return showScanFeedback(
          'error',
          `Cannot club — the following orders are already clubbed: ${msgs.join(', ')}`
        );
      }

      setClubbingLoading(true);

      const userIds = [
        ...new Set(scannedOrdersData.map((o) => o.user?._id || o.user).filter(Boolean)),
      ];

      if (userIds.length === 0) {
        setClubbingLoading(false);
        return showScanFeedback('error', 'Scanned orders must have valid user IDs');
      }

      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      if (!apiBase) {
        return showScanFeedback('error', 'API base URL missing in environment variables');
      }

      const axios = (await import('axios')).default;
      const res = await axios.post(`${apiBase}/api/orders/club`, {
        userIds,
        orderIds: scannedOrderIds,
        clubName: clubName.trim(),
      });

      if (res.status === 201) {
        showScanFeedback('success', 'Orders clubbed successfully!');
        if (onClubSuccess) onClubSuccess();

        setScannedOrderIds([]);
        setClubName('');

        setTimeout(() => {
          stopScanning();
          onClose();
        }, 1200);
      } else {
        showScanFeedback('error', 'Unexpected server response');
      }
    } catch (err) {
      console.error('[ClubOrders] Failed to club orders:', err);

      // Server sends descriptive conflict messages — surface them directly
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to club orders — check network or permissions';

      showScanFeedback('error', errMsg);

      if (/Mobi|Android/i.test(navigator.userAgent)) {
        alert(`Club Orders Error:\n${errMsg}`);
      }
    } finally {
      setClubbingLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full h-full sm:rounded-2xl sm:w-full sm:max-w-6xl sm:h-auto sm:max-h-[95vh] overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-200 bg-white">
          <h3 className="text-base sm:text-xl font-bold flex items-center text-slate-800">
            <ScanLine size={isMobile ? 18 : 22} className="mr-2 text-blue-600" />
            <span className="hidden xs:inline">Scan & Club Orders</span>
            <span className="xs:hidden">Scan Orders</span>
          </h3>

          {isMobile && (
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setShowOrdersList(false)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${!showOrdersList ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'}`}
              >
                Scanner
              </button>
              <button
                onClick={() => setShowOrdersList(true)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors relative ${showOrdersList ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'}`}
              >
                Orders
                {scannedOrderIds.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {scannedOrderIds.length}
                  </span>
                )}
              </button>
            </div>
          )}

          <button
            onClick={() => {
              stopScanning();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={isMobile ? 18 : 20} />
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Scanner Section */}
          {(!isMobile || !showOrdersList) && (
            <div className="flex-1 p-3 sm:p-4 flex flex-col space-y-3 sm:space-y-4 bg-white">
              <div className="relative flex-1 sm:flex-initial">
                <div
                  className={`relative bg-black rounded-lg overflow-hidden transition-all duration-300 ${
                    isMobile && isVideoMinimized ? 'h-32' : isMobile ? 'h-64' : 'aspect-video h-full'
                  }`}
                >
                  <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                  {isMobile && (
                    <div className="absolute top-2 right-2 z-10">
                      <button
                        onClick={() => setIsVideoMinimized((s) => !s)}
                        className="bg-black bg-opacity-50 text-white p-2 rounded-lg backdrop-blur-sm"
                      >
                        {isVideoMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                      </button>
                    </div>
                  )}

                  {!isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                      <div className="text-center text-white p-4">
                        <Camera size={isMobile ? 32 : 48} className="mx-auto mb-2 opacity-50" />
                        <p className={`${isMobile ? 'text-sm' : 'text-base'}`}>Initializing camera...</p>
                      </div>
                    </div>
                  )}

                  {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-64 h-32 sm:w-80 sm:h-40 border-2 border-blue-400 rounded-lg opacity-50">
                        <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-blue-400" />
                        <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-blue-400" />
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-blue-400" />
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-blue-400" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick stats — mobile only */}
              {isMobile && (
                <div className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
                  <div className="text-center flex-1">
                    <div className="text-lg font-bold text-blue-600">{scannedOrderIds.length}</div>
                    <div className="text-xs text-slate-600">Scanned</div>
                  </div>
                  <div className="w-px h-8 bg-slate-300" />
                  <div className="text-center flex-1">
                    <div className={`text-lg font-bold ${isScanning ? 'text-green-600' : 'text-slate-400'}`}>
                      {isScanning ? 'ON' : 'OFF'}
                    </div>
                    <div className="text-xs text-slate-600">Scanner</div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                {scannedOrderIds.length > 0 && (
                  <button
                    onClick={clearAllScanned}
                    className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Trash2 size={isMobile ? 16 : 18} />
                    <span className={isMobile ? 'text-sm' : 'text-base'}>Clear All</span>
                  </button>
                )}

                {isMobile && (
                  <button
                    onClick={() => setShowOrdersList(true)}
                    className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Package size={16} />
                    <span className="text-sm">View Orders ({scannedOrderIds.length})</span>
                  </button>
                )}
              </div>

              {scannerError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center space-x-2 text-red-800">
                    <AlertCircle size={16} />
                    <span className={`font-medium ${isMobile ? 'text-sm' : 'text-base'}`}>Scanner Error</span>
                  </div>
                  <p className={`text-red-700 mt-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>{scannerError}</p>
                </div>
              )}

              <AnimatePresence>
                {scanFeedback.message && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`p-3 sm:p-4 rounded-lg border ${
                      scanFeedback.type === 'success'
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : scanFeedback.type === 'error'
                        ? 'bg-red-50 border-red-200 text-red-800'
                        : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {scanFeedback.type === 'success' ? (
                        <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                      )}
                      <span className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        {scanFeedback.message}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Orders List */}
          {(!isMobile || showOrdersList) && (
            <div className="w-full md:w-96 border-t md:border-t-0 md:border-l border-slate-200 p-3 sm:p-4 bg-slate-50 flex flex-col space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <h4
                  className={`font-semibold text-slate-800 flex items-center ${isMobile ? 'text-sm' : 'text-base'}`}
                >
                  <Package size={isMobile ? 16 : 18} className="mr-2" />
                  Scanned Orders ({scannedOrderIds.length})
                </h4>
                {isMobile && (
                  <button
                    onClick={() => setShowOrdersList(false)}
                    className="text-slate-500 hover:text-slate-700 p-1"
                  >
                    <ChevronDown size={16} />
                  </button>
                )}
              </div>

              <div
                className="space-y-2 flex-1 overflow-y-auto"
                style={{ maxHeight: isMobile ? '40vh' : '50vh' }}
              >
                {getScannedOrderDetails().map((order) => (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white p-2.5 sm:p-3 rounded-lg border border-slate-200 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-slate-800 truncate ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          {order.invoiceNo}
                        </p>
                        <p className={`text-slate-600 truncate text-xs`}>
                          {order.firstName} {order.lastName}
                        </p>
                        <p className={`text-slate-500 text-xs`}>{order.mobile}</p>
                      </div>
                      <button
                        onClick={() => removeScannedOrder(order._id)}
                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                      >
                        <X size={isMobile ? 12 : 14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {scannedOrderIds.length === 0 && (
                <div className="text-center py-6 sm:py-8 text-slate-500">
                  <Package size={isMobile ? 24 : 32} className="mx-auto mb-2 opacity-50" />
                  <p className={isMobile ? 'text-xs' : 'text-sm'}>No orders scanned yet</p>
                </div>
              )}

              <div>
                <label
                  className={`block font-medium mb-2 text-slate-700 ${isMobile ? 'text-xs' : 'text-sm'}`}
                >
                  Club Name *
                </label>
                <input
                  type="text"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  placeholder="Enter club name..."
                  className={`w-full px-3 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    isMobile ? 'py-2 text-sm' : 'py-2.5 text-base'
                  }`}
                />
              </div>

              <button
                onClick={handleClubOrders}
                disabled={clubbingLoading || scannedOrderIds.length === 0 || !clubName.trim()}
                className={`w-full px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 ${
                  isMobile ? 'py-2.5 text-sm' : 'py-3 text-base'
                }`}
              >
                {clubbingLoading ? (
                  <>
                    <Loader2 size={isMobile ? 16 : 18} className="animate-spin" />
                    <span>Clubbing...</span>
                  </>
                ) : (
                  <>
                    <Users size={isMobile ? 16 : 18} />
                    <span>Club Orders</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ScanAndClub;