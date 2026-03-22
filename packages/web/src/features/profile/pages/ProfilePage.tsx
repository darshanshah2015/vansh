import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, User, Lock, Shield } from 'lucide-react';
import { useAuth } from '@/shared/contexts/AuthContext';
import { api, ApiError } from '@/shared/services/api';
import { cn } from '@/lib/utils';

const VERIFICATION_STATUS_LABELS: Record<string, string> = {
  unverified: 'Unverified',
  pending: 'Pending Review',
  verified: 'Verified',
  rejected: 'Rejected',
};

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().max(20).optional().nullable(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'At least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

type Tab = 'details' | 'security' | 'verification';

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('details');

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: 'details', label: 'Details', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'verification', label: 'Verification', icon: Shield },
  ];

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-6">
      <h1 className="mb-6 text-2xl font-semibold">Profile</h1>

      <div className="mb-6 flex gap-1 rounded-lg bg-muted p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'details' && <ProfileDetails user={user} />}
      {activeTab === 'security' && <SecurityTab />}
      {activeTab === 'verification' && <VerificationTab user={user} />}
    </div>
  );
}

function ProfileDetails({ user }: { user: any }) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  });

  const onSubmit = async (data: ProfileForm) => {
    setError(null);
    setMessage(null);
    setIsSubmitting(true);
    try {
      await api.patch('/api/users/profile', data);
      setMessage('Profile updated successfully');
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {message && (
        <div className="rounded-md bg-secondary p-3 text-sm text-primary">{message}</div>
      )}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="mb-1.5 block text-sm font-medium">
            First name
          </label>
          <input
            id="firstName"
            type="text"
            autoComplete="given-name"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...register('firstName')}
          />
          {errors.firstName && (
            <p className="mt-1 text-xs text-destructive">{errors.firstName.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="lastName" className="mb-1.5 block text-sm font-medium">
            Last name
          </label>
          <input
            id="lastName"
            type="text"
            autoComplete="family-name"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...register('lastName')}
          />
          {errors.lastName && (
            <p className="mt-1 text-xs text-destructive">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          spellCheck={false}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          {...register('email')}
        />
        {errors.email && (
          <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="phone" className="mb-1.5 block text-sm font-medium">
          Phone
        </label>
        <input
          id="phone"
          type="tel"
          autoComplete="tel"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          {...register('phone')}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
      </button>
    </form>
  );
}

function SecurityTab() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const onSubmit = async (data: PasswordForm) => {
    setError(null);
    setMessage(null);
    setIsSubmitting(true);
    try {
      await api.post('/api/users/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setMessage('Password changed successfully');
      reset();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : 'Failed to change password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-lg font-medium">Change Password</h2>
      {message && (
        <div className="rounded-md bg-secondary p-3 text-sm text-primary">{message}</div>
      )}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div>
        <label htmlFor="currentPassword" className="mb-1.5 block text-sm font-medium">
          Current password
        </label>
        <input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          {...register('currentPassword')}
        />
        {errors.currentPassword && (
          <p className="mt-1 text-xs text-destructive">{errors.currentPassword.message}</p>
        )}
      </div>
      <div>
        <label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium">
          New password
        </label>
        <input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          {...register('newPassword')}
        />
        {errors.newPassword && (
          <p className="mt-1 text-xs text-destructive">{errors.newPassword.message}</p>
        )}
      </div>
      <div>
        <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Change Password'}
      </button>
    </form>
  );
}

function VerificationTab({ user }: { user: any }) {
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('aadhaar', file);
      await api.upload('/api/users/verification/upload', formData);
      setMessage('Aadhaar photo uploaded. Verification pending.');
    } catch {
      setMessage('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const status = user?.verificationStatus || 'unverified';
  const statusLabel =
    VERIFICATION_STATUS_LABELS[status as keyof typeof VERIFICATION_STATUS_LABELS] || status;

  const statusColors: Record<string, string> = {
    unverified: 'bg-muted text-muted-foreground',
    pending: 'bg-accent/20 text-accent-foreground',
    verified: 'bg-secondary text-primary',
    rejected: 'bg-destructive/10 text-destructive',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Identity Verification</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload your Aadhaar card photo to verify your identity. This allows you to edit family
          trees.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Status:</span>
        <span className={cn('rounded-full px-3 py-1 text-xs font-medium', statusColors[status])}>
          {statusLabel}
        </span>
      </div>

      {message && <div className="rounded-md bg-secondary p-3 text-sm">{message}</div>}

      {status !== 'verified' && (
        <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
          <Shield className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            Upload a clear photo of your Aadhaar card (JPG or PNG, max 5MB)
          </p>
          <label className="mt-4 inline-flex h-11 cursor-pointer items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Choose File'}
            <input
              type="file"
              name="aadhaar-photo"
              accept="image/jpeg,image/png"
              onChange={handleUpload}
              className="hidden"
            />
          </label>
        </div>
      )}
    </div>
  );
}
