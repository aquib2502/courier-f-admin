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

    // // Mock data
    // setTimeout(() => {
    //   setUsers([
    //     {
    //       id: 1,
    //       name: 'John Doe',
    //       email: 'john@example.com',
    //       kycStatus: 'pending',
    //       role: 'customer',
    //       phone: '+91 9876543210',
    //       joinDate: '2024-01-10',
    //       totalOrders: 25
    //     },
    //     {
    //       id: 2,
    //       name: 'Jane Smith',
    //       email: 'jane@example.com',
    //       kycStatus: 'approved',
    //       role: 'customer',
    //       phone: '+91 9876543211',
    //       joinDate: '2024-01-08',
    //       totalOrders: 42
    //     },
    //     {
    //       id: 3,
    //       name: 'Bob Wilson',
    //       email: 'bob@example.com',
    //       kycStatus: 'rejected',
    //       role: 'customer',
    //       phone: '+91 9876543212',
    //       joinDate: '2024-01-12',
    //       totalOrders: 8
    //     },
    //     {
    //       id: 4,
    //       name: 'Alice Brown',
    //       email: 'alice@example.com',
    //       kycStatus: 'pending',
    //       role: 'customer',
    //       phone: '+91 9876543213',
    //       joinDate: '2024-01-15',
    //       totalOrders: 15
    //     }
    //   ]);
    //   setLoading(false);
    // }, 1000);
  };
  const handleApprove = async (userId) => {
    try {
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/updateKYC/${userId}`, {
        kycStatus: "approved",
      });
      fetchUsers(); // refresh list
    } catch (err) {
      console.error("Approve failed:", err);
    } finally {
      setSelectedUser(null);
    }
  };

  const handleReject = async (userId) => {
    try {
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/updateKYC/${userId}`, {
        kycStatus: "rejected",
      });
      fetchUsers(); // refresh list
    } catch (err) {
      console.error("Reject failed:", err);
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
        fetchUsers(); // refresh user list
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
          <div className="w-32 h-10 bg-slate-200 rounded-xl animate-pulse"></div>
        </div>
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
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <ToastContainer />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
        {/* <button className="bg-slate-800 text-white px-4 py-2 rounded-xl hover:bg-slate-700 transition-colors flex items-center space-x-2">
          <Plus size={16} />
          <span>Add User</span>
        </button> */}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>
          <div className="relative">
            <Filter
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-8 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
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
                  key={user._id} // ✅ use _id here
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
                          second: "2-digit",
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
                          setIsModalOpen(true) // <-- open UserDetailsModal
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

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-slate-400 mb-4" />
            <p className="text-slate-600">
              No users found matching your criteria
            </p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-lg">
          <div className="text-2xl font-bold text-slate-800">
            {users.length}
          </div>
          <div className="text-sm text-slate-600">Total Users</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg">
          <div className="text-2xl font-bold text-green-600">
            {users.filter((u) => u.kycStatus === "approved").length}
          </div>
          <div className="text-sm text-slate-600">Approved KYC</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {users.filter((u) => u.kycStatus === "pending").length}
          </div>
          <div className="text-sm text-slate-600">Pending KYC</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg">
          <div className="text-2xl font-bold text-red-600">
            {users.filter((u) => u.kycStatus === "rejected").length}
          </div>
          <div className="text-sm text-slate-600">Rejected KYC</div>
        </div>
      </div>

      {isModalOpen && selectedUser && (
        <ProofModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          user={selectedUser}
          onApprove={handleApprove} // ✅ use existing function
          onReject={handleReject} // ✅ use existing function
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
