'use client';

import { useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  useOnboardingStore,
  STEP_INFO,
  getNextStep,
  getPreviousStep,
  getStepNumber,
  getTotalSteps,
  type OnboardingStep,
} from '@/src/stores/onboardingStore';
import {
  MapPin,
  Search,
  Sun,
  Bookmark,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Camera,
} from 'lucide-react';

const STEP_ICONS: Record<OnboardingStep, React.ReactNode> = {
  'welcome': <Camera className="h-12 w-12 text-primary" />,
  'map-basics': <MapPin className="h-12 w-12 text-primary" />,
  'location-search': <Search className="h-12 w-12 text-primary" />,
  'weather-info': <Sun className="h-12 w-12 text-primary" />,
  'save-locations': <Bookmark className="h-12 w-12 text-primary" />,
  'complete': <Sparkles className="h-12 w-12 text-primary" />,
};

interface OnboardingDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function OnboardingDialog({ open, onOpenChange }: OnboardingDialogProps) {
  const {
    showOnboarding,
    currentStep,
    setCurrentStep,
    markStepComplete,
    completeOnboarding,
    setShowOnboarding,
  } = useOnboardingStore();

  // Use controlled mode if props provided, otherwise use store
  const isOpen = open ?? showOnboarding;
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (onOpenChange) {
        onOpenChange(newOpen);
      } else {
        setShowOnboarding(newOpen);
      }
    },
    [onOpenChange, setShowOnboarding]
  );

  const stepInfo = STEP_INFO[currentStep];
  const stepNumber = getStepNumber(currentStep);
  const totalSteps = getTotalSteps();
  const nextStep = getNextStep(currentStep);
  const previousStep = getPreviousStep(currentStep);

  const handleNext = useCallback(() => {
    markStepComplete(currentStep);
    if (nextStep) {
      setCurrentStep(nextStep);
    } else {
      completeOnboarding();
      handleOpenChange(false);
    }
  }, [currentStep, nextStep, markStepComplete, setCurrentStep, completeOnboarding, handleOpenChange]);

  const handlePrevious = useCallback(() => {
    if (previousStep) {
      setCurrentStep(previousStep);
    }
  }, [previousStep, setCurrentStep]);

  const handleSkip = useCallback(() => {
    completeOnboarding();
    handleOpenChange(false);
  }, [completeOnboarding, handleOpenChange]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' && previousStep) {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === 'Escape') {
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrevious, handleSkip, previousStep]);

  const isLastStep = currentStep === 'complete';
  const isFirstStep = currentStep === 'welcome';

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            {STEP_ICONS[currentStep]}
          </div>
          <DialogTitle className="text-xl">{stepInfo.title}</DialogTitle>
          <DialogDescription className="text-base">
            {stepInfo.description}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-1.5 py-4">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full transition-colors ${
                index < stepNumber
                  ? 'bg-primary'
                  : index === stepNumber - 1
                  ? 'bg-primary'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Step content hints */}
        {currentStep === 'map-basics' && (
          <div className="rounded-lg bg-muted/50 p-4 text-sm">
            <p className="text-muted-foreground">
              <strong className="text-foreground">Tip:</strong> Use the zoom controls or scroll to zoom in/out.
              The &quot;Locate me&quot; button centers the map on your current location.
            </p>
          </div>
        )}

        {currentStep === 'location-search' && (
          <div className="rounded-lg bg-muted/50 p-4 text-sm">
            <p className="text-muted-foreground">
              <strong className="text-foreground">Tip:</strong> Try searching for landmarks like
              &quot;Ben Nevis&quot; or places like &quot;Lake District&quot;.
            </p>
          </div>
        )}

        {currentStep === 'weather-info' && (
          <div className="rounded-lg bg-muted/50 p-4 text-sm">
            <p className="text-muted-foreground">
              <strong className="text-foreground">Tip:</strong> Use the date picker to plan shoots
              in advance. Check the 7-day forecast to find the best conditions.
            </p>
          </div>
        )}

        {currentStep === 'save-locations' && (
          <div className="rounded-lg bg-muted/50 p-4 text-sm">
            <p className="text-muted-foreground">
              <strong className="text-foreground">Tip:</strong> Create collections to organize
              locations by trip or theme. Add notes about parking, access, or best times to visit.
            </p>
          </div>
        )}

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <div>
            {!isFirstStep && (
              <Button
                variant="ghost"
                onClick={handlePrevious}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            {isFirstStep && (
              <Button
                variant="ghost"
                onClick={handleSkip}
              >
                Skip tour
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <span className="self-center text-sm text-muted-foreground">
              {stepNumber} of {totalSteps}
            </span>
            <Button onClick={handleNext} className="gap-1">
              {isLastStep ? (
                'Get started'
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
