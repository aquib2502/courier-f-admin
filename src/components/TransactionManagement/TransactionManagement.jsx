import React, { useState, useEffect } from 'react';
import { Search, Download, FileText, DollarSign, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion } from 'framer-motion';

const TransactionManagement = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [notification, setNotification] = useState(null);
  const [userDropdowns, setUserDropdowns] = useState({});

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, statusFilter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/getAllTransactions`);
      if (response.data.success) {
        setTransactions(response.data.data || []);
      }
    } catch (error) {
      showNotification('Failed to fetch transactions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...(transactions || [])];

    if (searchTerm) {
      filtered = filtered.filter(txn =>
        txn.user?.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(txn => txn.status === statusFilter);
    }

    setFilteredTransactions(filtered);
  };

  const groupByUser = () => {
    const grouped = {};
    filteredTransactions.forEach(txn => {
      const userId = txn.user?._id || 'unknown';
      if (!grouped[userId]) {
        grouped[userId] = {
          user: txn.user,
          transactions: []
        };
      }
      grouped[userId].transactions.push(txn);
    });
    return grouped;
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const calculateBreakdown = (amount, type) => {
    if (type === 'order-booking') {
      const gstRate = 0.18;
      const basePrice = amount / (1 + gstRate);
      const gst = amount - basePrice;
      return { basePrice, gst, total: amount };
    }
    return { basePrice: amount, gst: 0, total: amount };
  };

const exportToPDF = (transactionsToExport, title = "Order Booking Transactions") => {
  try {
    const doc = new jsPDF("p", "pt", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Filter only order-booking transactions
    const orderTransactions = transactionsToExport.filter(
      (txn) => (txn.type || "wallet-topup") === "order-booking"
    );

    if (orderTransactions.length === 0) {
      showNotification("No order booking transactions found.", "error");
      return;
    }

    // Branding Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(33, 37, 41);
    doc.text("The Trace Express", pageWidth / 2, 30, { align: "center" });

    // Subtitle
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(title, pageWidth / 2, 48, { align: "center" });

    doc.setFontSize(9);
    doc.text(
      `Generated on: ${new Date().toLocaleDateString("en-GB")} ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`,
      pageWidth / 2,
      62,
      { align: "center" }
    );

    // --- Totals ---
    let totalBasePrice = 0;
    let totalGST = 0;
    let totalAmount = 0;

    // Table Data
    const tableData = orderTransactions.map((txn) => {
      const breakdown = calculateBreakdown(txn.amount || 0, "order-booking");
      totalBasePrice += breakdown.basePrice;
      totalGST += breakdown.gst;
      totalAmount += breakdown.total;

      return [
        txn.user?.fullname || "N/A",
        txn.user?.mobile || "N/A",
        txn.merchantOrderId || "N/A",
        `Rs. ${breakdown.total.toFixed(2)}`,
        new Date(txn.createdAt).toLocaleDateString("en-GB").replace(/\//g, "/"),
      ];
    });

    // --- PDF Table ---
    autoTable(doc, {
      startY: 80,
      head: [["Name", "Mobile", "Order ID", "Amount", "Date"]],
      body: tableData,
      styles: {
        fontSize: 9,
        cellPadding: 6,
        overflow: "linebreak",
        lineColor: [230, 230, 230],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [25, 118, 210], // Blue header
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      bodyStyles: {
        halign: "center",
        textColor: [33, 37, 41],
      },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      columnStyles: {
        0: { cellWidth: 110 }, // Name
        1: { cellWidth: 90 },  // Mobile
        2: { cellWidth: 100 }, // Order ID
        3: { cellWidth: 80 },  // Amount
        4: { cellWidth: "auto" }, // Date
      },
    });

    // --- Summary Totals Section ---
    const finalY = doc.lastAutoTable.finalY + 25;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Summary", 40, finalY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(33, 37, 41);

    const summaryLines = [
      `Base Price Total: Rs ${totalBasePrice.toFixed(2)} /-`,
      `GST Total: Rs ${totalGST.toFixed(2)} /-`,
      `Grand Total: Rs ${totalAmount.toFixed(2)} /-`,
    ];

    summaryLines.forEach((line, i) => {
      doc.text(line, 60, finalY + 18 + i * 16);
    });

    // Footer with page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth - 60,
        pageHeight - 20
      );
    }

    doc.save(`${title.replace(/\s+/g, "_")}_${Date.now()}.pdf`);
    showNotification("Order Booking PDF exported successfully!", "success");
  } catch (error) {
    console.error(error);
    showNotification("Failed to export PDF", "error");
  }
};

const exportAllToPDF = () => {
  try {
    const doc = new jsPDF("p", "pt", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const grouped = groupByUser();

    // --- PDF Header ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(33, 37, 41);
    doc.text("The Trace Express", pageWidth / 2, 30, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text("All Users Transaction Summary", pageWidth / 2, 48, { align: "center" });

    doc.setFontSize(9);
    doc.text(
      `Generated on: ${new Date().toLocaleDateString("en-GB")} ${new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })}`,
      pageWidth / 2,
      62,
      { align: "center" }
    );

    let currentY = 80;
    let grandBase = 0;
    let grandGST = 0;
    let grandTotal = 0;

    // Loop over each user group
    Object.values(grouped).forEach((group, index) => {
      const { user, transactions } = group;

      if (index > 0) {
        doc.addPage();
        currentY = 40;
      }

      // --- User Header ---
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(`User: ${user.fullname || "N/A"}`, 40, currentY);
      currentY += 18;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Email: ${user.email || "N/A"}`, 40, currentY);
      currentY += 14;
      doc.text(`Mobile: ${user.mobile || "N/A"}`, 40, currentY);
      currentY += 20;

      // Filter only order-booking transactions
      const userTransactions = transactions.filter(
        (txn) => (txn.type || "wallet-topup") === "order-booking"
      );

      if (userTransactions.length === 0) {
        doc.setFontSize(10);
        doc.text("No order booking transactions found.", 40, currentY);
        return;
      }

      let totalBase = 0;
      let totalGST = 0;
      let totalAmt = 0;

      const tableData = userTransactions.map((txn) => {
        const breakdown = calculateBreakdown(txn.amount || 0, "order-booking");
        totalBase += breakdown.basePrice;
        totalGST += breakdown.gst;
        totalAmt += breakdown.total;

        return [
          txn.merchantOrderId || "N/A",
          new Date(txn.createdAt).toLocaleDateString("en-GB"),
          `Rs. ${breakdown.basePrice.toFixed(2)}`,
          `Rs. ${breakdown.gst.toFixed(2)}`,
          `Rs. ${breakdown.total.toFixed(2)}`,
        ];
      });

      // --- Table ---
      autoTable(doc, {
        startY: currentY,
        head: [["Order ID", "Date", "Base Price", "GST", "Total"]],
        body: tableData,
        styles: { fontSize: 9, cellPadding: 6 },
        headStyles: {
          fillColor: [25, 118, 210],
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
        },
        bodyStyles: { halign: "center" },
        alternateRowStyles: { fillColor: [248, 249, 250] },
      });

      const afterTableY = doc.lastAutoTable.finalY + 20;

      // --- User Summary ---
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("User Summary", 40, afterTableY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const lines = [
        `Base Price Total: Rs ${totalBase.toFixed(2)} /-`,
        `GST Total: Rs ${totalGST.toFixed(2)} /-`,
        `Grand Total: Rs ${totalAmt.toFixed(2)} /-`,
      ];
      lines.forEach((line, i) => doc.text(line, 60, afterTableY + 18 + i * 16));

      grandBase += totalBase;
      grandGST += totalGST;
      grandTotal += totalAmt;
    });

    // --- Final Grand Summary Page ---
    doc.addPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Overall Summary (All Users)", 40, 60);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Total Base Price: Rs ${grandBase.toFixed(2)} /-`, 60, 90);
    doc.text(`Total GST: Rs ${grandGST.toFixed(2)} /-`, 60, 110);
    doc.text(`Overall Total: Rs ${grandTotal.toFixed(2)} /-`, 60, 130);

    // Footer Page Numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 60, pageHeight - 20);
    }

    doc.save(`All_Users_Transactions_${Date.now()}.pdf`);
    showNotification("All Users PDF exported successfully!", "success");
  } catch (error) {
    console.error(error);
    showNotification("Failed to export all users PDF", "error");
  }
};



  const getSummary = () => {
    const txnList = transactions || [];
    const total = txnList.length;
    const pending = txnList.filter(t => t.status === 'PENDING').length;
    const completed = txnList.filter(t => t.status === 'COMPLETED').length;
    const refunded = txnList.filter(t => t.status === 'REFUNDED').length;
    const revenue = txnList
      .filter(t => t.status === 'COMPLETED')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    return { total, pending, completed, refunded, revenue };
  };

  const summary = getSummary();

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'PENDING': return 'bg-amber-100 text-amber-700 border border-amber-200';
      case 'REFUNDED': return 'bg-rose-100 text-rose-700 border border-rose-200';
      default: return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading transactions...</p>
        </div>
      </div>
    );
  }

  const groupedTransactions = groupByUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-3 sm:p-4 md:p-6 lg:p-8">
      {notification && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`fixed top-4 right-4 left-4 sm:left-auto sm:right-4 z-50 px-4 sm:px-6 py-3 rounded-xl shadow-2xl ${
            notification.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
          } text-white font-medium`}>
          {notification.message}
        </motion.div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Transaction Management</h1>
          <p className="text-sm sm:text-base text-gray-600">Monitor and manage all transactions</p>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-gray-500 mb-1 font-medium">Total</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{summary.total}</p>
              </div>
              <div className="bg-blue-50 p-2 sm:p-3 rounded-lg">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }} 
            className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-gray-500 mb-1 font-medium">Pending</p>
                <p className="text-xl sm:text-2xl font-bold text-amber-600">{summary.pending}</p>
              </div>
              <div className="bg-amber-50 p-2 sm:p-3 rounded-lg">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2 }} 
            className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-gray-500 mb-1 font-medium">Completed</p>
                <p className="text-xl sm:text-2xl font-bold text-emerald-600">{summary.completed}</p>
              </div>
              <div className="bg-emerald-50 p-2 sm:p-3 rounded-lg">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.3 }} 
            className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-gray-500 mb-1 font-medium">Refunded</p>
                <p className="text-xl sm:text-2xl font-bold text-rose-600">{summary.refunded}</p>
              </div>
              <div className="bg-rose-50 p-2 sm:p-3 rounded-lg">
                <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-rose-600" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.4 }} 
            className="col-span-2 lg:col-span-1 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-blue-100 mb-1 font-medium">Revenue</p>
                <p className="text-xl sm:text-2xl font-bold text-white">₹{summary.revenue.toLocaleString()}</p>
              </div>
              <div className="bg-white/20 p-2 sm:p-3 rounded-lg">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-lg mb-6 p-3 sm:p-4 border border-gray-100"
        >
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="REFUNDED">Refunded</option>
            </select>

             <button
    onClick={exportAllToPDF}
    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all"
  >
    <Download className="w-4 h-4" />
    Export All
  </button>
          </div>
        </motion.div>

        {/* Transactions grouped by user */}
        <div className="space-y-3 sm:space-y-4">
          {Object.values(groupedTransactions).map((userGroup, index) => {
            const userId = userGroup.user._id;
            const isOpen = userDropdowns[userId] || false;

            return (
              <motion.div 
                key={userId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.05 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow"
              >
                <button
                  onClick={() => setUserDropdowns(prev => ({ ...prev, [userId]: !isOpen }))}
                  className="w-full text-left px-4 sm:px-6 py-4 sm:py-5 flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{userGroup.user.fullname}</p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">{userGroup.user.email}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {userGroup.transactions.length} {userGroup.transactions.length === 1 ? 'transaction' : 'transactions'}
                    </p>
                  </div>
                  <div className="ml-4 flex items-center gap-2 sm:gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        exportToPDF(userGroup.transactions, `Transactions_${userGroup.user.fullname}`);
                      }}
                      className="p-2 sm:p-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors shadow-sm"
                    >
                      <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </div>
                </button>

                {isOpen && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-gray-100"
                  >
                    <div className="divide-y divide-gray-100">
                      {userGroup.transactions.map(txn => {
                        const breakdown = calculateBreakdown(txn.amount, txn.type || 'wallet-topup');
                        return (
                          <div key={txn._id} className="px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start sm:items-center gap-2 flex-wrap">
                                  <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{txn.merchantOrderId}</p>
                                  <span className={`px-2 py-1 text-xs font-semibold rounded-lg whitespace-nowrap ${getStatusColor(txn.status)}`}>
                                    {txn.status}
                                  </span>
                                </div>
                                <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs sm:text-sm text-gray-500">
                                  <span className="font-medium">{txn.paymentMethod}</span>
                                  <span className="hidden sm:inline">•</span>
                                  <span>{formatDate(txn.createdAt)}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between sm:justify-end gap-3">
                                {txn.type === 'order-booking' ? (
                                  <div className="text-xs sm:text-sm bg-gray-50 p-2 sm:p-3 rounded-lg border border-gray-200">
                                    <div className="flex justify-between gap-3 sm:gap-4">
                                      <span className="text-gray-600">Base:</span>
                                      <span className="font-semibold text-gray-900">₹{breakdown.basePrice.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between gap-3 sm:gap-4 mt-1">
                                      <span className="text-gray-600">GST:</span>
                                      <span className="font-semibold text-gray-900">₹{breakdown.gst.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between gap-3 sm:gap-4 mt-1 pt-1 border-t border-gray-300">
                                      <span className="text-gray-900 font-semibold">Total:</span>
                                      <span className="font-bold text-blue-600">₹{breakdown.total.toFixed(2)}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="font-bold text-lg sm:text-xl text-blue-600">₹{txn.amount.toFixed(2)}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {filteredTransactions.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl shadow-lg p-8 sm:p-12 text-center border border-gray-100"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
            </div>
            <p className="text-gray-500 text-base sm:text-lg font-medium">No transactions found</p>
            <p className="text-gray-400 text-sm sm:text-base mt-2">Try adjusting your search or filters</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TransactionManagement;