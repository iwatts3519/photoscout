'use client';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Globe, Lock, Link2 } from 'lucide-react';
import {
  VISIBILITY_OPTIONS,
  visibilityLabels,
  visibilityDescriptions,
  type Visibility,
} from '@/src/types/community.types';

interface VisibilitySelectorProps {
  value: Visibility;
  onChange: (value: Visibility) => void;
  disabled?: boolean;
}

const visibilityIcons: Record<Visibility, typeof Globe> = {
  private: Lock,
  public: Globe,
  unlisted: Link2,
};

export function VisibilitySelector({
  value,
  onChange,
  disabled = false,
}: VisibilitySelectorProps) {
  return (
    <RadioGroup
      value={value}
      onValueChange={(v) => onChange(v as Visibility)}
      disabled={disabled}
      className="space-y-2"
    >
      {VISIBILITY_OPTIONS.map((option) => {
        const Icon = visibilityIcons[option];
        return (
          <div key={option} className="flex items-start space-x-3">
            <RadioGroupItem
              value={option}
              id={`visibility-${option}`}
              className="mt-1"
            />
            <Label
              htmlFor={`visibility-${option}`}
              className="flex-1 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{visibilityLabels[option]}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {visibilityDescriptions[option]}
              </p>
            </Label>
          </div>
        );
      })}
    </RadioGroup>
  );
}
