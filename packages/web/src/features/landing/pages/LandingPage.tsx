import { Link } from 'react-router-dom';
import { TreePine, Users, GitMerge, Share2 } from 'lucide-react';

const features = [
  {
    icon: TreePine,
    title: 'Visual Family Tree',
    description: 'Build and visualize your family tree with radial, top-down, and list views.',
  },
  {
    icon: Users,
    title: 'Collaborate Together',
    description: 'Invite family members to contribute. Claim nodes, verify identities, and grow together.',
  },
  {
    icon: GitMerge,
    title: 'Merge Trees',
    description: 'Discover overlapping trees and merge them with smart conflict resolution.',
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Vansh" className="h-8 w-auto" />
        </div>
        <Link
          to="/login"
          className="rounded-md px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
        >
          Sign In
        </Link>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12 text-center sm:px-6 md:py-20">
        <img src="/logo.png" alt="Vansh" className="h-80 w-auto sm:h-96" />
        <div className="max-w-lg">
          <p className="text-base text-muted-foreground sm:text-lg">
            Preserve your family's legacy. Build, share, and connect your family tree with relatives
            across generations.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Link
            to="/signup"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Get Started
          </Link>
          <Link
            to="/trees"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-secondary"
          >
            <Share2 className="h-4 w-4" />
            Browse Trees
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-card px-4 py-12 sm:px-6 md:py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-xl font-semibold text-foreground sm:text-2xl">
            Everything you need to preserve your heritage
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border border-border bg-background p-6"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-1 text-sm font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-6 text-center text-xs text-muted-foreground sm:px-6">
        Vansh &mdash; Preserve your family's legacy
      </footer>
    </div>
  );
}
