"use client";

import React, { useState, useEffect, useRef } from "react";
import { Camera, X, Trash2, AlertTriangle, Package, Scan, Send, Minimize2, Maximize2, Loader2, CheckCircle, AlertCircle } from "lucide-react";

const disputeTypes = [
  { value: "weight_discrepancy", label: "Weight Discrepancy", icon: "⚖️" },
  { value: "missing_parcel", label: "Missing Parcel", icon: "📦" },
  { value: "damaged_parcel", label: "Damaged Parcel", icon: "💔" },
  { value: "incorrect_order", label: "Incorrect Order", icon: "❌" },
  { value: "late_pickup", label: "Late Pickup", icon: "⏰" },
  { value: "other", label: "Other", icon: "❓" }
];

const InwardScan = () => {
  const [allOrders, setAllOrders] = useState([]);
  const [scannedOrders, setScannedOrders] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

  const [loading, setLoading] = useState(false);
  const [fetchingOrders, setFetchingOrders] = useState(true);
  const [scannerError, setScannerError] = useState("");
  const [scanFeedback, setScanFeedback] = useState({ type: "", message: "" });
  
  // Mobile/responsive state
  const [isMobile, setIsMobile] = useState(false);
  const [showOrdersList, setShowOrdersList] = useState(false);
  const [isVideoMinimized, setIsVideoMinimized] = useState(false);
  
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const scanTimeoutRef = useRef(null);
  const recentlyScannedRef = useRef(new Set());

  // Detect mobile
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch orders on mount
  useEffect(() => {
    fetchOrders();
  }, []);

  // Initialize scanner when component mounts or view changes
  useEffect(() => {
    if (!isMobile || !showOrdersList) {
      initializeScanner();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    };
  }, [isMobile, showOrdersList]);

  const fetchOrders = async () => {
    setFetchingOrders(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/orders/total`
      );
      
      if (!response.ok) throw new Error("Failed to fetch orders");
      
      const data = await response.json();
      setAllOrders(data?.data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      showScanFeedback("error", "Failed to load orders");
    } finally {
      setFetchingOrders(false);
    }
  };

  const initializeScanner = async () => {
    try {
      if (codeReaderRef.current && typeof codeReaderRef.current.stopContinuousDecode === "function") {
        try {
          await codeReaderRef.current.stopContinuousDecode();
        } catch (e) {
          console.warn("Error stopping previous reader:", e);
        }
      }
      
      codeReaderRef.current = null;
      setIsScanning(false);

      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const { DecodeHintType, BarcodeFormat } = await import("@zxing/library");

      const reader = new BrowserMultiFormatReader();
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      reader.hints = hints;

      codeReaderRef.current = reader;

      const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();

      if (!videoInputDevices || videoInputDevices.length === 0) {
        setScannerError("No camera detected. Please check device permissions.");
        return;
      }

      const backCamera = videoInputDevices.find(
        (d) => (d.label || "").toLowerCase().includes("back") || (d.label || "").toLowerCase().includes("rear")
      );
      const selectedDeviceId = backCamera ? backCamera.deviceId : videoInputDevices[0].deviceId;

      await reader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            handleScanResult(result.getText());
          }
          if (error && error.name !== "NotFoundException") {
            console.error("Scan error:", error);
          }
        }
      );

      setIsScanning(true);
      setScannerError("");
    } catch (err) {
      console.error("Failed to initialize scanner:", err);
      setScannerError("Failed to access the camera. Please allow permissions.");
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    try {
      if (codeReaderRef.current) {
        if (typeof codeReaderRef.current.stopContinuousDecode === "function") {
          try {
            await codeReaderRef.current.stopContinuousDecode();
          } catch (e) {
            console.warn("stopContinuousDecode failed:", e);
          }
        } else if (typeof codeReaderRef.current.reset === "function") {
          try {
            codeReaderRef.current.reset();
          } catch (e) {
            console.warn("reset failed:", e);
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
          console.warn("Error stopping video tracks:", e);
        }
        try {
          videoRef.current.srcObject = null;
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      console.warn("Error while stopping scanner:", e);
    } finally {
      codeReaderRef.current = null;
      setIsScanning(false);
    }
  };

  const handleScanResult = (scannedCode) => {
    if (recentlyScannedRef.current.has(scannedCode)) return;

    recentlyScannedRef.current.add(scannedCode);
    setTimeout(() => recentlyScannedRef.current.delete(scannedCode), 2000);

    const foundOrder = allOrders.find((o) => o._id === scannedCode || o.invoiceNo === scannedCode);

    if (foundOrder) {
      if (scannedOrders.some(order => order.orderId === foundOrder._id)) {
        showScanFeedback("warning", `Order ${foundOrder.invoiceNo} already scanned!`);
        return;
      }
      
  const newOrder = {
  orderId: foundOrder._id,
  invoiceNo: foundOrder.invoiceNo,
  customerName: `${foundOrder.firstName || ""} ${foundOrder.lastName || ""}`.trim(),
  mobile: foundOrder.mobile,
  manifestId: foundOrder.manifest,   // ✅ add this
  clientId: foundOrder.user,           // ✅ add this
  disputed: false,
  type: "",
  description: ""
};


      setScannedOrders((prev) => [...prev, newOrder]);
      showScanFeedback("success", `Added: ${foundOrder.invoiceNo} - ${newOrder.customerName}`);
      if (navigator.vibrate) navigator.vibrate(200);
    } else {
      showScanFeedback("error", `Order not found: ${scannedCode}`);
      if (navigator.vibrate) navigator.vibrate([100, 100, 100]);
    }
  };

  const showScanFeedback = (type, message) => {
    setScanFeedback({ type, message });
    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    scanTimeoutRef.current = setTimeout(() => setScanFeedback({ type: "", message: "" }), 3000);
  };

  const updateOrder = (index, field, value) => {
    setScannedOrders((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      if (field === "disputed" && !value) {
        updated[index].type = "";
        updated[index].description = "";
      }
      
      return updated;
    });
  };

  const removeOrder = (index) => {
    setScannedOrders((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllScanned = () => {
    setScannedOrders([]);
    recentlyScannedRef.current.clear();
  };
const handleSubmitAll = async () => {
  if (scannedOrders.length === 0) {
    return showScanFeedback("error", "No orders scanned yet!");
  }

  // Get unique manifest and client IDs
  const uniqueManifests = [...new Set(scannedOrders.map(o => o.manifest).filter(Boolean))];
  const uniqueClients = [...new Set(scannedOrders.map(o => o.clientId).filter(Boolean))];

  // Identify current manifest and client (optional manifest)
  const manifest = uniqueManifests.length === 1 ? uniqueManifests[0] : null;
  const clientId = uniqueClients[0] || null;

  // If there are multiple clients, stop the process
  if (uniqueClients.length > 1) {
    return showScanFeedback("error", "Scanned orders belong to multiple clients. Please scan one client at a time.");
  }

  // Optional warning if manifest is missing
  if (!manifest) {
    showScanFeedback("warning", "No manifest detected — continuing without manifest link.");
  }

  // Prepare the payload
  const payload = {
    ...(manifest && { manifest }), // only include if exists
    ...(clientId && { clientId }), // only include if exists
    orders: scannedOrders.map(order => ({
      orderId: order.orderId,
      disputed: order.disputed,
      ...(order.disputed && {
        type: order.type,
        description: order.description
      })
    }))
  };

  try {
    setLoading(true);
    showScanFeedback("info", "Submitting scanned orders...");

    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/inward-scan`, payload);

    showScanFeedback("success", response.data.message || "Orders processed successfully!");

    // Reset UI after success
    setScannedOrders([]);
    setScanResult(null);
  } catch (error) {
    console.error("Error submitting orders:", error);
    showScanFeedback("error", error.response?.data?.message || "Failed to submit orders");
  } finally {
    setLoading(false);
  }
};


  const normalCount = scannedOrders.filter((o) => !o.disputed).length;
  const disputedCount = scannedOrders.filter((o) => o.disputed).length;

  if (fetchingOrders) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg font-medium">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Scan className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Inward Scan
                </h1>
                <p className="text-gray-500 text-xs sm:text-sm hidden sm:block">
                  Scan orders and manage disputes
                </p>
              </div>
            </div>
            
            {scannedOrders.length > 0 && (
              <div className="flex gap-2 sm:gap-3">
                <div className="px-2 sm:px-4 py-1 sm:py-2 bg-green-100 border border-green-200 rounded-lg">
                  <span className="text-green-800 font-semibold text-xs sm:text-sm">
                    {normalCount} Normal
                  </span>
                </div>
                <div className="px-2 sm:px-4 py-1 sm:py-2 bg-red-100 border border-red-200 rounded-lg">
                  <span className="text-red-800 font-semibold text-xs sm:text-sm">
                    {disputedCount} Disputed
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      {isMobile && (
        <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
          <div className="flex items-center justify-center p-2 space-x-2">
            <button
              onClick={() => setShowOrdersList(false)}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!showOrdersList ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
            >
              Scanner
            </button>
            <button
              onClick={() => setShowOrdersList(true)}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${showOrdersList ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
            >
              Orders
              {scannedOrders.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {scannedOrders.length}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Scanner Section */}
          {(!isMobile || !showOrdersList) && (
            <div className="flex-1">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

                {/* Scanner */}
                <div className="p-4 sm:p-6">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Scan Barcodes</h2>
                  
                  <div className="relative mb-4">
                    <div className={`relative bg-black rounded-lg overflow-hidden transition-all duration-300 ${isMobile && isVideoMinimized ? "h-32" : "aspect-video"}`}>
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
                            <p className="text-sm sm:text-base">Initializing camera...</p>
                          </div>
                        </div>
                      )}

                      {isScanning && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-48 h-24 sm:w-80 sm:h-40 border-2 border-blue-400 rounded-lg opacity-50">
                            <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-blue-400" />
                            <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-blue-400" />
                            <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-blue-400" />
                            <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-blue-400" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {isMobile && (
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 mb-4">
                      <div className="text-center flex-1">
                        <div className="text-lg font-bold text-blue-600">{scannedOrders.length}</div>
                        <div className="text-xs text-gray-600">Scanned</div>
                      </div>
                      <div className="w-px h-8 bg-gray-300" />
                      <div className="text-center flex-1">
                        <div className={`text-lg font-bold ${isScanning ? "text-green-600" : "text-gray-400"}`}>
                          {isScanning ? "ON" : "OFF"}
                        </div>
                        <div className="text-xs text-gray-600">Scanner</div>
                      </div>
                    </div>
                  )}

                  {scannedOrders.length > 0 && (
                    <button
                      onClick={clearAllScanned}
                      className="w-full px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base mb-4"
                    >
                      <Trash2 size={18} />
                      <span>Clear All Scanned</span>
                    </button>
                  )}

                  {scannerError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center space-x-2 text-red-800">
                        <AlertTriangle size={16} />
                        <span className="font-medium text-sm">Scanner Error</span>
                      </div>
                      <p className="text-red-700 text-xs mt-1">{scannerError}</p>
                    </div>
                  )}

                  {scanFeedback.message && (
                    <div
                      className={`p-3 rounded-lg border mb-4 ${
                        scanFeedback.type === "success"
                          ? "bg-green-50 border-green-200 text-green-800"
                          : scanFeedback.type === "error"
                          ? "bg-red-50 border-red-200 text-red-800"
                          : "bg-yellow-50 border-yellow-200 text-yellow-800"
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {scanFeedback.type === "success" ? (
                          <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                        )}
                        <span className="font-medium text-xs sm:text-sm">{scanFeedback.message}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Orders List */}
          {(!isMobile || showOrdersList) && (
            <div className="w-full lg:w-96">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                  <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center">
                    <Package size={18} className="mr-2" />
                    Scanned Orders ({scannedOrders.length})
                  </h2>
                </div>

                <div className="p-4 sm:p-6 space-y-4" style={{ maxHeight: isMobile ? "60vh" : "70vh", overflowY: "auto" }}>
                  {scannedOrders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No orders scanned yet</p>
                      <p className="text-xs mt-1">Start scanning barcodes</p>
                    </div>
                  ) : (
                    scannedOrders.map((order, index) => (
                      <div key={order.orderId} className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">{order.invoiceNo}</p>
                            <p className="text-gray-600 text-xs truncate">{order.customerName}</p>
                            <p className="text-gray-500 text-xs">{order.mobile}</p>
                          </div>
                          <button
                            onClick={() => removeOrder(index)}
                            className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors ml-2"
                          >
                            <X size={16} />
                          </button>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={order.disputed}
                            onChange={(e) => updateOrder(index, "disputed", e.target.checked)}
                            className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
                          />
                          <label className="text-sm font-medium text-gray-700">Mark as Disputed</label>
                        </div>

                        {order.disputed && (
                          <div className="space-y-2 pt-2 border-t border-gray-300">
                            <select
                              value={order.type}
                              onChange={(e) => updateOrder(index, "type", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition text-sm"
                            >
                              <option value="">Select dispute type...</option>
                              {disputeTypes.map((type) => (
                                <option key={type.value} value={type.value}>
                                  {type.icon} {type.label}
                                </option>
                              ))}
                            </select>
                            <textarea
                              value={order.description}
                              onChange={(e) => updateOrder(index, "description", e.target.value)}
                              placeholder="Enter dispute details..."
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition resize-none text-sm"
                            />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {scannedOrders.length > 0 && (
                  <div className="p-4 sm:p-6 border-t border-gray-200">
                    <button
                      onClick={handleSubmitAll}
                      disabled={loading || scannedOrders.length === 0}

                      className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl transform hover:scale-105 font-bold text-sm sm:text-base"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Submit All Orders ({scannedOrders.length})
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InwardScan;