import {
  Gamepad2,
  MessageCircle,
  Headphones,
  Gem,
  Wrench,
  Package,
  Share2,
  KeyRound,
} from 'lucide-react';
import type { CategoryItem } from '../types';

export const LANDING_CATEGORIES: CategoryItem[] = [
  {
    key: 'gamingAccounts',
    icon: Gamepad2,
    gradient: 'from-blue-500/20 to-purple-500/20',
  },
  {
    key: 'telegram',
    icon: MessageCircle,
    gradient: 'from-cyan-500/20 to-blue-500/20',
  },
  {
    key: 'discord',
    icon: Headphones,
    gradient: 'from-indigo-500/20 to-purple-500/20',
  },
  {
    key: 'inGameCurrency',
    icon: Gem,
    gradient: 'from-amber-500/20 to-orange-500/20',
  },
  {
    key: 'services',
    icon: Wrench,
    gradient: 'from-emerald-500/20 to-teal-500/20',
  },
  {
    key: 'digitalGoods',
    icon: Package,
    gradient: 'from-violet-500/20 to-fuchsia-500/20',
  },
  {
    key: 'socialMedia',
    icon: Share2,
    gradient: 'from-pink-500/20 to-rose-500/20',
  },
  {
    key: 'subscriptions',
    icon: KeyRound,
    gradient: 'from-sky-500/20 to-indigo-500/20',
  },
];
