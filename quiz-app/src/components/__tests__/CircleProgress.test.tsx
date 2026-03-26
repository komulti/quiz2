import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CircleProgress from '../CircleProgress';

describe('CircleProgress', () => {
  it('퍼센트 텍스트가 표시된다', () => {
    render(<CircleProgress percent={75} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('0%가 표시된다', () => {
    render(<CircleProgress percent={0} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('100%가 표시된다', () => {
    render(<CircleProgress percent={100} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('aria-label에 퍼센트가 포함된다', () => {
    render(<CircleProgress percent={60} />);
    expect(screen.getByRole('img', { name: /60%/ })).toBeInTheDocument();
  });

  it('기본 size는 120이다', () => {
    const { container } = render(<CircleProgress percent={50} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('120');
    expect(svg?.getAttribute('height')).toBe('120');
  });

  it('커스텀 size가 적용된다', () => {
    const { container } = render(<CircleProgress percent={50} size={200} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('200');
  });
});
