import type { LucideIcon } from 'lucide-react';

export type LandingLinks = {
  startShopping: string;
  becomeSeller: string;
  createAccount: string;
  dashboard: string;
};

export type CategoryItem = {
  key: string;
  icon: LucideIcon;
  gradient: string;
};

export type BenefitItem = {
  key: string;
  icon: LucideIcon;
};

export type StepItem = {
  key: string;
  step: number;
};

export type FaqItem = {
  key: string;
};
