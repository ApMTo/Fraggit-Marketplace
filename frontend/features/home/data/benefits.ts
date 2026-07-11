import { Lock, Star, Zap, Shield, MessageSquare } from 'lucide-react';
import type { BenefitItem } from '../types';

export const LANDING_BENEFITS: BenefitItem[] = [
  { key: 'secureDeal', icon: Lock },
  { key: 'verifiedSellers', icon: Star },
  { key: 'fastDeals', icon: Zap },
  { key: 'moderation', icon: Shield },
  { key: 'support', icon: MessageSquare },
];
