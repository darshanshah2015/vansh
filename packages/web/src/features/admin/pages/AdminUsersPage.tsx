import { useState } from 'react';
import { format } from 'date-fns';
import { Search, Shield, KeyRound, UserX, UserCheck } from 'lucide-react';
import {
  useAdminUsers,
  useChangeRole,
  useResetPassword,
  useChangeUserStatus,
} from '../hooks/useAdmin';

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data, isLoading } = useAdminUsers(page, 10, search || undefined);
  const changeRole = useChangeRole();
  const resetPassword = useResetPassword();
  const changeStatus = useChangeUserStatus();
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const handleResetPassword = async (userId: string) => {
    if (!confirm('Reset this user\'s password?')) return;
    const result = await resetPassword.mutateAsync(userId);
    setTempPassword(result.tempPassword);
  };

  const handleToggleStatus = (userId: string, currentlyActive: boolean) => {
    const action = currentlyActive ? 'deactivate' : 'reactivate';
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    changeStatus.mutate({ userId, isActive: !currentlyActive });
  };

  const handleChangeRole = (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Change role to ${newRole}?`)) return;
    changeRole.mutate({ userId, role: newRole as 'user' | 'admin' });
  };

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Users</h1>

      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {tempPassword && (
        <div className="mb-4 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm">
          <p className="font-medium">Temporary Password:</p>
          <p className="mt-1 font-mono text-lg">{tempPassword}</p>
          <button
            onClick={() => setTempPassword(null)}
            className="mt-2 text-xs text-primary hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded bg-secondary" />
          ))}
        </div>
      )}

      {/* Mobile: card layout, Desktop: table */}
      <div className="hidden md:block">
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Name</th>
                <th className="px-4 py-2 text-left font-medium">Email</th>
                <th className="px-4 py-2 text-left font-medium">Role</th>
                <th className="px-4 py-2 text-left font-medium">Verification</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.items?.map((user: any) => (
                <tr key={user.id}>
                  <td className="px-4 py-2">{user.firstName} {user.lastName}</td>
                  <td className="px-4 py-2 text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-secondary text-foreground'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.verificationStatus === 'verified' ? 'bg-green-50 text-green-700' :
                      user.verificationStatus === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-secondary text-muted-foreground'
                    }`}>
                      {user.verificationStatus}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={user.isActive ? 'text-green-600' : 'text-destructive'}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleChangeRole(user.id, user.role)}
                        title="Change role"
                        className="rounded p-1.5 hover:bg-secondary"
                      >
                        <Shield className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleResetPassword(user.id)}
                        title="Reset password"
                        className="rounded p-1.5 hover:bg-secondary"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user.id, user.isActive)}
                        title={user.isActive ? 'Deactivate' : 'Reactivate'}
                        className="rounded p-1.5 hover:bg-secondary"
                      >
                        {user.isActive ? (
                          <UserX className="h-3.5 w-3.5 text-destructive" />
                        ) : (
                          <UserCheck className="h-3.5 w-3.5 text-green-600" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {data?.items?.map((user: any) => (
          <div key={user.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <div className="flex gap-1">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  user.role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-secondary text-foreground'
                }`}>
                  {user.role}
                </span>
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              <button onClick={() => handleChangeRole(user.id, user.role)} className="rounded border border-border px-2 py-1 text-xs hover:bg-secondary">
                Toggle Role
              </button>
              <button onClick={() => handleResetPassword(user.id)} className="rounded border border-border px-2 py-1 text-xs hover:bg-secondary">
                Reset PW
              </button>
              <button
                onClick={() => handleToggleStatus(user.id, user.isActive)}
                className={`rounded border px-2 py-1 text-xs ${user.isActive ? 'border-destructive/20 text-destructive' : 'border-green-200 text-green-600'}`}
              >
                {user.isActive ? 'Deactivate' : 'Reactivate'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-md border border-border px-3 py-1.5 text-xs disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {data.pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
            disabled={page >= data.pagination.totalPages}
            className="rounded-md border border-border px-3 py-1.5 text-xs disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
