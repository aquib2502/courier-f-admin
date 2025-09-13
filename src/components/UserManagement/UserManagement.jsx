"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Eye,
  Check,
  XCircle,
  Edit,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  Calendar,
  ShoppingBag,
  MoreVertical,
  X
} from "lucide-react";
import axios from "axios";
import ProofModal from "./ProofModal";
import UserDetailsModal from "./UserDetailsModal";
import EditKYCModal from "./EditKycModal";
import { toast, ToastContainer } from "react-toastify";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

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
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    // TODO: Replace with actual API call
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`);
      setUsers(response.data.users);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }

    // Mock data for demonstration
    // setTimeout(() => {
    //   setUsers([
    //     {
    //       _id: '1',
    //       fullname: 'John Doe',
    //       email: 'john@example.com',
    //       kycStatus: 'pending',
    //       role: 'customer',
    //       phone: '+91 9876543210',
    //       createdAt: '2024-01-10T10:30:00Z',
    //       totalOrders: 25
    //     },
    //     // ... more mock data
    //   ]);
    //   setLoading(false);
    // }, 1000);
  };

  const handleApprove = async (userId) => {
    try {
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/updateKYC/${userId}`, {
        kycStatus: "approved",
      });
      fetchUsers();
      toast.success("KYC approved successfully!");
    } catch (err) {
      console.error("Approve failed:", err);
      toast.error("Failed to approve KYC");
    } finally {
      setSelectedUser(null);
    }
  };

  const handleReject = async (userId) => {
    try {
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/updateKYC/${userId}`, {
        kycStatus: "rejected",
      });
      fetchUsers();
      toast.success("KYC rejected successfully!");
    } catch (err) {
      console.error("Reject failed:", err);
      toast.error("Failed to reject KYC");
    } finally {
      setSelectedUser(null);
    }
  };

  const onUpdateKYC = async (userId, newStatus) => {
    try {
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/updateKYC/${userId}`,
        {
          kycStatus: newStatus,
        }
      );

      if (response.status === 200) {
        toast.success("KYC status updated!");
        fetchUsers();
      }
    } catch (err) {
      toast.error("Error updating KYC status");
    }
  };

  const filteredUsers = users.filter((user) => {
    const name = (user.fullname || "").toLowerCase();
    const email = (user.email || "").toLowerCase();
    const status = (user.kycStatus || "").toLowerCase();

    const matchesSearch =
      name.includes(searchTerm.toLowerCase()) ||
      email.includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" || status === filterStatus.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const MobileUserCard = ({ user }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-4 mb-4 border border-slate-100"
    >
      {/* User Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="w-12 h-12 bg-gradient-to-r from-slate-400 to-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
            <Users size={18} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-800 truncate text-base">
              {user.fullname}
            </p>
            <p className="text-sm text-slate-600 capitalize truncate">
              {user.role}
            </p>
          </div>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(
            user.kycStatus
          )}`}
        >
          {user.kycStatus}
        </span>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2 text-sm">
          <Mail size={14} className="text-slate-500 flex-shrink-0" />
          <span className="text-slate-700 truncate">{user.email}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <Phone size={14} className="text-slate-500 flex-shrink-0" />
          <span className="text-slate-700">{user.phone}</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center justify-between mb-4 p-3 bg-slate-50 rounded-lg">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1">
            <ShoppingBag size={14} className="text-slate-500" />
            <span className="font-semibold text-slate-800 text-sm">
              {user.totalOrders || "0"}
            </span>
          </div>
          <p className="text-xs text-slate-600">Orders</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1">
            <Calendar size={14} className="text-slate-500" />
            <span className="font-semibold text-slate-800 text-sm">
              {new Date(user.createdAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
              })}
            </span>
          </div>
          <p className="text-xs text-slate-600">Joined</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {user.kycStatus === "pending" && (
          <>
            <button
              onClick={() => handleApprove(user._id)}
              className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 shadow-sm transition-colors text-sm flex-1 justify-center"
            >
              <Check size={14} />
              <span>Approve</span>
            </button>
            <button
              onClick={() => handleReject(user._id)}
              className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 shadow-sm transition-colors text-sm flex-1 justify-center"
            >
              <XCircle size={14} />
              <span>Reject</span>
            </button>
          </>
        )}
        
        <button
          onClick={() => {
            setSelectedUser(user);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 shadow-sm transition-colors text-sm flex-1 justify-center"
        >
          <Eye size={14} />
          <span>View</span>
        </button>
        
        <button
          onClick={() => {
            setSelectedUser(user);
            setIsEditModalOpen(true);
          }}
          className="flex items-center gap-1.5 bg-slate-600 text-white px-3 py-2 rounded-lg hover:bg-slate-700 shadow-sm transition-colors text-sm flex-1 justify-center"
        >
          <Edit size={14} />
          <span>Edit</span>
        </button>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">User Management</h1>
        </div>
        
        {/* Mobile Loading */}
        {isMobile ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-4 animate-pulse">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  </div>
                  <div className="w-16 h-6 bg-slate-200 rounded-full"></div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-3 bg-slate-200 rounded w-full"></div>
                  <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                </div>
                <div className="flex space-x-2">
                  <div className="flex-1 h-8 bg-slate-200 rounded-lg"></div>
                  <div className="flex-1 h-8 bg-slate-200 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Desktop Loading */
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                    </div>
                    <div className="w-24 h-6 bg-slate-200 rounded"></div>
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
      <ToastContainer />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">User Management</h1>
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
            <X size={18} className="text-slate-600" />
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
          {/* Search */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm sm:text-base"
            />
          </div>
          
          {/* Filter */}
          <div className="relative">
            <Filter
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 appearance-none bg-white text-sm sm:text-base"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Mobile View - Cards */}
      {isMobile ? (
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <MobileUserCard key={user._id} user={user} />
          ))}
        </div>
      ) : (
        /* Desktop View - Table */
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
                    Orders
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
                    Join Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
                    KYC Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredUsers.map((user) => (
                  <motion.tr
                    key={user._id}
                    className="hover:bg-slate-50 transition-colors"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-slate-400 to-slate-600 rounded-full flex items-center justify-center">
                          <Users size={16} className="text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">
                            {user.fullname}
                          </p>
                          <p className="text-sm text-slate-600 capitalize">
                            {user.role}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-slate-800">{user.email}</p>
                        <p className="text-sm text-slate-600">{user.phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-800">
                        {user.totalOrders || "0"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex flex-col">
                        <span>
                          {new Date(user.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span className="text-sm text-slate-500">
                          {new Date(user.createdAt).toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          user.kycStatus
                        )}`}
                      >
                        {user.kycStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        {user.kycStatus === "pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(user._id)}
                              className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 shadow-md transition"
                              title="Approve KYC"
                            >
                              <Check size={16} />
                              <span className="hidden sm:inline">Approve</span>
                            </button>
                            <button
                              onClick={() => handleReject(user._id)}
                              className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 shadow-md transition"
                              title="Reject KYC"
                            >
                              <XCircle size={16} />
                              <span className="hidden sm:inline">Reject</span>
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shadow-sm"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setIsEditModalOpen(true);
                          }}
                          className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors shadow-sm"
                          title="Edit KYC Status"
                        >
                          <Edit size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Results */}
      {filteredUsers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl sm:rounded-2xl shadow-lg">
          <Users size={48} className="mx-auto text-slate-400 mb-4" />
          <p className="text-slate-600">
            No users found matching your criteria
          </p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-lg">
          <div className="text-lg sm:text-2xl font-bold text-slate-800">
            {users.length}
          </div>
          <div className="text-xs sm:text-sm text-slate-600">Total Users</div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-lg">
          <div className="text-lg sm:text-2xl font-bold text-green-600">
            {users.filter((u) => u.kycStatus === "approved").length}
          </div>
          <div className="text-xs sm:text-sm text-slate-600">Approved KYC</div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-lg">
          <div className="text-lg sm:text-2xl font-bold text-yellow-600">
            {users.filter((u) => u.kycStatus === "pending").length}
          </div>
          <div className="text-xs sm:text-sm text-slate-600">Pending KYC</div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-lg">
          <div className="text-lg sm:text-2xl font-bold text-red-600">
            {users.filter((u) => u.kycStatus === "rejected").length}
          </div>
          <div className="text-xs sm:text-sm text-slate-600">Rejected KYC</div>
        </div>
      </div>

      {/* Modals */}
      {isModalOpen && selectedUser && (
        <ProofModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          user={selectedUser}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {isUserDetailsOpen && selectedUser && (
        <UserDetailsModal
          isOpen={isUserDetailsOpen}
          onClose={() => setIsUserDetailsOpen(false)}
          user={selectedUser}
        />
      )}

      {isEditModalOpen && selectedUser && (
        <EditKYCModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={selectedUser}
          onUpdateKYC={onUpdateKYC}
        />
      )}
    </motion.div>
  );
};

export default UserManagement;