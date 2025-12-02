'use client';

import { useEffect, useState, useCallback } from 'react';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Bell, Mail, Smartphone, Moon, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationPreferences {
  email_mentions: boolean;
  email_follows: boolean;
  email_comments: boolean;
  email_events: boolean;
  email_digest: boolean;
  push_enabled: boolean;
  push_mentions: boolean;
  push_messages: boolean;
  push_events: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

const defaultPreferences: NotificationPreferences = {
  email_mentions: true,
  email_follows: true,
  email_comments: true,
  email_events: true,
  email_digest: false,
  push_enabled: true,
  push_mentions: true,
  push_messages: true,
  push_events: true,
  quiet_hours_start: null,
  quiet_hours_end: null,
};

export function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalPreferences, setOriginalPreferences] = useState<NotificationPreferences>(defaultPreferences);

  // Fetch preferences on mount
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await fetch('/api/notifications/preferences');
        if (response.ok) {
          const { data } = await response.json();
          setPreferences(data);
          setOriginalPreferences(data);
        }
      } catch (error) {
        console.error('Failed to fetch notification preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  // Track changes
  useEffect(() => {
    const changed = JSON.stringify(preferences) !== JSON.stringify(originalPreferences);
    setHasChanges(changed);
  }, [preferences, originalPreferences]);

  const updatePreference = useCallback(<K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setSaveSuccess(false);
  }, []);

  const savePreferences = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        setOriginalPreferences(preferences);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-white/40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card className="bg-[#181818] border-white/10">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Mail className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-white">Email Notifications</CardTitle>
              <CardDescription className="text-white/60">
                Choose what emails you receive
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <PreferenceRow
            id="email_mentions"
            label="Mentions"
            description="When someone mentions you in a post or comment"
            checked={preferences.email_mentions}
            onCheckedChange={(checked) => updatePreference('email_mentions', checked)}
          />
          <PreferenceRow
            id="email_follows"
            label="New Followers"
            description="When someone starts following you"
            checked={preferences.email_follows}
            onCheckedChange={(checked) => updatePreference('email_follows', checked)}
          />
          <PreferenceRow
            id="email_comments"
            label="Comments"
            description="When someone comments on your posts"
            checked={preferences.email_comments}
            onCheckedChange={(checked) => updatePreference('email_comments', checked)}
          />
          <PreferenceRow
            id="email_events"
            label="Events"
            description="Event invitations and reminders"
            checked={preferences.email_events}
            onCheckedChange={(checked) => updatePreference('email_events', checked)}
          />
          <PreferenceRow
            id="email_digest"
            label="Weekly Digest"
            description="A weekly summary of activity you might have missed"
            checked={preferences.email_digest}
            onCheckedChange={(checked) => updatePreference('email_digest', checked)}
          />
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card className="bg-[#181818] border-white/10">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Smartphone className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <CardTitle className="text-white">Push Notifications</CardTitle>
              <CardDescription className="text-white/60">
                Real-time notifications on your device
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <PreferenceRow
            id="push_enabled"
            label="Enable Push Notifications"
            description="Receive push notifications on this device"
            checked={preferences.push_enabled}
            onCheckedChange={(checked) => updatePreference('push_enabled', checked)}
          />
          <div className={cn(
            'space-y-4 transition-opacity',
            !preferences.push_enabled && 'opacity-50 pointer-events-none'
          )}>
            <PreferenceRow
              id="push_mentions"
              label="Mentions"
              description="When someone mentions you"
              checked={preferences.push_mentions}
              onCheckedChange={(checked) => updatePreference('push_mentions', checked)}
            />
            <PreferenceRow
              id="push_messages"
              label="Direct Messages"
              description="New messages in spaces"
              checked={preferences.push_messages}
              onCheckedChange={(checked) => updatePreference('push_messages', checked)}
            />
            <PreferenceRow
              id="push_events"
              label="Events"
              description="Event reminders and updates"
              checked={preferences.push_events}
              onCheckedChange={(checked) => updatePreference('push_events', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card className="bg-[#181818] border-white/10">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Moon className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-white">Quiet Hours</CardTitle>
              <CardDescription className="text-white/60">
                Pause notifications during specific hours
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <Label htmlFor="quiet_start" className="text-white/70 whitespace-nowrap">From</Label>
              <input
                type="time"
                id="quiet_start"
                value={preferences.quiet_hours_start || ''}
                onChange={(e) => updatePreference('quiet_hours_start', e.target.value || null)}
                className="bg-[#282828] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#1ed760]/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="quiet_end" className="text-white/70 whitespace-nowrap">To</Label>
              <input
                type="time"
                id="quiet_end"
                value={preferences.quiet_hours_end || ''}
                onChange={(e) => updatePreference('quiet_hours_end', e.target.value || null)}
                className="bg-[#282828] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#1ed760]/50"
              />
            </div>
            {(preferences.quiet_hours_start || preferences.quiet_hours_end) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  updatePreference('quiet_hours_start', null);
                  updatePreference('quiet_hours_end', null);
                }}
                className="text-white/60 hover:text-white"
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4">
        {saveSuccess && (
          <span className="flex items-center gap-2 text-green-400 text-sm">
            <Check className="h-4 w-4" />
            Preferences saved
          </span>
        )}
        <Button
          onClick={savePreferences}
          disabled={!hasChanges || isSaving}
          className={cn(
            'bg-[#1ed760] hover:bg-[#1fdf64] text-black font-bold rounded-full px-8',
            !hasChanges && 'opacity-50'
          )}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Bell className="mr-2 h-4 w-4" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Helper component for preference rows
interface PreferenceRowProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function PreferenceRow({ id, label, description, checked, onCheckedChange }: PreferenceRowProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="space-y-0.5">
        <Label htmlFor={id} className="text-white font-medium cursor-pointer">
          {label}
        </Label>
        <p className="text-sm text-white/50">{description}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="data-[state=checked]:bg-[#1ed760]"
      />
    </div>
  );
}
