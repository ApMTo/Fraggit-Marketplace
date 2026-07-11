import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FormError } from './form-error';

describe('FormError', () => {
  it('renders alert with message', () => {
    render(<FormError>Something went wrong</FormError>);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Something went wrong');
  });
});
