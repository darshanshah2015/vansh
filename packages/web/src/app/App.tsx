import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from '@/shared/contexts/AuthContext';
import { ProtectedRoute } from '@/shared/components/ProtectedRoute';
import { Layout } from '@/shared/components/Layout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 10 * 1000, retry: 1 },
  },
});

const LandingPage = lazy(() => import('@/features/landing/pages/LandingPage'));
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const SignupPage = lazy(() => import('@/features/auth/pages/SignupPage'));
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/ResetPasswordPage'));
const OnboardingWizardPage = lazy(
  () => import('@/features/onboarding/pages/OnboardingWizardPage')
);
const ProfilePage = lazy(() => import('@/features/profile/pages/ProfilePage'));
const TreeSearchPage = lazy(() => import('@/features/trees/pages/TreeSearchPage'));
const TreeViewPage = lazy(() => import('@/features/trees/pages/TreeViewPage'));
const TreeOverviewPage = lazy(() => import('@/features/trees/pages/TreeOverviewPage'));
const ClaimReviewPage = lazy(() => import('@/features/claims/pages/ClaimReviewPage'));
const MergeProposalPage = lazy(() => import('@/features/merge/pages/MergeProposalPage'));
const NotificationsPage = lazy(
  () => import('@/features/notifications/pages/NotificationsPage')
);
const AdminDashboardPage = lazy(() => import('@/features/admin/pages/AdminDashboardPage'));

function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold text-destructive">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <button
        onClick={resetErrorBoundary}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Try again
      </button>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <Loading />;
  if (isAuthenticated) return <Navigate to="/trees" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<Loading />}>
              <Routes>
                <Route
                  path="/"
                  element={
                    <AuthRedirect>
                      <LandingPage />
                    </AuthRedirect>
                  }
                />
                <Route
                  path="/login"
                  element={
                    <AuthRedirect>
                      <LoginPage />
                    </AuthRedirect>
                  }
                />
                <Route
                  path="/signup"
                  element={
                    <AuthRedirect>
                      <SignupPage />
                    </AuthRedirect>
                  }
                />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                <Route
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/onboarding" element={<OnboardingWizardPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/trees" element={<TreeSearchPage />} />
                  <Route path="/trees/:slug" element={<TreeViewPage />} />
                  <Route path="/trees/:slug/overview" element={<TreeOverviewPage />} />
                  <Route path="/search" element={<TreeSearchPage />} />
                  <Route path="/claims/:id" element={<ClaimReviewPage />} />
                  <Route path="/merge/:id" element={<MergeProposalPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route
                    path="/admin/*"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdminDashboardPage />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
