import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Input } from './input';

describe('Input', () => {
  it('renders input with placeholder', () => {
    render(<Input placeholder="Email" />);

    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
  });

  it('applies error styles when hasError is true', () => {
    render(<Input hasError aria-label="Email" />);

    expect(screen.getByLabelText('Email').className).toContain('border-destructive');
  });
});
