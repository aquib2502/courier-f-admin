"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  User,
  Package,
  Search,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  Truck,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  FileTextIcon,
  Printer,
  Loader2,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

const Clubbing = () => {
  const [clubbings, setClubbings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [expandedClubbing, setExpandedClubbing] = useState(null);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [currentTrackingNumber, setCurrentTrackingNumber] = useState(null);
  const [bulkPrinting, setBulkPrinting] = useState(null);

  const [orderPage, setOrderPage] = useState(1);
  const ordersPerPage = 10;

  useEffect(() => {
    fetchClubbings();
  }, []);

  const fetchClubbings = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/clubbing`
      );
      if (response.status === 200) {
        setClubbings(response?.data?.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch clubbings:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDateFilteredClubbings = () => {
    const now = new Date();
    return clubbings.filter((clubbing) => {
      const clubbingDate = new Date(clubbing.clubbedAt);
      switch (dateFilter) {
        case "today":
          return clubbingDate.toDateString() === now.toDateString();
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return clubbingDate >= weekAgo;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return clubbingDate >= monthAgo;
        default:
          return true;
      }
    });
  };

  const toggleExpanded = (clubbingId) => {
    if (expandedClubbing === clubbingId) {
      setExpandedClubbing(null);
      setOrderPage(1);
    } else {
      setExpandedClubbing(clubbingId);
      setOrderPage(1);
    }
  };

  const getStatusColor = (status) => {
    if (!status) return "bg-slate-100 text-slate-800";
    switch (status.toLowerCase()) {
      case "delivered": return "bg-green-100 text-green-800";
      case "manifested": return "bg-purple-100 text-purple-800";
      case "in transit": return "bg-blue-100 text-blue-800";
      case "processing": return "bg-orange-100 text-orange-800";
      case "packed": return "bg-indigo-100 text-indigo-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const getPaymentStatusColor = (status) => {
    if (!status) return "bg-slate-100 text-slate-800";
    switch (status.toLowerCase()) {
      case "payment received": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const calculateTotalValue = (clubbing) => {
    return clubbing.clubbedOrders.reduce((total, order) => {
      const orderTotal = order.productItems.reduce(
        (sum, item) => sum + item.productPrice * item.productQuantity,
        0
      );
      return total + orderTotal;
    }, 0);
  };

  const getTotalWeight = (clubbing) => {
    return clubbing.clubbedOrders
      .reduce((total, order) => total + parseFloat(order.weight || 0), 0)
      .toFixed(1);
  };

  const getOrderStatusCounts = (orders) => {
    return orders.reduce((counts, order) => {
      const status = order.orderStatus || "unknown";
      counts[status] = (counts[status] || 0) + 1;
      return counts;
    }, {});
  };

  const getPaginatedOrders = (orders) => {
    const startIndex = (orderPage - 1) * ordersPerPage;
    return orders.slice(startIndex, startIndex + ordersPerPage);
  };

  const getTotalPages = (totalOrders) => {
    return Math.ceil(totalOrders / ordersPerPage);
  };

  /**
   * Resolves a pdf field to a full URL.
   * External http/https URLs are used as-is.
   * Server-relative paths are prefixed with NEXT_PUBLIC_API_URL.
   */
  const resolveLabel = (pdf) => {
    if (!pdf) return null;
    if (pdf.startsWith("http://") || pdf.startsWith("https://")) return pdf;
    const base = process.env.NEXT_PUBLIC_API_URL || "";
    return `${base}${pdf.startsWith("/") ? "" : "/"}${pdf}`;
  };

  /**
   * Bulk print: opens a single popup window that embeds all label URLs
   * as iframes stacked vertically. No fetch/blob — each iframe loads
   * the URL directly so CORS is never an issue.
   * A status bar tracks load progress and enables "Print All" when ready.
   */
  const handleBulkPrint = (clubbing) => {
    const labelUrls = clubbing.clubbedOrders
      .map((order) => resolveLabel(order?.shipmentDetails?.pdf))
      .filter(Boolean);

    if (labelUrls.length === 0) {
      toast.warning("No labels available to print for this clubbing.");
      return;
    }

    setBulkPrinting(clubbing._id);

    const printWindow = window.open("", "_blank", "width=960,height=800");

    if (!printWindow) {
      toast.error(
        "Popup blocked! Please allow popups for this site and try again."
      );
      setBulkPrinting(null);
      return;
    }

    const totalFrames = labelUrls.length;

    // Each iframe is A4-height (1122px at 96dpi). Stacked vertically.
    // On @media print each becomes its own page via page-break-after.
    const iframeTags = labelUrls
      .map(
        (url, i) =>
          `<iframe
            id="lbl_${i}"
            src="${url}"
            style="display:block;width:100%;height:1122px;border:none;page-break-after:always;break-after:page;"
          ></iframe>`
      )
      .join("\n");

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Bulk Labels — ${clubbing.clubName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #f1f5f9; font-family: sans-serif; }
    #bar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
      background: #1e293b; color: #fff;
      padding: 10px 16px;
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px;
    }
    #msg { font-size: 13px; flex: 1; }
    #progress {
      height: 4px; background: #334155; border-radius: 2px;
      flex: 1; max-width: 200px; overflow: hidden;
    }
    #bar div#progress-fill {
      height: 100%; background: #f97316;
      width: 0%; transition: width 0.3s;
      border-radius: 2px;
    }
    #printBtn {
      background: #f97316; color: #fff; border: none;
      padding: 8px 18px; border-radius: 6px;
      font-size: 13px; font-weight: 600; cursor: pointer;
      white-space: nowrap;
    }
    #printBtn:disabled { background: #475569; cursor: not-allowed; }
    #wrapper { padding-top: 48px; }
    @media print {
      #bar { display: none !important; }
      #wrapper { padding-top: 0 !important; }
      iframe {
        width: 100% !important;
        height: 100vh !important;
        border: none !important;
        page-break-after: always !important;
        break-after: page !important;
      }
    }
  </style>
</head>
<body>
  <div id="bar">
    <span id="msg">Loading labels… 0 / ${totalFrames}</span>
    <div id="progress"><div id="progress-fill"></div></div>
    <button id="printBtn" disabled onclick="window.print()">🖨 Print All</button>
  </div>
  <div id="wrapper">
    ${iframeTags}
  </div>
  <script>
    var total = ${totalFrames};
    var loaded = 0;
    function onFrameSettled() {
      loaded++;
      var pct = Math.round((loaded / total) * 100);
      document.getElementById('progress-fill').style.width = pct + '%';
      if (loaded >= total) {
        document.getElementById('msg').textContent =
          'All ' + total + ' label(s) ready — click Print All';
        document.getElementById('printBtn').disabled = false;
      } else {
        document.getElementById('msg').textContent =
          'Loading labels… ' + loaded + ' / ' + total;
      }
    }
    document.querySelectorAll('iframe').forEach(function(f) {
      f.addEventListener('load', onFrameSettled);
      f.addEventListener('error', onFrameSettled);
    });
  </script>
</body>
</html>`);

    printWindow.document.close();
    setBulkPrinting(null);

    toast.success(
      `Opened bulk print window for ${labelUrls.length} label(s). Click "Print All" once they finish loading.`
    );
  };

  const filteredClubbings = getDateFilteredClubbings().filter((clubbing) => {
    const clubbingFields = [
      clubbing.clubName,
      clubbing.usernames,
      clubbing.useremails,
      clubbing.clubbedOrders.length.toString(),
      calculateTotalValue(clubbing).toString(),
    ]
      .join(" ")
      .toLowerCase();

    const orderInvoices = clubbing.clubbedOrders
      .map((order) => order.invoiceNo)
      .join(" ")
      .toLowerCase();

    return `${clubbingFields} ${orderInvoices}`.includes(
      searchTerm.toLowerCase()
    );
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-800">Clubbing Management</h1>
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="animate-pulse border-b border-slate-200 pb-4 last:border-b-0">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-6 bg-slate-200 rounded w-48"></div>
                    <div className="h-4 bg-slate-200 rounded w-64"></div>
                    <div className="h-4 bg-slate-200 rounded w-32"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-8 bg-slate-200 rounded w-24"></div>
                    <div className="h-4 bg-slate-200 rounded w-20"></div>
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
        <h1 className="text-2xl font-bold text-slate-800">Clubbing Management</h1>
        <div className="flex items-center space-x-3">
          <button className="bg-slate-800 text-white px-4 py-2 rounded-xl hover:bg-slate-700 transition-colors flex items-center space-x-2">
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-lg">
          <div className="text-2xl font-bold text-slate-800">{filteredClubbings.length}</div>
          <div className="text-sm text-slate-600">Total Clubbings</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg">
          <div className="text-2xl font-bold text-blue-600">
            {filteredClubbings.reduce((sum, c) => sum + c.clubbedOrders.length, 0)}
          </div>
          <div className="text-sm text-slate-600">Total Orders</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg">
          <div className="text-2xl font-bold text-green-600">
            {filteredClubbings.reduce((sum, c) => sum + c.userIds.length, 0)}
          </div>
          <div className="text-sm text-slate-600">Unique Users</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg">
          <div className="text-2xl font-bold text-purple-600">
            ${filteredClubbings.reduce((sum, c) => sum + calculateTotalValue(c), 0).toLocaleString()}
          </div>
          <div className="text-sm text-slate-600">Total Value</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by club name, user details, order count, order invoice or value..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>
          <div className="relative">
            <Filter size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-10 pr-8 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 appearance-none bg-white"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clubbings List */}
      <div className="space-y-4">
        {filteredClubbings.map((clubbing) => {
          const statusCounts = getOrderStatusCounts(clubbing.clubbedOrders);
          const paginatedOrders =
            expandedClubbing === clubbing._id
              ? getPaginatedOrders(clubbing.clubbedOrders)
              : [];
          const totalPages = getTotalPages(clubbing.clubbedOrders.length);
          const labelsAvailable = clubbing.clubbedOrders.filter(
            (o) => o?.shipmentDetails?.pdf
          ).length;
          const isBulkPrinting = bulkPrinting === clubbing._id;

          return (
            <motion.div
              key={clubbing._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              {/* Clubbing Header */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Users size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">{clubbing.clubName}</h3>
                        <p className="text-sm text-slate-500">
                          Created {new Date(clubbing.clubbedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Bulk Print Button */}
                    <button
                      onClick={() => handleBulkPrint(clubbing)}
                      disabled={isBulkPrinting || labelsAvailable === 0}
                      title={
                        labelsAvailable === 0
                          ? "No labels available"
                          : `Bulk print ${labelsAvailable} label(s)`
                      }
                      className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors
                        ${
                          labelsAvailable === 0
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : isBulkPrinting
                            ? "bg-orange-100 text-orange-600 cursor-wait"
                            : "bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200"
                        }`}
                    >
                      {isBulkPrinting ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Printer size={16} />
                      )}
                      <span>
                        {isBulkPrinting ? "Preparing..." : `Bulk Print (${labelsAvailable})`}
                      </span>
                    </button>

                    <div className="text-right">
                      <div className="text-xl font-bold text-green-600">
                        ${calculateTotalValue(clubbing).toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500">Total Value</div>
                    </div>
                    <button
                      onClick={() => toggleExpanded(clubbing._id)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      {expandedClubbing === clubbing._id ? (
                        <ChevronUp size={20} />
                      ) : (
                        <ChevronDown size={20} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="text-lg font-bold text-slate-800">{clubbing.clubbedOrders.length}</div>
                    <div className="text-xs text-slate-600">Orders</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="text-lg font-bold text-slate-800">{clubbing.userIds.length}</div>
                    <div className="text-xs text-slate-600">Users</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="text-lg font-bold text-slate-800">{getTotalWeight(clubbing)} kg</div>
                    <div className="text-xs text-slate-600">Total Weight</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="text-lg font-bold text-slate-800">{Object.keys(statusCounts).length}</div>
                    <div className="text-xs text-slate-600">Status Types</div>
                  </div>
                </div>

                {/* Status Distribution */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {Object.entries(statusCounts).map(([status, count]) => (
                    <span
                      key={status}
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}
                    >
                      {status}: {count}
                    </span>
                  ))}
                </div>

                {/* Users Preview */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <h4 className="font-medium text-slate-700 mb-2 flex items-center">
                    <User size={16} className="mr-2" />
                    Users ({clubbing.userIds.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {clubbing.userIds.slice(0, 3).map((user) => (
                      <div key={user._id} className="bg-white rounded-lg p-2 text-xs">
                        <div className="font-medium text-slate-800">{user.fullname}</div>
                        <div className="text-slate-600">{user.email}</div>
                      </div>
                    ))}
                    {clubbing.userIds.length > 3 && (
                      <div className="bg-white rounded-lg p-2 text-xs flex items-center text-slate-600">
                        <MoreHorizontal size={14} />
                        <span className="ml-1">+{clubbing.userIds.length - 3} more</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Orders */}
              {expandedClubbing === clubbing._id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-200 bg-slate-50"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-slate-800 flex items-center">
                        <Package size={18} className="mr-2" />
                        Orders ({clubbing.clubbedOrders.length})
                      </h4>
                      {totalPages > 1 && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setOrderPage(Math.max(1, orderPage - 1))}
                            disabled={orderPage === 1}
                            className="p-2 bg-white rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <span className="text-sm text-slate-600 px-3">
                            Page {orderPage} of {totalPages}
                          </span>
                          <button
                            onClick={() => setOrderPage(Math.min(totalPages, orderPage + 1))}
                            disabled={orderPage === totalPages}
                            className="p-2 bg-white rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-slate-100">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Order</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Customer</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Destination</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Items</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Value</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Status</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {paginatedOrders.map((order) => (
                              <tr key={order._id} className="hover:bg-slate-50">
                                <td className="px-4 py-3">
                                  <div className="font-medium text-slate-800 text-sm">{order.invoiceNo}</div>
                                  <div className="text-xs text-slate-500">
                                    {new Date(order.invoiceDate).toLocaleDateString()}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="font-medium text-slate-800 text-sm">
                                    {order.firstName} {order.lastName}
                                  </div>
                                  <div className="text-xs text-slate-500">{order.mobile}</div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="font-medium text-slate-800 text-sm">{order.country}</div>
                                  <div className="text-xs text-slate-500">{order.city}</div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="font-medium text-slate-800 text-sm">
                                    {order.productItems.length} item(s)
                                  </div>
                                  <div className="text-xs text-slate-500">{order.weight} kg</div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="font-medium text-green-600 text-sm">
                                    ${order.productItems
                                      .reduce(
                                        (sum, item) => sum + item.productPrice * item.productQuantity,
                                        0
                                      )
                                      .toLocaleString()}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="space-y-1">
                                    <span
                                      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}
                                    >
                                      {order.orderStatus}
                                    </span>
                                    <div
                                      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}
                                    >
                                      {order.paymentStatus}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center space-x-1">
                                    {order.shipmentDetails?.pdf && (
                                      <a
                                        href={resolveLabel(order.shipmentDetails.pdf)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        title="View/Download PDF"
                                      >
                                        <FileTextIcon size={17} />
                                      </a>
                                    )}
                                    {order.shipmentDetails?.trackingNumber && (
                                      <button
                                        className="p-1 text-green-600 hover:cursor-pointer rounded transition-colors"
                                        title="View Tracking Number"
                                        onClick={() => {
                                          setCurrentTrackingNumber(order.shipmentDetails.trackingNumber);
                                          setTrackingModalOpen(true);
                                        }}
                                      >
                                        <Truck size={17} />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {totalPages > 1 && (
                      <div className="mt-4 text-center text-sm text-slate-600">
                        Showing {(orderPage - 1) * ordersPerPage + 1} to{" "}
                        {Math.min(orderPage * ordersPerPage, clubbing.clubbedOrders.length)} of{" "}
                        {clubbing.clubbedOrders.length} orders
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Tracking Modal */}
      {trackingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/30 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md sm:max-w-lg shadow-lg relative">
            <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-4 text-center sm:text-left">
              Tracking Number
            </h3>
            <div className="flex flex-col sm:flex-row items-center sm:justify-between border border-slate-200 rounded-lg p-3 bg-slate-50 mb-4">
              <span className="font-mono text-lg sm:text-xl text-slate-800 break-all text-center sm:text-left">
                {currentTrackingNumber}
              </span>
              <button
                className="mt-2 sm:mt-0 sm:ml-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
                onClick={() => {
                  navigator.clipboard.writeText(currentTrackingNumber);
                  toast.success("Tracking number copied to clipboard!");
                  setTrackingModalOpen(false);
                }}
              >
                Copy
              </button>
            </div>
            <button
              onClick={() => setTrackingModalOpen(false)}
              className="absolute top-3 right-3 text-slate-500 hover:text-slate-800 text-2xl sm:text-3xl"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {filteredClubbings.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-12">
          <div className="text-center">
            <Users size={48} className="mx-auto text-slate-400 mb-4" />
            <p className="text-slate-600">No clubbings found matching your criteria</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Clubbing;