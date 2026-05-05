import { FormEvent, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, Loader2, MapPin, Plus, Search, TreePine, UserRound } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '@/shared/services/api';

type Step = 'welcome' | 'details' | 'existing' | 'choose';

interface PersonalDetails {
  name: string;
  familyName: string;
  birthPlace: string;
  age: string;
}

interface TreeResult {
  id: string;
  name: string;
  slug: string;
  memberCount?: number;
}

const examplePeople = {
  shantilal: { name: 'Shantilal Jain', years: '1800', age: 72, place: 'Jaisalmer' },
  kesar: { name: 'Kesar Bai Jain', years: '1808', age: 68, place: 'Jodhpur' },
  manekchand: { name: 'Manekchand Jain', years: '1838', age: 81, place: 'Pali' },
  ratanlal: { name: 'Ratanlal Jain', years: '1844', age: 76, place: 'Udaipur' },
  lalita: { name: 'Lalita Jain', years: '1849', age: 70, place: 'Pali' },
  unknownSpouse: { name: 'Spouse not added', years: 'unknown', age: null, place: 'Unknown' },
  prakash: { name: 'Prakash Jain', years: '1964', age: 60, place: 'Mumbai' },
  meera: { name: 'Meera Jain', years: '1968', age: 56, place: 'Mumbai' },
  aarav: { name: 'Aarav Jain', years: '2026', age: 0, place: 'San Jose' },
};

type ExamplePerson = (typeof examplePeople)[keyof typeof examplePeople];

const relationshipStyles = {
  rose: {
    line: 'bg-rose-400',
    swatch: 'bg-rose-400',
    dot: 'bg-rose-500',
  },
  emerald: {
    line: 'bg-emerald-500',
    swatch: 'bg-emerald-500',
    dot: 'bg-emerald-600',
  },
  amber: {
    line: 'bg-amber-400',
    swatch: 'bg-amber-400',
    dot: 'bg-amber-500',
  },
};

const fallbackFamilies = ['Jain Family', 'Shah Family', 'Mehta Family', 'Doshi Family'];

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: 'New', lastName: 'Member' };
  if (parts.length === 1) return { firstName: parts[0], lastName: 'Member' };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] };
}

function ageToDateOfBirth(age: string) {
  const numericAge = Number(age);
  if (!Number.isFinite(numericAge) || numericAge < 0) return undefined;
  const year = new Date().getFullYear() - numericAge;
  return `${year}-01-01`;
}

