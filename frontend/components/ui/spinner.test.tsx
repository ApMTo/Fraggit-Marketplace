import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Spinner } from './spinner';

describe('Spinner', () => {
  it('renders loading indicator', () => {
    render(<Spinner />);

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('applies size classes', () => {
    render(<Spinner size="lg" />);

    expect(screen.getByRole('status').className).toContain('size-10');
  });
});
