"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Camera, X, Trash2, AlertTriangle, Package, Scan, Send, Minimize2, Maximize2, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";

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
  const recentlyScannedRef = useRef(new Map()); // Changed to Map to store timestamp
  const lastScanTimeRef = useRef(0); // Global scan throttle

  // Detect mobile
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch orders on mount using axios
  useEffect(() => {
    fetchOrders();
  }, []);

  // Initialize scanner when component mounts or view changes
  useEffect(() => {
    if (fetchingOrders) return;

    if (!isMobile || !showOrdersList) {
      initializeScanner();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    };
  }, [isMobile, showOrdersList, fetchingOrders]);

  // Cleanup old scanned codes from memory every 5 seconds
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const entries = Array.from(recentlyScannedRef.current.entries());
      entries.forEach(([code, timestamp]) => {
        if (now - timestamp > 3000) { // Remove after 3 seconds
          recentlyScannedRef.current.delete(code);
        }
      });
    }, 5000);

    return () => clearInterval(cleanupInterval);
  }, []);

  const fetchOrders = async () => {
    setFetchingOrders(true);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/invoices`
      );
      
      // Handle different response structures
      const orders = response.data?.data || response.data?.invoices || response.data || [];
      
      if (!Array.isArray(orders)) {
        throw new Error("Invalid response format");
      }

      setAllOrders(orders);
      console.log(`✅ Loaded ${orders.length} orders`);
    } catch (error) {
      console.error("Error fetching orders:", error);
      showScanFeedback("error", error.response?.data?.message || "Failed to load orders");
      setAllOrders([]);
    } finally {
      setFetchingOrders(false);
    }
  };

  const initializeScanner = async () => {
    try {
      // Stop any existing scanner
      if (codeReaderRef.current) {
        try {
          if (typeof codeReaderRef.current.stopContinuousDecode === "function") {
            await codeReaderRef.current.stopContinuousDecode();
          }
        } catch (e) {
          console.warn("Error stopping previous reader:", e);
        }
      }
      
      codeReaderRef.current = null;
      setIsScanning(false);

      // Import ZXing library
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const { DecodeHintType, BarcodeFormat } = await import("@zxing/library");

      // Create and configure reader
      const reader = new BrowserMultiFormatReader();
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.EAN_13,
        BarcodeFormat.QR_CODE
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      reader.hints = hints;

      codeReaderRef.current = reader;

      // Get video devices
      const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();

      if (!videoInputDevices || videoInputDevices.length === 0) {
        setScannerError("No camera detected. Please check device permissions.");
        return;
      }

      // Prefer back camera for mobile
      const backCamera = videoInputDevices.find(
        (d) => /back|rear|environment/i.test(d.label || "")
      );
      const selectedDeviceId = backCamera ? backCamera.deviceId : videoInputDevices[0].deviceId;

      // Start continuous decode
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
          await codeReaderRef.current.stopContinuousDecode();
        } else if (typeof codeReaderRef.current.reset === "function") {
          codeReaderRef.current.reset();
        }
      }

      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    } catch (e) {
      console.warn("Error while stopping scanner:", e);
    } finally {
      codeReaderRef.current = null;
      setIsScanning(false);
    }
  };

  const handleScanResult = useCallback((scannedCodeRaw) => {
    try {
      const now = Date.now();
      
      // 🛡️ Global throttle: Prevent any scan within 800ms of last scan
      if (now - lastScanTimeRef.current < 800) {
        console.log("⏱️ Scan throttled (too fast)");
        return;
      }

      // 🧹 Validate input
      if (!scannedCodeRaw || typeof scannedCodeRaw !== "string") {
        console.warn("Invalid scan input");
        return;
      }

      // Normalize: trim and uppercase
      const scannedCode = scannedCodeRaw.trim().toUpperCase();

      // Validate format (alphanumeric and dashes only, min 4 chars)
      if (!/^[A-Z0-9\-]+$/.test(scannedCode) || scannedCode.length < 4) {
        console.warn("❌ Invalid scan format:", scannedCodeRaw);
        return;
      }

      // Check if orders are loaded
      if (!allOrders || allOrders.length === 0) {
        console.warn("📭 Orders not loaded yet");
        showScanFeedback("warning", "Orders not loaded yet — please wait.");
        return;
      }

      // 🔒 Check if this code was recently scanned (within 3 seconds)
      const lastScanTime = recentlyScannedRef.current.get(scannedCode);
      if (lastScanTime && now - lastScanTime < 3000) {
        console.log("⚠️ Duplicate scan ignored (within 3s):", scannedCode);
        return;
      }

      console.log("🔍 Scanning for:", scannedCode);

      // 🔎 Find matching order by invoiceNo, lastMileAWB, or tracking number
      const foundOrder = allOrders.find((order) => {
        const invoiceNo = order.invoiceNo?.toUpperCase() || "";
        const awbNo = order.lastMileAWB?.toUpperCase() || "";
        const trackingNo = order.shipmentDetails?.trackingNumber?.toUpperCase() || "";
        const awbNumber = order.shipmentDetails?.awbNumber?.toUpperCase() || "";
        
        return invoiceNo === scannedCode || 
               awbNo === scannedCode || 
               trackingNo === scannedCode ||
               awbNumber === scannedCode;
      });

      if (!foundOrder) {
        showScanFeedback("error", `❌ Order not found: ${scannedCode}`);
        console.warn("❌ No matching order for:", scannedCode);
        if (navigator.vibrate) navigator.vibrate([100, 100, 100]);
        
        // Update last scan time even for failed scans
        lastScanTimeRef.current = now;
        return;
      }

      // 🚫 Check if already in scanned orders list (by order ID)
      const alreadyScanned = scannedOrders.some(
        (order) => order.orderId === foundOrder._id
      );

      if (alreadyScanned) {
        showScanFeedback("warning", `⚠️ Already scanned: ${foundOrder.invoiceNo}`);
        if (navigator.vibrate) navigator.vibrate([50, 50]);
        
        // Update throttle timers
        lastScanTimeRef.current = now;
        recentlyScannedRef.current.set(scannedCode, now);
        return;
      }

      // ✅ Prepare new order object based on your DB structure
      const newOrder = {
        orderId: foundOrder._id,
        invoiceNo: foundOrder.invoiceNo,
        customerName: `${foundOrder.firstName || ""} ${foundOrder.lastName || ""}`.trim() || "N/A",
        mobile: foundOrder.mobile || "N/A",
        manifest: foundOrder.manifest?.manifestId || foundOrder.manifest || null,
        clientId: foundOrder.user?._id || foundOrder.user || null,
        disputed: false,
        type: "",
        description: "",
      };

      // 🎯 Add to scanned orders (prepend for better UX)
      setScannedOrders((prev) => [newOrder, ...prev]);
      
      // ✅ Success feedback
      showScanFeedback("success", `✅ Added: ${newOrder.invoiceNo}`);
      
      // Vibration feedback
      if (navigator.vibrate) navigator.vibrate(150);

      // 📝 Update throttle tracking
      lastScanTimeRef.current = now;
      recentlyScannedRef.current.set(scannedCode, now);

      console.log("✅ Order added:", newOrder);
      
    } catch (err) {
      console.error("💥 Error in handleScanResult:", err);
      showScanFeedback("error", "Unexpected error during scan.");
    }
  }, [allOrders, scannedOrders]);

  const showScanFeedback = (type, message) => {
    setScanFeedback({ type, message });
    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    scanTimeoutRef.current = setTimeout(() => {
      setScanFeedback({ type: "", message: "" });
    }, 3000);
  };

  const updateOrder = (index, field, value) => {
    setScannedOrders((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // Clear dispute fields if unmarked
      if (field === "disputed" && !value) {
        updated[index].type = "";
        updated[index].description = "";
      }
      
      return updated;
    });
  };

  const removeOrder = (index) => {
    const removedOrder = scannedOrders[index];
    setScannedOrders((prev) => prev.filter((_, i) => i !== index));
    
    // Remove from recently scanned cache
    if (removedOrder?.invoiceNo) {
      recentlyScannedRef.current.delete(removedOrder.invoiceNo.toUpperCase());
    }
    
    showScanFeedback("info", "Order removed");
  };

  const clearAllScanned = () => {
    if (scannedOrders.length === 0) return;
    
    if (confirm(`Clear all ${scannedOrders.length} scanned orders?`)) {
      setScannedOrders([]);
      recentlyScannedRef.current.clear();
      lastScanTimeRef.current = 0;
      showScanFeedback("info", "All orders cleared");
    }
  };

  const handleSubmitAll = async () => {
    // Validation
    if (scannedOrders.length === 0) {
      return showScanFeedback("error", "No orders scanned yet!");
    }

    // Check for disputed orders without type
    const invalidDisputes = scannedOrders.filter(
      (order) => order.disputed && !order.type
    );

    if (invalidDisputes.length > 0) {
      return showScanFeedback(
        "error",
        `Please select dispute type for ${invalidDisputes.length} order(s)`
      );
    }

    // Get unique manifests and clients
    const uniqueManifests = [...new Set(
      scannedOrders.map((o) => o.manifest).filter(Boolean)
    )];
    const uniqueClients = [...new Set(
      scannedOrders.map((o) => o.clientId).filter(Boolean)
    )];

    // Validate single client
    if (uniqueClients.length > 1) {
      return showScanFeedback(
        "error",
        "Multiple clients detected. Please scan one client at a time."
      );
    }

    const manifestId = uniqueManifests.length === 1 ? uniqueManifests[0] : null;
    const clientId = uniqueClients[0] || null;

    // Prepare payload
    const payload = {
      ...(manifestId && { manifestId }), // Changed from manifest to manifestId
      ...(clientId && { clientId }),
      orders: scannedOrders.map((order) => ({
        orderId: order.orderId,
        disputed: order.disputed,
        ...(order.disputed && {
          type: order.type,
          description: order.description,
        }),
      })),
    };

    console.log("📤 Submitting payload:", payload);

    try {
      setLoading(true);
      showScanFeedback("info", "Submitting orders...");

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/inward-scan`,
        payload
      );

      showScanFeedback(
        "success",
        response.data.message || `✅ ${scannedOrders.length} orders processed successfully!`
      );
      toast.success(`✅ ${scannedOrders.length} orders processed successfully!`);
      // Reset after success
      setTimeout(() => {
        setScannedOrders([]);
        recentlyScannedRef.current.clear();
        lastScanTimeRef.current = 0;
      }, 1500);

    } catch (error) {
      console.error("Error submitting orders:", error);
      showScanFeedback(
        "error",
        error.response?.data?.message || "Failed to submit orders"
      );
    } finally {
      setLoading(false);
    }
  };

  const normalCount = scannedOrders.filter((o) => !o.disputed).length;
  const disputedCount = scannedOrders.filter((o) => o.disputed).length;

  // Loading state
  if (fetchingOrders) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg font-medium">Loading orders...</p>
          <p className="text-gray-400 text-sm mt-2">Please wait</p>
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
                  {allOrders.length} orders loaded
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
                {disputedCount > 0 && (
                  <div className="px-2 sm:px-4 py-1 sm:py-2 bg-red-100 border border-red-200 rounded-lg">
                    <span className="text-red-800 font-semibold text-xs sm:text-sm">
                      {disputedCount} Disputed
                    </span>
                  </div>
                )}
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
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !showOrdersList
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              Scanner
            </button>
            <button
              onClick={() => setShowOrdersList(true)}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                showOrdersList
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
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
                <div className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-800">Scan Barcodes</h2>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isScanning
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {isScanning ? "● Active" : "○ Inactive"}
                    </div>
                  </div>
                  
                  <div className="relative mb-4">
                    <div
                      className={`relative bg-black rounded-lg overflow-hidden transition-all duration-300 ${
                        isMobile && isVideoMinimized ? "h-32" : "aspect-video"
                      }`}
                    >
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                      />
                      
                      {isMobile && (
                        <div className="absolute top-2 right-2 z-10">
                          <button
                            onClick={() => setIsVideoMinimized((s) => !s)}
                            className="bg-black bg-opacity-50 text-white p-2 rounded-lg backdrop-blur-sm hover:bg-opacity-70 transition"
                          >
                            {isVideoMinimized ? (
                              <Maximize2 size={16} />
                            ) : (
                              <Minimize2 size={16} />
                            )}
                          </button>
                        </div>
                      )}

                      {!isScanning && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                          <div className="text-center text-white p-4">
                            <Camera
                              size={isMobile ? 32 : 48}
                              className="mx-auto mb-2 opacity-50"
                            />
                            <p className="text-sm sm:text-base">
                              Initializing camera...
                            </p>
                          </div>
                        </div>
                      )}

                      {isScanning && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-48 h-24 sm:w-80 sm:h-40 border-2 border-blue-400 rounded-lg opacity-50 relative">
                            <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-blue-400 rounded-tl" />
                            <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-blue-400 rounded-tr" />
                            <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-blue-400 rounded-bl" />
                            <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-blue-400 rounded-br" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {isMobile && (
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 mb-4">
                      <div className="text-center flex-1">
                        <div className="text-lg font-bold text-blue-600">
                          {scannedOrders.length}
                        </div>
                        <div className="text-xs text-gray-600">Scanned</div>
                      </div>
                      <div className="w-px h-8 bg-gray-300" />
                      <div className="text-center flex-1">
                        <div className="text-lg font-bold text-gray-600">
                          {allOrders.length}
                        </div>
                        <div className="text-xs text-gray-600">Total</div>
                      </div>
                      <div className="w-px h-8 bg-gray-300" />
                      <div className="text-center flex-1">
                        <div
                          className={`text-lg font-bold ${
                            isScanning ? "text-green-600" : "text-gray-400"
                          }`}
                        >
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
                      <span>Clear All ({scannedOrders.length})</span>
                    </button>
                  )}

                  {scannerError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center space-x-2 text-red-800">
                        <AlertTriangle size={16} />
                        <span className="font-medium text-sm">Scanner Error</span>
                      </div>
                      <p className="text-red-700 text-xs mt-1">{scannerError}</p>
                      <button
                        onClick={initializeScanner}
                        className="mt-2 text-xs text-red-600 underline hover:text-red-800"
                      >
                        Retry Camera Access
                      </button>
                    </div>
                  )}

                  {scanFeedback.message && (
                    <div
                      className={`p-3 rounded-lg border mb-4 ${
                        scanFeedback.type === "success"
                          ? "bg-green-50 border-green-200 text-green-800"
                          : scanFeedback.type === "error"
                          ? "bg-red-50 border-red-200 text-red-800"
                          : scanFeedback.type === "info"
                          ? "bg-blue-50 border-blue-200 text-blue-800"
                          : "bg-yellow-50 border-yellow-200 text-yellow-800"
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {scanFeedback.type === "success" ? (
                          <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                        )}
                        <span className="font-medium text-xs sm:text-sm">
                          {scanFeedback.message}
                        </span>
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

                <div
                  className="p-4 sm:p-6 space-y-4"
                  style={{
                    maxHeight: isMobile ? "60vh" : "70vh",
                    overflowY: "auto",
                  }}
                >
                  {scannedOrders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No orders scanned yet</p>
                      <p className="text-xs mt-1">Start scanning barcodes</p>
                    </div>
                  ) : (
                    scannedOrders.map((order, index) => (
                      <div
                        key={`${order.orderId}-${index}`}
                        className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200 space-y-3 hover:border-blue-300 transition"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">
                              {order.invoiceNo}
                            </p>
                            <p className="text-gray-600 text-xs truncate">
                              {order.customerName}
                            </p>
                            <p className="text-gray-500 text-xs">{order.mobile}</p>
                          </div>
                          <button
                            onClick={() => removeOrder(index)}
                            className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors ml-2"
                            title="Remove order"
                          >
                            <X size={16} />
                          </button>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`disputed-${index}`}
                            checked={order.disputed}
                            onChange={(e) =>
                              updateOrder(index, "disputed", e.target.checked)
                            }
                            className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
                          />
                          <label
                            htmlFor={`disputed-${index}`}
                            className="text-sm font-medium text-gray-700 cursor-pointer"
                          >
                            Mark as Disputed
                          </label>
                        </div>

                        {order.disputed && (
                          <div className="space-y-2 pt-2 border-t border-gray-300">
                            <select
                              value={order.type}
                              onChange={(e) =>
                                updateOrder(index, "type", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition text-sm"
                              required={order.disputed}
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
                              onChange={(e) =>
                                updateOrder(index, "description", e.target.value)
                              }
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
                      className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 font-bold text-sm sm:text-base"
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