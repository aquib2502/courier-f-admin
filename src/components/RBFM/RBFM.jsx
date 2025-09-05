'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2, Check, X, Shield, Users, Key, Settings } from 'lucide-react';

const RBFM = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [expandedRole, setExpandedRole] = useState(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Fetch roles with permissions
  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/roles/menu?allRoles=true`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setRoles(res.data.roles || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle permission API
  const handleToggle = async (roleName, tab) => {
    try {
      setUpdating(true);
      await axios.post(
        `http://localhost:5000/api/roles/toggle`,
        { roleName, tab },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchRoles(); // refresh after update
    } catch (error) {
      console.error('Error toggling permission:', error);
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // Get role color based on name
  const getRoleColor = (roleName) => {
    const colors = {
      'Admin': 'from-purple-500 to-purple-600',
      'Manager': 'from-blue-500 to-blue-600',
      'Employee': 'from-green-500 to-green-600',
      'User': 'from-orange-500 to-orange-600',
      'Guest': 'from-gray-500 to-gray-600'
    };
    return colors[roleName] || 'from-indigo-500 to-indigo-600';
  };

  // Get icon for role
  const getRoleIcon = (roleName) => {
    switch(roleName.toLowerCase()) {
      case 'admin': return Shield;
      case 'manager': return Users;
      case 'employee': return Key;
      default: return Settings;
    }
  };

  // Calculate permission stats
  const getPermissionStats = (permissions) => {
    const total = permissions.length;
    const enabled = permissions.filter(p => p.enabled).length;
    const percentage = total > 0 ? Math.round((enabled / total) * 100) : 0;
    return { total, enabled, percentage };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex justify-center items-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center space-y-4">
          <Loader2 className="animate-spin text-indigo-500" size={48} />
          <p className="text-slate-600 text-lg font-medium">Loading roles...</p>
        </div>
      </div>
    );
  }

  const filteredRoles = roles.filter((role) => role.name !== 'SuperAdmin');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-3 bg-white rounded-2xl shadow-lg px-6 py-4 mb-6">
            <Shield className="text-indigo-600" size={32} />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Role Based Access Control
            </h1>
          </div>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Manage permissions and access controls for different user roles in your system
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <Users className="text-indigo-600" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{filteredRoles.length}</p>
                <p className="text-slate-600">Active Roles</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-xl">
                <Check className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {filteredRoles.reduce((sum, role) => sum + role.permissions.filter(p => p.enabled).length, 0)}
                </p>
                <p className="text-slate-600">Active Permissions</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Key className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {filteredRoles.reduce((sum, role) => sum + role.permissions.length, 0)}
                </p>
                <p className="text-slate-600">Total Permissions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Roles Grid */}
        <div className="space-y-6">
          {filteredRoles.map((role, index) => {
            const Icon = getRoleIcon(role.name);
            const stats = getPermissionStats(role.permissions);
            const isExpanded = expandedRole === role._id;
            
            return (
              <div 
                key={role._id} 
                className="bg-white rounded-2xl shadow-lg overflow-hidden transform hover:shadow-xl transition-all duration-500"
                style={{ 
                  animation: `slideInUp 0.6s ease-out ${index * 0.1}s both` 
                }}
              >
                {/* Role Header */}
                <div 
                  className={`bg-gradient-to-r ${getRoleColor(role.name)} p-6 cursor-pointer`}
                  onClick={() => setExpandedRole(isExpanded ? null : role._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        <Icon className="text-white" size={28} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">{role.name}</h3>
                        <p className="text-white/80">
                          {stats.enabled} of {stats.total} permissions active
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {/* Permission Progress Circle */}
                      <div className="relative w-16 h-16">
                        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            stroke="white"
                            strokeOpacity="0.2"
                            strokeWidth="8"
                            fill="transparent"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            stroke="white"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={`${2 * Math.PI * 45}`}
                            strokeDashoffset={`${2 * Math.PI * 45 * (1 - stats.percentage / 100)}`}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{stats.percentage}%</span>
                        </div>
                      </div>
                      
                      <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Permissions List */}
                <div 
                  className={`transition-all duration-500 ease-in-out overflow-hidden ${
                    isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="p-6 space-y-4">
                    <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center space-x-2">
                      <Key size={20} className="text-slate-600" />
                      <span>Permission Controls</span>
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {role.permissions.map((perm, permIndex) => (
                        <div
                          key={perm.tab}
                          className="flex justify-between items-center p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors duration-200"
                          style={{
                            animation: isExpanded ? `fadeInLeft 0.4s ease-out ${permIndex * 0.05}s both` : 'none'
                          }}
                        >
                          <span className="text-slate-700 font-medium">{perm.label}</span>

                          {/* Enhanced Toggle Button */}
                          <button
                            disabled={updating}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggle(role.name, perm.tab);
                            }}
                            className={`relative w-16 h-8 rounded-full transition-all duration-300 flex items-center px-1 transform hover:scale-105 ${
                              perm.enabled 
                                ? 'bg-gradient-to-r from-green-400 to-green-500 shadow-lg shadow-green-200' 
                                : 'bg-gradient-to-r from-slate-300 to-slate-400'
                            } ${updating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <span
                              className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center transform transition-all duration-300 ${
                                perm.enabled ? 'translate-x-8' : 'translate-x-0'
                              }`}
                            >
                              {perm.enabled ? (
                                <Check className="text-green-600" size={14} />
                              ) : (
                                <X className="text-slate-500" size={14} />
                              )}
                            </span>
                            
                            {/* Ripple Effect */}
                            {updating && (
                              <div className="absolute inset-0 rounded-full bg-white/30 animate-ping"></div>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {filteredRoles.length === 0 && (
          <div className="text-center py-16">
            <Shield size={64} className="text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">No Roles Found</h3>
            <p className="text-slate-500">Create some roles to manage permissions</p>
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default RBFM;