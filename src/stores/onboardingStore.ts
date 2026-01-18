import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type OnboardingStep =
  | 'welcome'
  | 'map-basics'
  | 'location-search'
  | 'weather-info'
  | 'save-locations'
  | 'complete';

export interface OnboardingState {
  // State
  hasCompletedOnboarding: boolean;
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  dismissedTooltips: string[];
  showOnboarding: boolean;

  // Actions
  setCurrentStep: (step: OnboardingStep) => void;
  markStepComplete: (step: OnboardingStep) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  startOnboarding: () => void;
  dismissTooltip: (tooltipId: string) => void;
  isTooltipDismissed: (tooltipId: string) => boolean;
  setShowOnboarding: (show: boolean) => void;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  'welcome',
  'map-basics',
  'location-search',
  'weather-info',
  'save-locations',
  'complete',
];

export const STEP_INFO: Record<OnboardingStep, { title: string; description: string }> = {
  'welcome': {
    title: 'Welcome to PhotoScout',
    description: 'Your photography location planning companion for the UK.',
  },
  'map-basics': {
    title: 'Explore the Map',
    description: 'Click anywhere on the map to select a location. Drag the marker to adjust, or use the radius slider to expand your search area.',
  },
  'location-search': {
    title: 'Search for Places',
    description: 'Use the search bar to find locations by name. Type a place name and select from the suggestions.',
  },
  'weather-info': {
    title: 'Check Conditions',
    description: 'View current weather, sun times, and photography scores. Plan your shoot around golden hour for the best light.',
  },
  'save-locations': {
    title: 'Save Your Spots',
    description: 'Sign in to save your favorite locations, organize them into collections, and add notes for future reference.',
  },
  'complete': {
    title: 'You\'re All Set!',
    description: 'Start exploring and find your next great photography location. You can always access help from the menu.',
  },
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      // Initial state
      hasCompletedOnboarding: false,
      currentStep: 'welcome',
      completedSteps: [],
      dismissedTooltips: [],
      showOnboarding: false,

      // Actions
      setCurrentStep: (step) => set({ currentStep: step }),

      markStepComplete: (step) => {
        const { completedSteps } = get();
        if (!completedSteps.includes(step)) {
          set({ completedSteps: [...completedSteps, step] });
        }
      },

      completeOnboarding: () => set({
        hasCompletedOnboarding: true,
        showOnboarding: false,
        currentStep: 'complete',
      }),

      resetOnboarding: () => set({
        hasCompletedOnboarding: false,
        currentStep: 'welcome',
        completedSteps: [],
        dismissedTooltips: [],
        showOnboarding: false,
      }),

      startOnboarding: () => set({
        showOnboarding: true,
        currentStep: 'welcome',
      }),

      dismissTooltip: (tooltipId) => {
        const { dismissedTooltips } = get();
        if (!dismissedTooltips.includes(tooltipId)) {
          set({ dismissedTooltips: [...dismissedTooltips, tooltipId] });
        }
      },

      isTooltipDismissed: (tooltipId) => {
        return get().dismissedTooltips.includes(tooltipId);
      },

      setShowOnboarding: (show) => set({ showOnboarding: show }),
    }),
    {
      name: 'photoscout-onboarding',
      version: 1,
    }
  )
);

// Helper to get next step
export function getNextStep(current: OnboardingStep): OnboardingStep | null {
  const currentIndex = ONBOARDING_STEPS.indexOf(current);
  if (currentIndex < ONBOARDING_STEPS.length - 1) {
    return ONBOARDING_STEPS[currentIndex + 1];
  }
  return null;
}

// Helper to get previous step
export function getPreviousStep(current: OnboardingStep): OnboardingStep | null {
  const currentIndex = ONBOARDING_STEPS.indexOf(current);
  if (currentIndex > 0) {
    return ONBOARDING_STEPS[currentIndex - 1];
  }
  return null;
}

// Helper to get step index (1-based for display)
export function getStepNumber(step: OnboardingStep): number {
  return ONBOARDING_STEPS.indexOf(step) + 1;
}

// Helper to get total steps
export function getTotalSteps(): number {
  return ONBOARDING_STEPS.length;
}
