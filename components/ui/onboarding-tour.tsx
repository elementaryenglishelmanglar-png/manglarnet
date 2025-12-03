import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './dialog';
import { Button } from './button';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TourStep {
  id: string;
  title: string;
  description: string | React.ReactNode;
  target?: string; // Selector CSS del elemento a destacar
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: () => void; // Acción a ejecutar antes de mostrar el paso
}

interface OnboardingTourProps {
  steps: TourStep[];
  onComplete?: () => void;
  onSkip?: () => void;
  storageKey?: string; // Clave para localStorage
}

export function OnboardingTour({
  steps,
  onComplete,
  onSkip,
  storageKey = 'manglar-onboarding-completed',
}: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Verificar si el tour ya fue completado
  useEffect(() => {
    const completed = localStorage.getItem(storageKey);
    if (completed === 'true') {
      return; // No mostrar si ya fue completado
    }

    // Mostrar después de un pequeño delay
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [storageKey]);

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (currentStepData.action) {
      currentStepData.action();
    }

    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    setIsOpen(false);
    if (onSkip) {
      onSkip();
    }
  };

  const handleComplete = () => {
    setIsOpen(false);
    localStorage.setItem(storageKey, 'true');
    setCompletedSteps(new Set(steps.map((s) => s.id)));
    if (onComplete) {
      onComplete();
    }
  };

  if (!isOpen || !currentStepData) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{currentStepData.title}</DialogTitle>
            <button
              onClick={handleSkip}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Saltar tour"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <DialogDescription className="pt-2">
            {typeof currentStepData.description === 'string' ? (
              <p>{currentStepData.description}</p>
            ) : (
              currentStepData.description
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Indicador de progreso */}
        <div className="flex items-center gap-2 py-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "flex-1 h-1.5 rounded-full transition-colors",
                index <= currentStep
                  ? "bg-manglar-orange"
                  : "bg-muted"
              )}
            />
          ))}
        </div>
        <div className="text-xs text-muted-foreground text-center">
          Paso {currentStep + 1} de {steps.length}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-muted-foreground"
          >
            Saltar tour
          </Button>
          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="flex items-center gap-1 bg-manglar-orange hover:bg-manglar-orange/90"
            >
              {isLastStep ? (
                <>
                  <Check className="h-4 w-4" />
                  Completar
                </>
              ) : (
                <>
                  Siguiente
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

// Hook para verificar si el onboarding fue completado
export function useOnboardingStatus(storageKey: string = 'manglar-onboarding-completed') {
  const [isCompleted, setIsCompleted] = useState(() => {
    return localStorage.getItem(storageKey) === 'true';
  });

  const markAsCompleted = () => {
    localStorage.setItem(storageKey, 'true');
    setIsCompleted(true);
  };

  const reset = () => {
    localStorage.removeItem(storageKey);
    setIsCompleted(false);
  };

  return { isCompleted, markAsCompleted, reset };
}

