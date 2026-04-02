import { useState, useEffect } from 'react';
import {
  Camera, History, Eye, TrendingUp,
  Calendar, ChevronDown, ChevronUp, Trophy, Pencil, X, Check, KeyRound, Upload
} from 'lucide-react';
import { api } from '../utils/api';
import { createClient } from '../utils/supabase/client';
import { Employee } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { LoadingSpinner } from './LoadingSpinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner';

interface ProfilePageProps {
  currentUser: Employee;
  employees: Employee[];
  onProfileUpdated: (updated: Employee) => void;
}

interface VoteHistory {
  election: { id: string; title: string; end_time: string };
  ballot: { created_at: string; revoked: boolean; revoke_reason?: string };
  selections: { rank: number; employee: Employee; points: number }[];
}

interface ReceivedVotes {
  election: { id: string; title: string; end_time: string };
  total_points: number;
  rank: number;
  total_participants: number;
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

  const [myVotes, setMyVotes] = useState<VoteHistory[]>([]);
  const [receivedVotes, setReceivedVotes] = useState<ReceivedVotes[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [expandedVotes, setExpandedVotes] = useState<Set<string>>(new Set());
  const [expandedReceived, setExpandedReceived] = useState<Set<string>>(new Set());

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

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  }

  function getRankBadge(rank: number) {
    const configs: Record<number, { label: string; color: string }> = {
      1: { label: '1st Place', color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30' },
      2: { label: '2nd Place', color: 'text-gray-400 bg-gray-400/10 border-gray-400/30' },
      3: { label: '3rd Place', color: 'text-amber-600 bg-amber-600/10 border-amber-600/30' },
    };
    const cfg = configs[rank] || { label: `${rank}th Place`, color: 'text-muted-foreground bg-muted/50 border-border' };
    return (
      <Badge variant="outline" className={`gap-1.5 ${cfg.color}`}>
        <Trophy className="w-3 h-3" />
        {cfg.label}
      </Badge>
    );
  }

  function toggleVote(id: string) {
    setExpandedVotes(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  function toggleReceived(id: string) {
    setExpandedReceived(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
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
      {/* Page header */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent mb-1">
          My Profile
        </h2>
        <p className="text-sm text-muted-foreground">
          Manage your profile and view your voting history
        </p>
      </div>

      {/* Profile card */}
      <Card className="mb-8 border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/20 flex items-center justify-center overflow-hidden">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <span className="text-2xl font-bold text-primary">{initials}</span>
                )}
              </div>
            </div>

            {/* Info / Edit form */}
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="profile-name" className="text-xs text-muted-foreground">Name</Label>
                      <Input
                        id="profile-name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Your name"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="profile-role" className="text-xs text-muted-foreground">Job Title / Role</Label>
                      <Input
                        id="profile-role"
                        value={role}
                        onChange={e => setRole(e.target.value)}
                        placeholder="e.g. Software Engineer"
                        className="h-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="profile-image" className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Camera className="w-3 h-3" />
                      Profile Photo (optional)
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="profile-image"
                        value={imageUrl}
                        onChange={e => { setImageUrl(e.target.value); setImageError(false); }}
                        placeholder="https://example.com/your-photo.jpg"
                        className="h-9"
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
                            toast.success('Photo uploaded!');
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
                        className="h-9 w-9 flex-shrink-0"
                        disabled={uploadingImage}
                        onClick={() => document.getElementById('profile-photo-upload')?.click()}
                      >
                        {uploadingImage ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Paste a URL or click upload to choose a photo (max 5MB)</p>
                  </div>
                  {/* Change Password */}
                  <div className="border-t border-border pt-3 mt-1">
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                      <KeyRound className="w-3 h-3" />
                      Change Password (optional)
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="new-password" className="text-xs text-muted-foreground">New Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          placeholder="Leave blank to keep current"
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="confirm-password" className="text-xs text-muted-foreground">Confirm New Password</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          className="h-9"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Must be at least 6 characters</p>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={handleSave} disabled={saving || changingPassword || uploadingImage} className="gap-1.5">
                      {(saving || changingPassword) ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={saving || changingPassword} className="gap-1.5">
                      <X className="w-3.5 h-3.5" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold leading-tight">{currentUser.name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{currentUser.role}</p>
                    <p className="text-xs text-muted-foreground mt-1">{currentUser.email}</p>
                    {currentUser.is_admin && (
                      <Badge className="mt-2 text-xs" variant="secondary">Admin</Badge>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="gap-1.5 flex-shrink-0"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit Profile
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">Total Votes Cast</CardDescription>
            <CardTitle className="text-3xl">{myVotes.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">Total Points Received</CardDescription>
            <CardTitle className="text-3xl text-primary">{totalPointsReceived}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">Elections Participated</CardDescription>
            <CardTitle className="text-3xl">{receivedVotes.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Voting history */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          Voting History
        </h3>
      </div>

      {historyLoading ? (
        <div className="text-center py-12">
          <LoadingSpinner size="lg" text="Loading history" />
        </div>
      ) : (
        <Tabs defaultValue="my-votes" className="w-full">
          <TabsList>
            <TabsTrigger value="my-votes" className="gap-2">
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">My Votes</span>
              <span className="sm:hidden">Votes</span>
            </TabsTrigger>
            <TabsTrigger value="received" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Votes Received</span>
              <span className="sm:hidden">Received</span>
            </TabsTrigger>
          </TabsList>

          {/* My Votes */}
          <TabsContent value="my-votes" className="space-y-4 mt-6">
            {myVotes.length === 0 ? (
              <Card className="border-border">
                <CardContent className="pt-12 pb-12 text-center">
                  <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">You haven't cast any votes yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {myVotes.map((vote) => {
                  const expanded = expandedVotes.has(vote.election.id);
                  return (
                    <Card key={vote.election.id} className="overflow-hidden border-border">
                      <div
                        className="p-4 cursor-pointer hover:bg-muted/30 transition-colors border-b border-border"
                        onClick={() => toggleVote(vote.election.id)}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-sm sm:text-base truncate">{vote.election.title}</h4>
                              <Badge variant={vote.ballot.revoked ? 'destructive' : 'outline'} className="text-xs">
                                {vote.ballot.revoked ? 'Revoked' : 'Counted'}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                              <Calendar className="w-3 h-3" />
                              Voted on {formatDate(vote.ballot.created_at)}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" className="flex-shrink-0">
                            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                      {expanded && (
                        <CardContent className="pt-4 pb-4">
                          <div className="grid sm:grid-cols-3 gap-4">
                            {vote.selections
                              .sort((a, b) => a.rank - b.rank)
                              .map((sel) => (
                                <div
                                  key={sel.rank}
                                  className={`p-4 rounded-xl border ${
                                    sel.rank === 1
                                      ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20'
                                      : sel.rank === 2
                                      ? 'bg-gradient-to-br from-primary/8 to-primary/3 border-primary/15'
                                      : 'bg-muted/30 border-border'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold text-xs flex-shrink-0">
                                      {sel.rank}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      {sel.rank === 1 ? '1st Choice' : sel.rank === 2 ? '2nd Choice' : '3rd Choice'}
                                    </p>
                                  </div>
                                  <p className="font-bold text-lg mb-0.5 truncate">{sel.employee.name}</p>
                                  <p className="text-xs text-muted-foreground mb-2 truncate">{sel.employee.role}</p>
                                  <Badge
                                    className={sel.rank === 1 ? 'bg-gradient-to-r from-primary to-primary/70' : sel.rank === 2 ? 'bg-primary/60' : ''}
                                    variant={sel.rank === 3 ? 'outline' : undefined}
                                  >
                                    {sel.points} pts
                                  </Badge>
                                </div>
                              ))}
                          </div>
                          {vote.ballot.revoked && (
                            <Alert variant="destructive" className="mt-4">
                              <AlertDescription className="text-xs">
                                This vote was revoked: {vote.ballot.revoke_reason || 'No reason provided'}
                              </AlertDescription>
                            </Alert>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Votes Received */}
          <TabsContent value="received" className="space-y-4 mt-6">
            {receivedVotes.length === 0 ? (
              <Card className="border-border">
                <CardContent className="pt-12 pb-12 text-center">
                  <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">You haven't received any votes yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {receivedVotes.map((vote) => {
                  const expanded = expandedReceived.has(vote.election.id);
                  return (
                    <Card key={vote.election.id} className="overflow-hidden border-border">
                      <div
                        className="p-4 cursor-pointer hover:bg-muted/30 transition-colors border-b border-border"
                        onClick={() => toggleReceived(vote.election.id)}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-sm sm:text-base truncate">{vote.election.title}</h4>
                              {getRankBadge(vote.rank)}
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                              <Calendar className="w-3 h-3" />
                              Ended {formatDate(vote.election.end_time)}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" className="flex-shrink-0">
                            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                      {expanded && (
                        <CardContent className="pt-4 pb-4">
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                              <p className="text-xs text-muted-foreground mb-1">Points Received</p>
                              <p className="text-3xl font-bold text-primary">{vote.total_points}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-muted/30 border border-border">
                              <p className="text-xs text-muted-foreground mb-1">Total Voters</p>
                              <p className="text-3xl font-bold">{vote.total_participants}</p>
                            </div>
                          </div>
                          <Alert className="mt-4 border-blue-500/50 bg-blue-500/10">
                            <AlertDescription className="text-xs text-blue-600 dark:text-blue-400">
                              Votes are anonymous. We don't share who voted for whom to maintain fairness and prevent bias.
                            </AlertDescription>
                          </Alert>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
