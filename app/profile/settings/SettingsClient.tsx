'use client';

import { useState } from 'react';
import { NotificationSettings } from '@/components/profile/NotificationSettings';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { 
  Bell, 
  User, 
  Shield, 
  Palette, 
  LogOut,
  ChevronRight,
  Settings,
  Download,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface SettingsClientProps {
  user: {
    id: string;
    email: string;
    name?: string;
    avatar_url?: string;
  };
}

type SettingsTab = 'profile' | 'notifications' | 'privacy' | 'appearance' | 'account';

export default function SettingsClient({ user }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('notifications');

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User, description: 'Manage your public profile' },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell, description: 'Email and push preferences' },
    { id: 'privacy' as const, label: 'Privacy', icon: Shield, description: 'Control your data and visibility' },
    { id: 'appearance' as const, label: 'Appearance', icon: Palette, description: 'Customize the look and feel' },
    { id: 'account' as const, label: 'Account', icon: Settings, description: 'Account settings and data' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-white/60 mt-1">Manage your account preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="bg-[#181818] border-white/10 sticky top-24">
            <CardContent className="p-4">
              {/* User Info */}
              <div className="flex items-center gap-3 pb-4 mb-4 border-b border-white/10">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.avatar_url} alt={user.name} />
                  <AvatarFallback className="bg-[#282828] text-white">
                    {user.name?.[0] || user.email[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium text-white truncate">{user.name || 'User'}</p>
                  <p className="text-sm text-white/50 truncate">{user.email}</p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all',
                        activeTab === tab.id
                          ? 'bg-[#1ed760]/10 text-[#1ed760]'
                          : 'text-white/70 hover:text-white hover:bg-white/5'
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Sign Out */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  asChild
                >
                  <Link href="/api/auth/signout">
                    <LogOut className="h-5 w-5 mr-3" />
                    Sign Out
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'privacy' && <PrivacySettings />}
          {activeTab === 'appearance' && <AppearanceSettings />}
          {activeTab === 'account' && <AccountSettings />}
        </div>
      </div>
    </div>
  );
}

function ProfileSettings() {
  return (
    <Card className="bg-[#181818] border-white/10">
      <CardHeader>
        <CardTitle className="text-white">Profile Settings</CardTitle>
        <CardDescription className="text-white/60">
          Update your profile information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="bg-[#1ed760] hover:bg-[#1fdf64] text-black font-bold rounded-full">
          <Link href="/profile/edit">
            Edit Profile
            <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function PrivacySettings() {
  return (
    <div className="space-y-6">
      <Card className="bg-[#181818] border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Profile Visibility</CardTitle>
          <CardDescription className="text-white/60">
            Control who can see your profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingRow
            label="Public Profile"
            description="Allow anyone to view your profile"
            defaultChecked={true}
          />
          <SettingRow
            label="Show Online Status"
            description="Let others see when you're online"
            defaultChecked={true}
          />
          <SettingRow
            label="Show Activity Status"
            description="Display your recent activity on your profile"
            defaultChecked={false}
          />
        </CardContent>
      </Card>

      <Card className="bg-[#181818] border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Blocking</CardTitle>
          <CardDescription className="text-white/60">
            Manage blocked users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-white/50 text-sm">No blocked users</p>
        </CardContent>
      </Card>
    </div>
  );
}

function AppearanceSettings() {
  return (
    <Card className="bg-[#181818] border-white/10">
      <CardHeader>
        <CardTitle className="text-white">Appearance</CardTitle>
        <CardDescription className="text-white/60">
          Customize how Campus Connect looks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SettingRow
          label="Dark Mode"
          description="Use dark theme (default)"
          defaultChecked={true}
        />
        <SettingRow
          label="Reduce Motion"
          description="Minimize animations"
          defaultChecked={false}
        />
        <SettingRow
          label="Compact Mode"
          description="Show more content on screen"
          defaultChecked={false}
        />
      </CardContent>
    </Card>
  );
}

function AccountSettings() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/account/export', { method: 'POST' });
      if (response.ok) {
        alert('Data export requested. You will receive an email when ready.');
      }
    } catch {
      alert('Failed to request data export');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-[#181818] border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Data Export</CardTitle>
          <CardDescription className="text-white/60">
            Download a copy of your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? 'Requesting...' : 'Request Data Export'}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-[#181818] border-red-500/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <CardTitle className="text-red-400">Danger Zone</CardTitle>
              <CardDescription className="text-white/60">
                Irreversible account actions
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Account
          </Button>
          <p className="text-white/40 text-xs mt-2">
            This will permanently delete your account and all associated data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Simple toggle row component
function SettingRow({ 
  label, 
  description, 
  defaultChecked 
}: { 
  label: string; 
  description: string; 
  defaultChecked: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-white font-medium">{label}</p>
        <p className="text-sm text-white/50">{description}</p>
      </div>
      <button
        onClick={() => setChecked(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
          checked ? 'bg-[#1ed760]' : 'bg-white/20'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
}