function ExamplePersonBlock({
  person,
  delay,
  muted = false,
}: {
  person: ExamplePerson;
  delay: number;
  muted?: boolean;
}) {
  return (
    <div
      className={`rounded-md border border-border bg-background p-3 shadow-sm ${
        muted ? 'border-dashed opacity-80' : ''
      }`}
      style={{
        animation: `waterfallBlock 700ms ${delay}ms ease-out both, blockFloat 3600ms ${
          delay + 900
        }ms ease-in-out infinite`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{person.name}</p>
          <p className="mt-1 text-xs font-semibold text-primary">{person.years}</p>
        </div>
        {person.age !== null && (
          <span className="shrink-0 rounded-md bg-secondary px-2 py-1 text-xs font-medium">
            Age {person.age}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{person.place}</span>
      </div>
    </div>
  );
}

function ExampleTreeAnimation() {
  return (
    <div className="grid min-h-[560px] gap-4 sm:grid-cols-[1fr_96px]">
      <div className="relative min-w-0 overflow-hidden p-3">
        <div className="pointer-events-none absolute inset-x-6 top-0 h-20 bg-gradient-to-b from-primary/10 to-transparent" />
        <div className="relative mx-auto max-w-3xl">
          <div className="relative grid grid-cols-2 gap-4">
            <div className="absolute left-1/4 right-1/4 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-rose-400">
              <span className="absolute left-0 top-0 h-full w-12 rounded-full bg-white/80" style={{ animation: 'streamAcross 2200ms ease-in-out infinite' }} />
            </div>
            <ExamplePersonBlock person={examplePeople.shantilal} delay={0} />
            <ExamplePersonBlock person={examplePeople.kesar} delay={90} />
          </div>

          <div className="relative mx-auto h-20 w-[84%]">
            <div className="absolute left-1/2 top-0 h-10 w-1 -translate-x-1/2 overflow-hidden rounded-full bg-emerald-500">
              <span className="absolute left-0 top-0 h-6 w-full rounded-full bg-white/80" style={{ animation: 'streamDown 1800ms ease-in-out infinite' }} />
            </div>
            <div className="absolute left-[12.5%] right-[12.5%] top-10 h-1 overflow-hidden rounded-full bg-emerald-500">
              <span className="absolute left-0 top-0 h-full w-12 rounded-full bg-white/80" style={{ animation: 'streamAcross 2100ms 300ms ease-in-out infinite' }} />
            </div>
            <div className="absolute left-[12.5%] top-10 h-10 w-1 -translate-x-1/2 overflow-hidden rounded-full bg-emerald-500">
              <span className="absolute left-0 top-0 h-6 w-full rounded-full bg-white/80" style={{ animation: 'streamDown 1800ms 500ms ease-in-out infinite' }} />
            </div>
            <div className="absolute left-[37.5%] top-10 h-10 w-1 -translate-x-1/2 overflow-hidden rounded-full bg-emerald-500">
              <span className="absolute left-0 top-0 h-6 w-full rounded-full bg-white/80" style={{ animation: 'streamDown 1800ms 700ms ease-in-out infinite' }} />
            </div>
            <div className="absolute right-[12.5%] top-10 h-10 w-1 translate-x-1/2 overflow-hidden rounded-full bg-emerald-500">
              <span className="absolute left-0 top-0 h-6 w-full rounded-full bg-white/80" style={{ animation: 'streamDown 1800ms 900ms ease-in-out infinite' }} />
            </div>
          </div>

          <div className="relative grid grid-cols-4 gap-3">
            <div className="absolute left-[37.5%] right-[37.5%] top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-rose-400">
              <span className="absolute left-0 top-0 h-full w-12 rounded-full bg-white/80" style={{ animation: 'streamAcross 2200ms 700ms ease-in-out infinite' }} />
            </div>
            <ExamplePersonBlock person={examplePeople.manekchand} delay={260} />
            <ExamplePersonBlock person={examplePeople.ratanlal} delay={350} />
            <ExamplePersonBlock person={examplePeople.unknownSpouse} delay={440} muted />
            <ExamplePersonBlock person={examplePeople.lalita} delay={530} />
          </div>

          <div className="relative mx-auto h-20 w-[48%]">
            <div className="absolute left-1/2 top-0 h-10 w-1 -translate-x-1/2 overflow-hidden rounded-full bg-emerald-500">
              <span className="absolute left-0 top-0 h-6 w-full rounded-full bg-white/80" style={{ animation: 'streamDown 1800ms 900ms ease-in-out infinite' }} />
            </div>
            <div className="absolute left-1/4 right-1/4 top-10 h-1 overflow-hidden rounded-full bg-emerald-500">
              <span className="absolute left-0 top-0 h-full w-12 rounded-full bg-white/80" style={{ animation: 'streamAcross 2100ms 1200ms ease-in-out infinite' }} />
            </div>
            <div className="absolute left-1/4 top-10 h-10 w-1 -translate-x-1/2 overflow-hidden rounded-full bg-emerald-500">
              <span className="absolute left-0 top-0 h-6 w-full rounded-full bg-white/80" style={{ animation: 'streamDown 1800ms 1200ms ease-in-out infinite' }} />
            </div>
            <div className="absolute right-1/4 top-10 h-10 w-1 translate-x-1/2 overflow-hidden rounded-full bg-emerald-500">
              <span className="absolute left-0 top-0 h-6 w-full rounded-full bg-white/80" style={{ animation: 'streamDown 1800ms 1400ms ease-in-out infinite' }} />
            </div>
          </div>

          <div className="relative mx-auto grid w-[68%] grid-cols-2 gap-4">
            <ExamplePersonBlock person={examplePeople.prakash} delay={980} />
            <ExamplePersonBlock person={examplePeople.meera} delay={1070} />
          </div>

          <div className="relative mx-auto h-16 w-[36%]">
            <div className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 overflow-hidden rounded-full bg-emerald-500">
              <span className="absolute left-0 top-0 h-6 w-full rounded-full bg-white/80" style={{ animation: 'streamDown 1800ms 1500ms ease-in-out infinite' }} />
            </div>
          </div>

          <div className="mx-auto w-[42%]">
            <ExamplePersonBlock person={examplePeople.aarav} delay={1260} />
          </div>
        </div>
      </div>
      <div className="flex flex-row gap-3 pt-3 text-xs sm:flex-col sm:pl-4 sm:pt-0">
        {[
          ['spouse', relationshipStyles.rose.swatch],
          ['kid', relationshipStyles.emerald.swatch],
        ].map(([label, swatch]) => (
          <div key={label} className="flex items-center gap-2">
            <span className={`h-3 w-6 rounded-full ${swatch}`} />
            <span className="font-medium text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes waterfallBlock {
          from { opacity: 0; transform: translateY(-22px) scale(0.98); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes waterfallLink {
          from { opacity: 0; transform: translateY(-14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes streamDown {
          0% { transform: translateY(-130%); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(220%); opacity: 0; }
        }
        @keyframes streamAcross {
          0% { transform: translateX(-120%); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateX(420%); opacity: 0; }
        }
        @keyframes blockFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(4px); }
        }
      `}</style>
    </div>
  );
}

export default function OnboardingWizardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState<Step>(
    location.pathname === '/onboarding/start' ? 'details' : 'welcome'
  );
  const [details, setDetails] = useState<PersonalDetails>({
    name: '',
    familyName: '',
    birthPlace: '',
    age: '',
  });
  const [existingFamilies, setExistingFamilies] = useState<TreeResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const recommendations = useMemo(() => {
    const family = details.familyName.trim();
    const place = details.birthPlace.trim();
    const names = [
      family ? `${family} Family` : '',
      family ? `${family} Vansh` : '',
      family && place ? `${place} ${family} Family` : '',
      ...fallbackFamilies,
    ].filter(Boolean);
    return [...new Set(names)].slice(0, 6);
  }, [details.familyName, details.birthPlace]);

  const createTreeMutation = useMutation({
    mutationFn: (treeName: string) => {
      const { firstName } = splitName(details.name);
      const lastName = details.familyName.trim() || splitName(details.name).lastName;

      return api
        .post<{ data: { slug: string } }>('/api/trees/wizard', {
          treeName,
          self: {
            firstName,
            lastName,
            gender: 'other',
            dateOfBirth: ageToDateOfBirth(details.age),
            placeOfBirth: details.birthPlace.trim(),
          },
        })
        .then((r) => r.data);
    },
    onSuccess: (tree) => navigate(`/trees/${tree.slug}?tour=1`),
    onError: (err) => setError((err as Error).message || 'Could not create this tree.'),
  });

  const joinTreeMutation = useMutation({
    mutationFn: (tree: TreeResult) =>
      api.post<{ data: { slug: string } }>(`/api/trees/${tree.slug}/join`).then((r) => r.data),
    onSuccess: (tree) => navigate(`/trees/${tree.slug}?tour=1`),
    onError: (err) => setError((err as Error).message || 'Could not join this tree.'),
  });

  const handleDetailsSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const familyName = details.familyName.trim();
    if (!details.name.trim() || !familyName || !details.birthPlace.trim() || !details.age.trim()) {
      setError('Please fill all personal details before continuing.');
      return;
    }

    try {
      const params = new URLSearchParams({ search: familyName, limit: '8' });
      const result = await api.get<{ items: TreeResult[] }>(`/api/trees?${params}`);
      const matches = result.items || [];
      setExistingFamilies(matches);
      setStep(matches.length > 0 ? 'existing' : 'choose');
    } catch {
      setExistingFamilies([]);
      setStep('choose');
    }
  };

  return (
    <div className="min-h-full bg-background">
      {step === 'welcome' && (
        <section className="mx-auto grid max-w-6xl gap-8 px-4 py-6 md:grid-cols-[0.95fr_1.05fr] md:px-8 md:py-10">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-medium text-primary">Welcome to vansh</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal text-foreground sm:text-5xl">
              Discover your ancestry
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">
              Start with yourself, find families that may already exist, or create a new
              tree for your branch.
            </p>
            <button
              type="button"
              onClick={() => navigate('/onboarding/start')}
              className="mt-8 inline-flex h-11 w-fit items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <ExampleTreeAnimation />
        </section>
      )}

      {step === 'details' && (
        <section className="mx-auto max-w-2xl px-4 py-8 md:px-8">
          <div className="mb-6">
            <p className="text-sm font-medium text-primary">Member details</p>
            <h1 className="mt-2 text-2xl font-semibold">Enter your details</h1>
          </div>
          <form onSubmit={handleDetailsSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
                First name
              </label>
              <input
                id="name"
                value={details.name}
                onChange={(e) => setDetails((d) => ({ ...d, name: e.target.value }))}
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="familyName" className="mb-1.5 block text-sm font-medium">
                Family or surname
              </label>
              <input
                id="familyName"
                value={details.familyName}
                onChange={(e) => setDetails((d) => ({ ...d, familyName: e.target.value }))}
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="birthPlace" className="mb-1.5 block text-sm font-medium">
                  Birth place
                </label>
                <input
                  id="birthPlace"
                  value={details.birthPlace}
                  onChange={(e) => setDetails((d) => ({ ...d, birthPlace: e.target.value }))}
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div>
                <label htmlFor="age" className="mb-1.5 block text-sm font-medium">
                  Age
                </label>
                <input
                  id="age"
                  type="number"
                  min="0"
                  value={details.age}
                  onChange={(e) => setDetails((d) => ({ ...d, age: e.target.value }))}
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-between pt-3">
              <button
                type="button"
                onClick={() => setStep('welcome')}
                className="rounded-md border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary"
              >
                Back
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        </section>
      )}

      {step === 'existing' && (
        <section className="mx-auto max-w-4xl px-4 py-8 md:px-8">
          <p className="text-sm font-medium text-primary">Choose your tree</p>
          <h1 className="mt-2 text-2xl font-semibold">
            Join an existing {details.familyName.trim()} tree
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            These trees already match your family or surname. Join one if it looks right, or
            create a new tree for your branch below.
          </p>

          <div className="mt-6 grid gap-3">
            {existingFamilies.map((tree) => (
              <div
                key={tree.id}
                className="flex flex-col gap-3 rounded-md border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <span>
                  <span className="block font-medium">{tree.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {tree.memberCount ?? 0} members
                  </span>
                </span>
                <span className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/trees/${tree.slug}`)}
                    className="inline-flex min-h-[40px] items-center gap-2 rounded-md border border-border px-3 text-sm font-medium hover:bg-secondary"
                  >
                    <Search className="h-4 w-4" />
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => joinTreeMutation.mutate(tree)}
                    disabled={joinTreeMutation.isPending}
                    className="inline-flex min-h-[40px] items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {joinTreeMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <TreePine className="h-4 w-4" />
                    )}
                    Join tree
                  </button>
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 border-t border-border pt-6">
            <h2 className="text-lg font-semibold">Create a new tree</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Suggested names based on your details.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {recommendations.slice(0, 4).map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => createTreeMutation.mutate(name)}
                  disabled={createTreeMutation.isPending}
                  className="rounded-md border border-border bg-card p-4 text-left hover:border-primary disabled:opacity-50"
                >
                  <span className="flex items-center gap-2 font-medium">
                    <UserRound className="h-4 w-4 text-primary" />
                    {name}
                  </span>
                  <span className="mt-2 block text-sm text-muted-foreground">
                    Create this as my tree
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={() => setStep('details')}
              className="rounded-md border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep('choose')}
              className="rounded-md border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary"
            >
              More names
            </button>
          </div>
          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        </section>
      )}

      {step === 'choose' && (
        <section className="mx-auto max-w-4xl px-4 py-8 md:px-8">
          <p className="text-sm font-medium text-primary">Choose your tree</p>
          <h1 className="mt-2 text-2xl font-semibold">Recommended family names</h1>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {recommendations.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => createTreeMutation.mutate(name)}
                disabled={createTreeMutation.isPending}
                className="rounded-md border border-border bg-card p-4 text-left hover:border-primary disabled:opacity-50"
              >
                <span className="flex items-center gap-2 font-medium">
                  <UserRound className="h-4 w-4 text-primary" />
                  {name}
                </span>
                <span className="mt-2 block text-sm text-muted-foreground">
                  Create this as my tree
                </span>
              </button>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep(existingFamilies.length > 0 ? 'existing' : 'details')}
              className="rounded-md border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() =>
                createTreeMutation.mutate(`${details.familyName.trim() || 'New'} Family`)
              }
              disabled={createTreeMutation.isPending}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {createTreeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create a new one
            </button>
          </div>
          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        </section>
      )}
    </div>
  );
}
