import { Routes, Route } from 'react-router-dom';
import { Users, TreePine, ShieldCheck, Trash2, GitMerge } from 'lucide-react';
import { AdminSidebar } from '../components/AdminSidebar';
import { StatCard } from '../components/StatCard';
import { useDashboardStats, useRecentActivity } from '../hooks/useAdmin';
import { formatDistanceToNow } from 'date-fns';
import { lazy, Suspense } from 'react';

const AdminUsersPage = lazy(() => import('./AdminUsersPage'));
const AdminVerificationPage = lazy(() => import('./AdminVerificationPage'));
const AdminTreesPage = lazy(() => import('./AdminTreesPage'));
const AdminDeletionsPage = lazy(() => import('./AdminDeletionsPage'));
const AdminMergesPage = lazy(() => import('./AdminMergesPage'));

function DashboardHome() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: activity, isLoading: activityLoading } = useRecentActivity();

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Admin Dashboard</h1>

      {statsLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-secondary" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Total Users" count={stats?.totalUsers ?? 0} icon={Users} />
          <StatCard label="Total Trees" count={stats?.totalTrees ?? 0} icon={TreePine} />
          <StatCard
            label="Pending Verifications"
            count={stats?.pendingVerifications ?? 0}
            icon={ShieldCheck}
            accent="text-yellow-600"
          />
          <StatCard
            label="Pending Deletions"
            count={stats?.pendingDeletions ?? 0}
            icon={Trash2}
            accent="text-destructive"
          />
          <StatCard
            label="Pending Merges"
            count={stats?.pendingMerges ?? 0}
            icon={GitMerge}
            accent="text-blue-600"
          />
        </div>
      )}

      <h2 className="mb-4 mt-8 text-lg font-semibold">Recent Activity</h2>
      {activityLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-secondary" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {activity?.map((entry) => (
            <div key={entry.id} className="flex items-center gap-3 rounded-md border border-border p-3 text-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-medium">
                {entry.userFirstName?.[0]}{entry.userLastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p>
                  <span className="font-medium">{entry.userFirstName} {entry.userLastName}</span>
                  {' '}{entry.action}d a {entry.entityType}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
          {activity?.length === 0 && (
            <p className="text-sm text-muted-foreground">No recent activity</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex flex-col md:flex-row md:gap-6">
        <div className="w-full md:w-48 flex-shrink-0">
          <AdminSidebar />
        </div>
        <div className="flex-1 min-w-0">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            }
          >
            <Routes>
              <Route index element={<DashboardHome />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="verifications" element={<AdminVerificationPage />} />
              <Route path="trees" element={<AdminTreesPage />} />
              <Route path="deletions" element={<AdminDeletionsPage />} />
              <Route path="merges" element={<AdminMergesPage />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </div>
  );
}
