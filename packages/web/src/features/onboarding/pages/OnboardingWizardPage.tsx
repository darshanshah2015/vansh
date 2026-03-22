import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/shared/services/api';
import { useAuth } from '@/shared/contexts/AuthContext';
import { WizardProgress } from '../components/WizardProgress';
import { WizardStepSelf, type SelfData } from '../components/WizardStepSelf';
import { WizardStepParents, type ParentsData } from '../components/WizardStepParents';
import { WizardStepFamily, type FamilyData } from '../components/WizardStepFamily';
import { WizardStepTreeName } from '../components/WizardStepTreeName';
import { MatchResults } from '../components/MatchResults';

const STORAGE_KEY = 'vansh_onboarding_progress';

interface WizardState {
  self?: SelfData;
  parents?: ParentsData;
  family?: FamilyData;
}

function loadSavedState(): WizardState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveState(state: WizardState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

interface Match {
  personId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  gotra: string | null;
  treeId: string;
  treeName: string;
  treeSlug: string;
  confidence: number;
}

export default function OnboardingWizardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [wizardState, setWizardState] = useState<WizardState>(loadSavedState);
  const [matches, setMatches] = useState<Match[]>([]);
  const [showMatches, setShowMatches] = useState(false);

  useEffect(() => {
    saveState(wizardState);
  }, [wizardState]);

  const matchMutation = useMutation({
    mutationFn: (data: { firstName: string; lastName: string; dateOfBirth?: string; gotra?: string; parentNames?: string[] }) =>
      api.post<{ data: Match[] }>('/api/trees/matching/search', data).then((r) => r.data),
  });

  const createTreeMutation = useMutation({
    mutationFn: (data: unknown) => api.post<{ data: { slug: string } }>('/api/trees/wizard', data).then((r) => r.data),
    onSuccess: (tree) => {
      localStorage.removeItem(STORAGE_KEY);
      navigate(`/trees/${tree.slug}?tour=1`);
    },
  });

  const claimMutation = useMutation({
    mutationFn: (personId: string) =>
      api.post(`/api/persons/${personId}/claim`, { reason: 'Claimed during onboarding' }),
    onSuccess: (_data, _personId) => {
      localStorage.removeItem(STORAGE_KEY);
      navigate('/trees');
    },
  });

  const handleSelfNext = async (data: SelfData) => {
    setWizardState((s) => ({ ...s, self: data }));
    setStep(1);
  };

  const handleParentsNext = async (data: ParentsData) => {
    setWizardState((s) => ({ ...s, parents: data }));

    // Try matching after parents step
    const selfData = wizardState.self!;
    const parentNames: string[] = [];
    if (data.father?.firstName && data.father?.lastName) {
      parentNames.push(`${data.father.firstName} ${data.father.lastName}`);
    }
    if (data.mother?.firstName && data.mother?.lastName) {
      parentNames.push(`${data.mother.firstName} ${data.mother.lastName}`);
    }

    try {
      const result = await matchMutation.mutateAsync({
        firstName: selfData.firstName,
        lastName: selfData.lastName,
        dateOfBirth: selfData.dateOfBirth || undefined,
        gotra: selfData.gotra || undefined,
        parentNames: parentNames.length > 0 ? parentNames : undefined,
      });

      if (result.length > 0) {
        setMatches(result);
        setShowMatches(true);
        return;
      }
    } catch {
      // If matching fails, just continue
    }

    setStep(2);
  };

  const handleFamilyNext = (data: FamilyData) => {
    setWizardState((s) => ({ ...s, family: data }));
    setStep(3);
  };

  const handleCreateTree = (treeName: string) => {
    const { self, parents, family } = wizardState;
    if (!self) return;

    const parentsList: Array<{
      firstName: string;
      lastName: string;
      gender: 'male' | 'female' | 'other';
      dateOfBirth?: string;
    }> = [];
    if (parents?.father?.firstName && parents.father.lastName) {
      parentsList.push({
        firstName: parents.father.firstName,
        lastName: parents.father.lastName,
        gender: 'male',
        dateOfBirth: parents.father.dateOfBirth || undefined,
      });
    }
    if (parents?.mother?.firstName && parents.mother.lastName) {
      parentsList.push({
        firstName: parents.mother.firstName,
        lastName: parents.mother.lastName,
        gender: 'female',
        dateOfBirth: parents.mother.dateOfBirth || undefined,
      });
    }

    const payload: Record<string, unknown> = {
      treeName,
      self: {
        firstName: self.firstName,
        lastName: self.lastName,
        gender: self.gender,
        dateOfBirth: self.dateOfBirth || undefined,
        gotra: self.gotra || undefined,
      },
    };

    if (parentsList.length > 0) payload.parents = parentsList;

    if (family?.spouse?.firstName && family.spouse.lastName && family.spouse.gender) {
      payload.spouse = {
        firstName: family.spouse.firstName,
        lastName: family.spouse.lastName,
        gender: family.spouse.gender,
        dateOfBirth: family.spouse.dateOfBirth || undefined,
        marriageDate: family.spouse.marriageDate || undefined,
      };
    }

    if (family?.siblings && family.siblings.length > 0) {
      payload.siblings = family.siblings.map((s) => ({
        firstName: s.firstName,
        lastName: s.lastName,
        gender: s.gender,
        dateOfBirth: s.dateOfBirth || undefined,
      }));
    }

    createTreeMutation.mutate(payload);
  };

  const handleMatchConfirm = (match: Match) => {
    claimMutation.mutate(match.personId);
  };

  const handleDismissMatches = () => {
    setShowMatches(false);
    setStep(2);
  };

  const suggestedTreeName = wizardState.self
    ? `${wizardState.self.lastName} Family`
    : `${user?.lastName ?? ''} Family`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <WizardProgress currentStep={step} />

      {showMatches ? (
        <MatchResults
          matches={matches}
          onConfirm={handleMatchConfirm}
          onDismissAll={handleDismissMatches}
        />
      ) : (
        <>
          {step === 0 && (
            <WizardStepSelf defaultValues={wizardState.self} onNext={handleSelfNext} />
          )}
          {step === 1 && (
            <WizardStepParents
              defaultValues={wizardState.parents}
              onNext={handleParentsNext}
              onBack={() => setStep(0)}
            />
          )}
          {step === 2 && (
            <WizardStepFamily
              defaultValues={wizardState.family}
              onNext={handleFamilyNext}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <WizardStepTreeName
              suggestedName={suggestedTreeName}
              onSubmit={handleCreateTree}
              onBack={() => setStep(2)}
              isSubmitting={createTreeMutation.isPending}
            />
          )}
        </>
      )}

      {(createTreeMutation.isError || claimMutation.isError) && (
        <div className="mt-4 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          {(createTreeMutation.error as Error)?.message ||
            (claimMutation.error as Error)?.message ||
            'Something went wrong. Please try again.'}
        </div>
      )}

      <div className="mt-8 text-center">
        <button
          onClick={() => navigate('/trees')}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Come back later
        </button>
      </div>
    </div>
  );
}
