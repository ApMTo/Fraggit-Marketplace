'use client';

import { HydrationBoundary, type DehydratedState } from '@tanstack/react-query';
import type { ReactNode } from 'react';

type ListingsHydrationProps = {
  state: DehydratedState;
  children: ReactNode;
};

export function ListingsHydration({
  state,
  children,
}: ListingsHydrationProps) {
  return <HydrationBoundary state={state}>{children}</HydrationBoundary>;
}
