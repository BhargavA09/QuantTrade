import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatCard from './StatCard';
import React from 'react';

describe('StatCard Component', () => {
  it('renders label and value correctly', () => {
    render(<StatCard label="Test Label" value="$100.00" />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
  });

  it('renders subValue when provided', () => {
    render(<StatCard label="Test Label" value="$100.00" subValue="Sub Value" />);
    expect(screen.getByText('Sub Value')).toBeInTheDocument();
  });

  it('renders trend icon when trend is up', () => {
    const { container } = render(<StatCard label="Test Label" value="$100.00" trend="up" />);
    const trendIcon = container.querySelector('svg');
    expect(trendIcon).toBeInTheDocument();
  });
});
