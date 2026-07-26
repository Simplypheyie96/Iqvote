import { useState, useEffect } from 'react';
import { Camera, X, Check, KeyRound, Upload, Pencil } from 'lucide-react';
import { api } from '../utils/api';
import { createClient } from '../utils/supabase/client';
import { Employee } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Skeleton } from './ui/skeleton';
import { LoadingSpinner } from './LoadingSpinner';
import {
  Stat,
  VotingHistory,
  type VoteHistoryEntry,
  type ReceivedVotesEntry,
} from './VotingHistory';
import { toast } from 'sonner';

interface ProfilePageProps {
  currentUser: Employee;
  employees: Employee[];
  onProfileUpdated: (updated: Employee) => void;
}

export function ProfilePage({ currentUser, employees, onProfileUpdated }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [role, setRole] = useState(currentUser.role);
  const [imageUrl, setImageUrl] = useState('');
  const [imageError, setImageError] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Sync image from employee record whenever employees list loads or changes
  useEffect(() => {
    if (isEditing) return;
    const emp = employees.find(e => e.email === currentUser.email);
    setImageUrl(emp?.image_url || currentUser.image_url || '');
    setImageError(false);
  }, [employees, currentUser, isEditing]);

  // Change password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  async function handleChangePassword() {
    setChangingPassword(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Profile and password updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  }

  const [myVotes, setMyVotes] = useState<VoteHistoryEntry[]>([]);
  const [receivedVotes, setReceivedVotes] = useState<ReceivedVotesEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const [votesData, receivedData] = await Promise.all([
        api.getMyVotes(),
        api.getMyReceivedVotes(),
      ]);
      setMyVotes(votesData.votes);
      setReceivedVotes(receivedData.votes);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }

  function cancelEdit() {
    setName(currentUser.name);
    setRole(currentUser.role);
    setNewPassword('');
    setConfirmPassword('');
    setImageError(false);
    setIsEditing(false);
  }

  async function handleSave() {
    const trimmedName = name.trim();
    const trimmedRole = role.trim();
    if (!trimmedName) {
      toast.error('Name cannot be empty');
      return;
    }
    if (newPassword && newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      const { user: updated } = await api.updateMyProfile({
        name: trimmedName,
        role: trimmedRole,
        image_url: imageUrl.trim() || undefined,
      });
      onProfileUpdated(updated as Employee);

      if (newPassword) {
        await handleChangePassword();
      } else {
        toast.success('Profile updated');
      }

      setNewPassword('');
      setConfirmPassword('');
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  const totalPointsReceived = receivedVotes.reduce((sum, v) => sum + v.total_points, 0);
  const initials = currentUser.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const avatarSrc = imageUrl && !imageError ? imageUrl : null;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-8">
        <h1 className="font-display text-xl sm:text-2xl font-semibold tracking-tight">Your profile</h1>
        <p className="mt-1.5 text-sm text-muted-foreground text-pretty">
          How the rest of the team sees you, and the recognition that came back to you.
        </p>
      </div>

      {/* The identity card. One surface, not a card wrapping a card. */}
      <div className="mb-8 rounded-2xl border border-border bg-card p-5 shadow-e1 sm:p-6">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:gap-6">
          <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-muted text-muted-foreground inset-ring-1 inset-ring-border sm:h-20 sm:w-20">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt=""
                className="h-full w-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <span className="font-display text-2xl font-semibold">{initials}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="profile-name">Name</Label>
                    <Input
                      id="profile-name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Your name"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="profile-role">Job title</Label>
                    <Input
                      id="profile-role"
                      value={role}
                      onChange={e => setRole(e.target.value)}
                      placeholder="e.g. Software Engineer"
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="profile-image" className="flex items-center gap-1.5">
                    <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                    Photo
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="profile-image"
                      value={imageUrl}
                      onChange={e => { setImageUrl(e.target.value); setImageError(false); }}
                      placeholder="https://example.com/your-photo.jpg"
                      className="h-10"
                    />
                    <input
                      type="file"
                      id="profile-photo-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error('Image must be under 5MB');
                          return;
                        }
                        setUploadingImage(true);
                        try {
                          const supabase = createClient();
                          const ext = file.name.split('.').pop() || 'jpg';
                          const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                          const { error: uploadError } = await supabase.storage
                            .from('make-e2c9f810-images')
                            .upload(filename, file, { contentType: file.type, upsert: false });
                          if (uploadError) throw new Error(uploadError.message);
                          const { data: { publicUrl } } = supabase.storage
                            .from('make-e2c9f810-images')
                            .getPublicUrl(filename);
                          setImageUrl(publicUrl);
                          setImageError(false);
                          toast.success('Photo uploaded');
                        } catch (err: any) {
                          toast.error('Upload failed: ' + err.message);
                        } finally {
                          setUploadingImage(false);
                          e.target.value = '';
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 shrink-0"
                      disabled={uploadingImage}
                      aria-label="Upload a photo"
                      onClick={() => document.getElementById('profile-photo-upload')?.click()}
                    >
                      {uploadingImage ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Upload className="h-4 w-4" aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Paste a link, or upload an image up to 5MB.
                  </p>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="mb-3 flex items-center gap-1.5 text-sm font-medium">
                    <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                    New password
                    <span className="font-normal text-muted-foreground">— optional</span>
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="new-password">Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="Leave blank to keep the current one"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="h-10"
                        aria-describedby="password-hint"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="confirm-password">Confirm password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Type it again"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="h-10"
                      />
                    </div>
                  </div>
                  <p id="password-hint" className="mt-2 text-xs text-muted-foreground">
                    At least 6 characters.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    onClick={handleSave}
                    disabled={saving || changingPassword || uploadingImage}
                    className="h-10 gap-2"
                  >
                    {(saving || changingPassword) ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Check className="h-4 w-4" aria-hidden="true" />
                    )}
                    Save changes
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={cancelEdit}
                    disabled={saving || changingPassword}
                    className="h-10 gap-2"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              // On a phone the Edit button drops under the details rather than
              // fighting the name for the same 200px.
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-semibold tracking-tight sm:text-xl">
                      {currentUser.name}
                    </h2>
                    {currentUser.is_admin && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary-strong">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{currentUser.role}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{currentUser.email}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="h-10 shrink-0 gap-2"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Edit
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {historyLoading ? (
        <div aria-busy="true">
          <span className="sr-only" role="status">Loading your history</span>
          <div className="mb-8 grid grid-cols-1 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-e1 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[0, 1, 2].map(i => (
              <div key={i} className="px-5 py-4 sm:px-6 sm:py-5">
                <Skeleton className="h-7 w-12" />
                <Skeleton className="mt-3 h-3 w-24" />
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {[0, 1, 2].map(i => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Two of the three tiles used to show the same number — votes cast
              and "elections participated" were the same list. */}
          <div className="mb-8 grid grid-cols-1 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-e1 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <Stat label="Elections you voted in" value={myVotes.length} />
            <Stat label="Points people gave you" value={totalPointsReceived} accent />
            <Stat label="Elections you placed in" value={receivedVotes.length} />
          </div>

          <VotingHistory myVotes={myVotes} receivedVotes={receivedVotes} />
        </>
      )}
    </div>
  );
}
