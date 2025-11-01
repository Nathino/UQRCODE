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
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 py-4 px-2 md:py-8 md:px-4 lg:px-8">
      <div className="w-full mx-auto px-2 md:px-4 lg:px-8 xl:px-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 md:mb-8">
          <Button
            onClick={onBack}
            className="bg-gradient-to-br from-white/[0.15] via-white/[0.12] to-white/[0.08] hover:from-white/[0.22] hover:via-white/[0.18] hover:to-white/[0.14] text-white px-3 py-1.5 md:px-4 md:py-2 rounded-xl transition-all duration-300 backdrop-blur-md border border-white/30 hover:border-white/40 shadow-[0_4px_16px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)] relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            <ArrowLeft className="w-4 h-4 mr-2 relative z-10 drop-shadow-md" />
            <span className="relative z-10 drop-shadow-sm">Back</span>
          </Button>
        </div>

        {/* Desktop Layout: Side-by-side arrangement */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-8">
          {/* Left Column: Profile Card (Desktop takes 1 column) */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-white/[0.12] via-white/[0.08] to-white/[0.06] backdrop-blur-2xl rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.18)] p-4 md:p-6 lg:p-8 border border-white/30 hover:border-white/40 hover:shadow-[0_16px_64px_0_rgba(0,0,0,0.25)] transition-all duration-500 ease-out relative overflow-hidden group">
              {/* Enhanced glassmorphism layers */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-blue-500/[0.05] pointer-events-none"></div>
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/[0.15] to-transparent opacity-30 pointer-events-none"></div>
              {/* Subtle inner glow */}
              <div className="absolute inset-[1px] bg-gradient-to-br from-transparent via-white/[0.03] to-transparent rounded-3xl pointer-events-none"></div>
              
              {/* Profile Header */}
              <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-4 mb-6 relative z-10">
                <div className="relative w-24 h-24 md:w-28 md:h-28 group-hover:scale-105 transition-transform duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.25] to-white/[0.15] rounded-3xl blur-sm opacity-60"></div>
                  <div className="relative w-full h-full bg-gradient-to-br from-white/[0.22] via-white/[0.18] to-white/[0.12] rounded-3xl flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.3)] border border-white/40 backdrop-blur-md">
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/[0.1] to-transparent rounded-3xl"></div>
                    <User className="w-12 h-12 md:w-14 md:h-14 text-white relative z-10 drop-shadow-lg" />
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight drop-shadow-lg">
                    {profile.displayName || 'User Profile'}
                  </h1>
                  <p className="text-white/80 flex items-center justify-center md:justify-start text-sm md:text-base font-medium drop-shadow-md">
                    <Mail className="w-4 h-4 mr-2 drop-shadow-md" />
                    {profile.email}
                  </p>
                </div>
              </div>

              {/* Enhanced Divider */}
              <div className="relative mb-6 z-10">
                <div className="h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                <div className="absolute inset-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent blur-sm"></div>
              </div>

              {/* Profile Details */}
              <div className="space-y-4 relative z-10">
                <div className="relative bg-gradient-to-br from-white/[0.1] via-white/[0.08] to-white/[0.06] rounded-2xl p-4 border border-white/20 hover:border-white/30 hover:bg-gradient-to-br hover:from-white/[0.15] hover:via-white/[0.12] hover:to-white/[0.08] hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)] transition-all duration-300 cursor-pointer group/item overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300"></div>
                  <div className="flex items-center space-x-3 relative z-10">
                    <div className="relative">
                      <div className="absolute inset-0 bg-white/20 rounded-xl blur-md group-hover/item:bg-white/30 transition-colors duration-300"></div>
                      <div className="relative w-10 h-10 bg-gradient-to-br from-white/[0.25] to-white/[0.15] rounded-xl flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.3)] border border-white/30 group-hover/item:scale-110 group-hover/item:shadow-[0_6px_16px_rgba(0,0,0,0.2)] transition-all duration-300">
                        <Calendar className="w-5 h-5 text-white drop-shadow-md" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/60 text-xs md:text-sm mb-1 font-medium uppercase tracking-wide">Member Since</p>
                      <p className="text-white font-semibold text-sm md:text-base truncate drop-shadow-sm">
                        {formatDate(profile.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="relative bg-gradient-to-br from-white/[0.1] via-white/[0.08] to-white/[0.06] rounded-2xl p-4 border border-white/20 hover:border-white/30 hover:bg-gradient-to-br hover:from-white/[0.15] hover:via-white/[0.12] hover:to-white/[0.08] hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)] transition-all duration-300 cursor-pointer group/item overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300"></div>
                  <div className="flex items-center space-x-3 relative z-10">
                    <div className="relative">
                      <div className="absolute inset-0 bg-white/20 rounded-xl blur-md group-hover/item:bg-white/30 transition-colors duration-300"></div>
                      <div className="relative w-10 h-10 bg-gradient-to-br from-white/[0.25] to-white/[0.15] rounded-xl flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.3)] border border-white/30 group-hover/item:scale-110 group-hover/item:shadow-[0_6px_16px_rgba(0,0,0,0.2)] transition-all duration-300">
                        <TrendingUp className="w-5 h-5 text-white drop-shadow-md" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/60 text-xs md:text-sm mb-1 font-medium uppercase tracking-wide">Last Updated</p>
                      <p className="text-white font-semibold text-sm md:text-base truncate drop-shadow-sm">
                        {formatDate(profile.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Statistics Grid (Desktop takes 2 columns) */}
          <div className="lg:col-span-2">
            <div className="mb-4 md:mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-1">Statistics Overview</h2>
              <p className="text-white/60 text-sm">Track your QR code activity and engagement</p>
            </div>
            
            {/* Statistics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-5">
              {/* Total QR Codes */}
              <div className="bg-gradient-to-br from-white/[0.12] via-white/[0.09] to-white/[0.06] backdrop-blur-2xl rounded-3xl shadow-[0_6px_24px_0_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.1)] p-4 md:p-5 border border-white/30 hover:border-white/40 hover:shadow-[0_12px_40px_0_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.2)] hover:bg-gradient-to-br hover:from-white/[0.18] hover:via-white/[0.14] hover:to-white/[0.10] transition-all duration-500 ease-out group relative overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.1] via-transparent to-blue-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/[0.15] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <div className="absolute inset-[1px] bg-gradient-to-br from-transparent via-white/[0.03] to-transparent rounded-3xl pointer-events-none"></div>
                <div className="flex flex-col h-full relative z-10">
                  <div className="relative w-12 h-12 mb-3">
                    <div className="absolute inset-0 bg-white/25 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative w-full h-full bg-gradient-to-br from-white/[0.28] via-white/[0.22] to-white/[0.16] rounded-2xl flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.35)] border border-white/35 group-hover:scale-110 group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.4)] group-hover:border-white/45 transition-all duration-500">
                      <QrCode className="w-6 h-6 md:w-7 md:h-7 text-white drop-shadow-lg relative z-10" />
                    </div>
                  </div>
                  <h3 className="text-white/70 text-xs md:text-sm mb-2 font-medium uppercase tracking-wider drop-shadow-sm">Total QR Codes</h3>
                  <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mt-auto drop-shadow-lg">{stats.totalQRCodes}</p>
                </div>
              </div>

              {/* Email QR Codes */}
              <div className="bg-gradient-to-br from-white/[0.12] via-white/[0.09] to-white/[0.06] backdrop-blur-2xl rounded-3xl shadow-[0_6px_24px_0_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.1)] p-4 md:p-5 border border-white/30 hover:border-white/40 hover:shadow-[0_12px_40px_0_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.2)] hover:bg-gradient-to-br hover:from-white/[0.18] hover:via-white/[0.14] hover:to-white/[0.10] transition-all duration-500 ease-out group relative overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.1] via-transparent to-blue-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/[0.15] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <div className="absolute inset-[1px] bg-gradient-to-br from-transparent via-white/[0.03] to-transparent rounded-3xl pointer-events-none"></div>
                <div className="flex flex-col h-full relative z-10">
                  <div className="relative w-12 h-12 mb-3">
                    <div className="absolute inset-0 bg-white/25 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative w-full h-full bg-gradient-to-br from-white/[0.28] via-white/[0.22] to-white/[0.16] rounded-2xl flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.35)] border border-white/35 group-hover:scale-110 group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.4)] group-hover:border-white/45 transition-all duration-500">
                      <Mail className="w-6 h-6 md:w-7 md:h-7 text-white drop-shadow-lg relative z-10" />
                    </div>
                  </div>
                  <h3 className="text-white/70 text-xs md:text-sm mb-2 font-medium uppercase tracking-wider drop-shadow-sm">Email QR Codes</h3>
                  <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mt-auto drop-shadow-lg">{stats.totalEmailQRCodes}</p>
                </div>
              </div>

              {/* Total Documents */}
              <div className="bg-gradient-to-br from-white/[0.12] via-white/[0.09] to-white/[0.06] backdrop-blur-2xl rounded-3xl shadow-[0_6px_24px_0_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.1)] p-4 md:p-5 border border-white/30 hover:border-white/40 hover:shadow-[0_12px_40px_0_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.2)] hover:bg-gradient-to-br hover:from-white/[0.18] hover:via-white/[0.14] hover:to-white/[0.10] transition-all duration-500 ease-out group relative overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.1] via-transparent to-blue-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/[0.15] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <div className="absolute inset-[1px] bg-gradient-to-br from-transparent via-white/[0.03] to-transparent rounded-3xl pointer-events-none"></div>
                <div className="flex flex-col h-full relative z-10">
                  <div className="relative w-12 h-12 mb-3">
                    <div className="absolute inset-0 bg-white/25 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative w-full h-full bg-gradient-to-br from-white/[0.28] via-white/[0.22] to-white/[0.16] rounded-2xl flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.35)] border border-white/35 group-hover:scale-110 group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.4)] group-hover:border-white/45 transition-all duration-500">
                      <FileText className="w-6 h-6 md:w-7 md:h-7 text-white drop-shadow-lg relative z-10" />
                    </div>
                  </div>
                  <h3 className="text-white/70 text-xs md:text-sm mb-2 font-medium uppercase tracking-wider drop-shadow-sm">Documents</h3>
                  <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mt-auto drop-shadow-lg">{stats.totalDocuments}</p>
                </div>
              </div>

              {/* Total Scans */}
              <div className="bg-gradient-to-br from-white/[0.12] via-white/[0.09] to-white/[0.06] backdrop-blur-2xl rounded-3xl shadow-[0_6px_24px_0_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.1)] p-4 md:p-5 border border-white/30 hover:border-white/40 hover:shadow-[0_12px_40px_0_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.2)] hover:bg-gradient-to-br hover:from-white/[0.18] hover:via-white/[0.14] hover:to-white/[0.10] transition-all duration-500 ease-out group relative overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.1] via-transparent to-blue-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/[0.15] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <div className="absolute inset-[1px] bg-gradient-to-br from-transparent via-white/[0.03] to-transparent rounded-3xl pointer-events-none"></div>
                <div className="flex flex-col h-full relative z-10">
                  <div className="relative w-12 h-12 mb-3">
                    <div className="absolute inset-0 bg-white/25 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative w-full h-full bg-gradient-to-br from-white/[0.28] via-white/[0.22] to-white/[0.16] rounded-2xl flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.35)] border border-white/35 group-hover:scale-110 group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.4)] group-hover:border-white/45 transition-all duration-500">
                      <Eye className="w-6 h-6 md:w-7 md:h-7 text-white drop-shadow-lg relative z-10" />
                    </div>
                  </div>
                  <h3 className="text-white/70 text-xs md:text-sm mb-2 font-medium uppercase tracking-wider drop-shadow-sm">Total Scans</h3>
                  <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mt-auto drop-shadow-lg">{stats.totalScans}</p>
                </div>
              </div>

              {/* Total Downloads */}
              <div className="bg-gradient-to-br from-white/[0.12] via-white/[0.09] to-white/[0.06] backdrop-blur-2xl rounded-3xl shadow-[0_6px_24px_0_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.1)] p-4 md:p-5 border border-white/30 hover:border-white/40 hover:shadow-[0_12px_40px_0_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.2)] hover:bg-gradient-to-br hover:from-white/[0.18] hover:via-white/[0.14] hover:to-white/[0.10] transition-all duration-500 ease-out group relative overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.1] via-transparent to-blue-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/[0.15] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <div className="absolute inset-[1px] bg-gradient-to-br from-transparent via-white/[0.03] to-transparent rounded-3xl pointer-events-none"></div>
                <div className="flex flex-col h-full relative z-10">
                  <div className="relative w-12 h-12 mb-3">
                    <div className="absolute inset-0 bg-white/25 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative w-full h-full bg-gradient-to-br from-white/[0.28] via-white/[0.22] to-white/[0.16] rounded-2xl flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.35)] border border-white/35 group-hover:scale-110 group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.4)] group-hover:border-white/45 transition-all duration-500">
                      <Download className="w-6 h-6 md:w-7 md:h-7 text-white drop-shadow-lg relative z-10" />
                    </div>
                  </div>
                  <h3 className="text-white/70 text-xs md:text-sm mb-2 font-medium uppercase tracking-wider drop-shadow-sm">Total Downloads</h3>
                  <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mt-auto drop-shadow-lg">{stats.totalDownloads}</p>
                </div>
              </div>

              {/* Activity Score - Featured Card */}
              <div className="bg-gradient-to-br from-white/[0.18] via-white/[0.14] to-white/[0.10] backdrop-blur-2xl rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.15)] p-4 md:p-5 border-2 border-white/40 hover:border-white/50 hover:shadow-[0_16px_48px_0_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.25)] hover:bg-gradient-to-br hover:from-white/[0.24] hover:via-white/[0.18] hover:to-white/[0.14] transition-all duration-500 ease-out group relative overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.15] via-blue-500/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/[0.25] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <div className="absolute inset-[2px] bg-gradient-to-br from-transparent via-white/[0.05] to-transparent rounded-3xl pointer-events-none"></div>
                <div className="flex flex-col h-full relative z-10">
                  <div className="relative w-12 h-12 mb-3">
                    <div className="absolute inset-0 bg-white/35 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative w-full h-full bg-gradient-to-br from-white/[0.35] via-white/[0.28] to-white/[0.20] rounded-2xl flex items-center justify-center shadow-[0_6px_20px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.4)] border-2 border-white/45 group-hover:scale-110 group-hover:shadow-[0_10px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.5)] group-hover:border-white/55 transition-all duration-500">
                      <TrendingUp className="w-6 h-6 md:w-7 md:h-7 text-white drop-shadow-xl relative z-10" />
                    </div>
                  </div>
                  <h3 className="text-white/85 text-xs md:text-sm mb-2 font-semibold uppercase tracking-wider drop-shadow-md">Activity Score</h3>
                  <p className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mt-auto drop-shadow-xl">
                    {stats.totalScans + stats.totalDownloads + stats.totalQRCodes}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

