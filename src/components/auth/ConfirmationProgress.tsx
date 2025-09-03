import React from 'react';
import { Check, Mail, UserCheck, Home } from 'lucide-react';

interface ConfirmationProgressProps {
  currentStep: number;
}

const steps = [
  { id: 1, label: 'Sign Up', icon: UserCheck },
  { id: 2, label: 'Email Sent', icon: Mail },
  { id: 3, label: 'Confirm Email', icon: Check },
  { id: 4, label: 'Welcome!', icon: Home },
];

export function ConfirmationProgress({ currentStep }: ConfirmationProgressProps) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.id <= currentStep;
          const isCurrent = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          
          return (
            <div key={step.id} className="flex flex-col items-center relative">
              {/* Progress line */}
              {index < steps.length - 1 && (
                <div className="absolute top-6 left-6 w-full h-0.5 bg-muted">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      isCompleted ? 'bg-primary' : 'bg-muted'
                    }`}
                    style={{ 
                      width: isCompleted ? '100%' : isCurrent ? '50%' : '0%' 
                    }}
                  />
                </div>
              )}
              
              {/* Step circle */}
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 ${
                  isCompleted
                    ? 'bg-primary text-primary-foreground border-primary'
                    : isCurrent
                    ? 'bg-primary/10 text-primary border-primary animate-pulse'
                    : 'bg-muted text-muted-foreground border-muted'
                }`}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Icon className={`h-5 w-5 ${isCurrent ? 'animate-bounce' : ''}`} />
                )}
              </div>
              
              {/* Step label */}
              <span
                className={`text-xs mt-2 font-medium transition-all duration-300 ${
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-2 mb-2">
        <div
          className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${(currentStep / steps.length) * 100}%` }}
        />
      </div>
      
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Step {currentStep} of {steps.length}
        </p>
      </div>
    </div>
  );
}