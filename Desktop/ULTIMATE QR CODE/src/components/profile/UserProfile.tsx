import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserProfileService, type UserProfile } from '@/lib/userProfile';
import { QRCodeStorage } from '@/lib/qrStorage';
import { DocumentStorage } from '@/lib/documentStorage';
import { User, Mail, QrCode, FileText, Eye, Download, Calendar, ArrowLeft, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UserProfileProps {
  onBack: () => void;
}

export function UserProfile({ onBack }: UserProfileProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalQRCodes: 0,
    totalEmailQRCodes: 0,
    totalDocuments: 0,
    totalScans: 0,
    totalDownloads: 0
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        // Load or create profile
        let userProfile = await UserProfileService.getProfile(user.uid);
        if (!userProfile) {
          userProfile = await UserProfileService.createOrUpdateProfile(
            user.uid,
            user.email || '',
            user.displayName || undefined
          );
        }

        // Load statistics
        const [qrCodes, documents] = await Promise.all([
          QRCodeStorage.getUserQRCodes(user.uid),
          DocumentStorage.getUserDocuments(user.uid).catch(() => [])
        ]);

        const emailQRCodes = qrCodes.filter(code => code.type === 'email');
        const totalScans = qrCodes.reduce((sum, code) => sum + (code.scanCount || 0), 0);
        const totalDownloads = qrCodes.reduce((sum, code) => sum + (code.downloadCount || 0), 0);

        // Update profile stats
        await UserProfileService.updateProfileStats(user.uid, {
          totalQRCodes: qrCodes.length,
          totalEmailQRCodes: emailQRCodes.length,
          totalDocuments: documents.length,
          totalScans,
          totalDownloads
        });

        setProfile(userProfile);
        setStats({
          totalQRCodes: qrCodes.length,
          totalEmailQRCodes: emailQRCodes.length,
          totalDocuments: documents.length,
          totalScans,
          totalDownloads
        });
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-600">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-600">
        <div className="text-white text-xl">Error loading profile</div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={onBack}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all duration-300 backdrop-blur-sm border border-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Profile Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 mb-6 border border-white/20">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                {profile.displayName || 'User Profile'}
              </h1>
              <p className="text-white/80 flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                {profile.email}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white/10 rounded-lg p-4 border border-white/10">
              <p className="text-white/60 text-sm mb-1">Member Since</p>
              <p className="text-white text-lg font-semibold flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {formatDate(profile.createdAt)}
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 border border-white/10">
              <p className="text-white/60 text-sm mb-1">Last Updated</p>
              <p className="text-white text-lg font-semibold flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                {formatDate(profile.updatedAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Total QR Codes */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <QrCode className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-white/60 text-sm mb-1">Total QR Codes</h3>
            <p className="text-3xl font-bold text-white">{stats.totalQRCodes}</p>
          </div>

          {/* Email QR Codes */}
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
            <h3 className="text-white/60 text-sm mb-1">Documents</h3>
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

          {/* Activity Score */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-white/60 text-sm mb-1">Activity Score</h3>
            <p className="text-3xl font-bold text-white">
              {stats.totalScans + stats.totalDownloads + stats.totalQRCodes}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

