import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AdminService, AdminStats, AdminUser } from '@/lib/adminService';
import { isAdmin } from '@/lib/adminUtils';
import { Users, QrCode, Mail, FileText, Eye, Download, ArrowLeft, TrendingUp, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminDashboardProps {
  onBack: () => void;
}

export function AdminDashboard({ onBack }: AdminDashboardProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'stats' | 'users'>('stats');

  useEffect(() => {
    const loadAdminData = async () => {
      if (!user || !isAdmin(user.email)) return;

      try {
        setLoading(true);
        const [adminStats, allUsers] = await Promise.all([
          AdminService.getAdminStats(),
          AdminService.getAllUsers()
        ]);
        setStats(adminStats);
        setUsers(allUsers);
      } catch (error) {
        console.error('Error loading admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, [user]);

  if (!user || !isAdmin(user.email)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-600">
        <div className="text-white text-xl">Access Denied. Admin access required.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-600">
        <div className="text-white text-xl">Loading admin dashboard...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-600">
        <div className="text-white text-xl">Error loading admin data</div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-white" />
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          </div>
          <Button
            onClick={onBack}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all duration-300 backdrop-blur-sm border border-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {/* View Toggle */}
        <div className="flex space-x-4 mb-6">
          <Button
            onClick={() => setSelectedView('stats')}
            className={`px-6 py-2 rounded-lg transition-all duration-300 ${
              selectedView === 'stats'
                ? 'bg-white text-blue-600'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            Statistics
          </Button>
          <Button
            onClick={() => setSelectedView('users')}
            className={`px-6 py-2 rounded-lg transition-all duration-300 ${
              selectedView === 'users'
                ? 'bg-white text-blue-600'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            All Users ({users.length})
          </Button>
        </div>

        {/* Statistics View */}
        {selectedView === 'stats' && (
          <div>
            {/* Main Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {/* Total Users */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-white/60 text-sm mb-1">Total Users</h3>
                <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
              </div>

              {/* Total QR Codes */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <QrCode className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-white/60 text-sm mb-1">Total QR Codes</h3>
                <p className="text-3xl font-bold text-white">{stats.totalQRCodes}</p>
              </div>

              {/* Total Email QR Codes */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-white/60 text-sm mb-1">Email QR Codes</h3>
                <p className="text-3xl font-bold text-white">{stats.totalEmailQRCodes}</p>
              </div>

              {/* Total Documents */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-white/60 text-sm mb-1">Total Documents</h3>
                <p className="text-3xl font-bold text-white">{stats.totalDocuments}</p>
              </div>

              {/* Total Scans */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <Eye className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-white/60 text-sm mb-1">Total Scans</h3>
                <p className="text-3xl font-bold text-white">{stats.totalScans}</p>
              </div>

              {/* Total Downloads */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <Download className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-white/60 text-sm mb-1">Total Downloads</h3>
                <p className="text-3xl font-bold text-white">{stats.totalDownloads}</p>
              </div>
            </div>

            {/* QR Codes by Type */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl p-6 border border-white/20 mb-6">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <TrendingUp className="w-6 h-6 mr-2" />
                QR Codes by Type
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {Object.entries(stats.qrCodesByType).map(([type, count]) => (
                  <div key={type} className="bg-white/10 rounded-lg p-4 border border-white/10">
                    <p className="text-white/60 text-sm mb-1 capitalize">{type}</p>
                    <p className="text-2xl font-bold text-white">{count}</p>
                  </div>
                ))}
                {Object.keys(stats.qrCodesByType).length === 0 && (
                  <p className="text-white/60">No QR codes generated yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Users View */}
        {selectedView === 'users' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <Users className="w-6 h-6 mr-2" />
              All Users ({users.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-white/80 font-semibold py-3 px-4">Email</th>
                    <th className="text-white/80 font-semibold py-3 px-4">QR Codes</th>
                    <th className="text-white/80 font-semibold py-3 px-4">Email QRs</th>
                    <th className="text-white/80 font-semibold py-3 px-4">Documents</th>
                    <th className="text-white/80 font-semibold py-3 px-4">Scans</th>
                    <th className="text-white/80 font-semibold py-3 px-4">Downloads</th>
                    <th className="text-white/80 font-semibold py-3 px-4">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.uid} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                      <td className="text-white py-3 px-4">{user.email}</td>
                      <td className="text-white py-3 px-4">{user.totalQRCodes || 0}</td>
                      <td className="text-white py-3 px-4">{user.totalEmailQRCodes || 0}</td>
                      <td className="text-white py-3 px-4">{user.totalDocuments || 0}</td>
                      <td className="text-white py-3 px-4">{user.totalScans || 0}</td>
                      <td className="text-white py-3 px-4">{user.totalDownloads || 0}</td>
                      <td className="text-white/80 py-3 px-4 text-sm">
                        {formatDate(user.createdAt)}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-white/60 text-center py-8">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

