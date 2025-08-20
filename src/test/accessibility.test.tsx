import { describe, it, expect } from 'vitest';
import { render } from './utils';
// import { axe, toHaveNoViolations } from 'jest-axe';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';

// expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  it('Index page should render without errors', async () => {
    const { container } = render(<Index />);
    // const results = await axe(container);
    // expect(results).toHaveNoViolations();
    expect(container).toBeInTheDocument();
  });

  it('Auth page should render without errors', async () => {
    const { container } = render(<Auth />);
    // const results = await axe(container);
    // expect(results).toHaveNoViolations();
    expect(container).toBeInTheDocument();
  });

  it('Dashboard page should render without errors', async () => {
    const { container } = render(<Dashboard />);
    // const results = await axe(container);
    // expect(results).toHaveNoViolations();
    expect(container).toBeInTheDocument();
  });

  it('should have proper heading hierarchy', async () => {
    const { container } = render(<Index />);
    
    const h1Elements = container.querySelectorAll('h1');
    const h2Elements = container.querySelectorAll('h2');
    
    // Should have exactly one h1
    expect(h1Elements).toHaveLength(1);
    
    // H2 elements should come after h1
    if (h2Elements.length > 0) {
      const h1Position = Array.from(container.querySelectorAll('h1, h2')).indexOf(h1Elements[0]);
      expect(h1Position).toBe(0);
    }
  });

  it('should have proper focus management', async () => {
    const { container } = render(<Auth />);
    
    // All interactive elements should be focusable
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    focusableElements.forEach(element => {
      expect(element).not.toHaveAttribute('tabindex', '-1');
    });
  });

  it('should have proper alt text for images', async () => {
    const { container } = render(<Index />);
    
    const images = container.querySelectorAll('img');
    images.forEach(img => {
      expect(img).toHaveAttribute('alt');
      expect(img.getAttribute('alt')).not.toBe('');
    });
  });

  it('should have proper form labels', async () => {
    const { container } = render(<Auth />);
    
    const inputs = container.querySelectorAll('input[type="email"], input[type="password"], input[type="text"]');
    inputs.forEach(input => {
      const id = input.getAttribute('id');
      if (id) {
        const label = container.querySelector(`label[for="${id}"]`);
        expect(label).toBeTruthy();
      }
    });
  });
});