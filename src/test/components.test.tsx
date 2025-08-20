import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from './utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ValidatedInput } from '@/components/security/InputValidator';
import { SecureForm } from '@/components/security/SecureForm';

describe('UI Components Tests', () => {
  describe('Button Component', () => {
    it('should render button with correct text', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('should handle click events', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByRole('button', { name: /click me/i });
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled button</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should apply variant classes correctly', () => {
      const { rerender } = render(<Button variant="destructive">Delete</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-destructive');
      
      rerender(<Button variant="outline">Outline</Button>);
      expect(screen.getByRole('button')).toHaveClass('border-input');
    });
  });

  describe('Input Component', () => {
    it('should render input with correct attributes', () => {
      render(<Input type="email" placeholder="Enter email" />);
      const input = screen.getByPlaceholderText('Enter email');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should handle input changes', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      
      render(<Input onChange={handleChange} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'test');
      
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('Card Component', () => {
    it('should render card with header and content', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Card content</p>
          </CardContent>
        </Card>
      );
      
      expect(screen.getByText('Test Card')).toBeInTheDocument();
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });
  });
});

describe('Security Components Tests', () => {
  describe('ValidatedInput Component', () => {
    it('should validate required fields', async () => {
      const user = userEvent.setup();
      render(
        <ValidatedInput
          name="email"
          label="Email"
          type="email"
          required
          onChange={() => {}}
        />
      );
      
      const input = screen.getByLabelText('Email');
      await user.click(input);
      await user.tab(); // Focus out
      
      expect(screen.getByText(/this field is required/i)).toBeInTheDocument();
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      render(
        <ValidatedInput
          name="email"
          label="Email"
          type="email"
          onChange={() => {}}
        />
      );
      
      const input = screen.getByLabelText('Email');
      await user.type(input, 'invalid-email');
      
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
    });

    it('should detect XSS attempts', async () => {
      const user = userEvent.setup();
      render(
        <ValidatedInput
          name="comment"
          label="Comment"
          type="text"
          onChange={() => {}}
        />
      );
      
      const input = screen.getByLabelText('Comment');
      await user.type(input, '<script>alert("xss")</script>');
      
      expect(screen.getByText(/potentially unsafe content detected/i)).toBeInTheDocument();
    });

    it('should detect SQL injection attempts', async () => {
      const user = userEvent.setup();
      render(
        <ValidatedInput
          name="search"
          label="Search"
          type="text"
          onChange={() => {}}
        />
      );
      
      const input = screen.getByLabelText('Search');
      await user.type(input, "'; DROP TABLE users; --");
      
      expect(screen.getByText(/potentially unsafe content detected/i)).toBeInTheDocument();
    });
  });

  describe('SecureForm Component', () => {
    it('should handle form submission', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn();
      
      render(
        <SecureForm onSubmit={handleSubmit} rateLimitKey="test">
          <Input name="email" type="email" />
          <Button type="submit">Submit</Button>
        </SecureForm>
      );
      
      const emailInput = screen.getByRole('textbox');
      const submitButton = screen.getByRole('button', { name: /submit/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      expect(handleSubmit).toHaveBeenCalled();
    });

    it('should sanitize form data', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn();
      
      render(
        <SecureForm onSubmit={handleSubmit} rateLimitKey="test">
          <Input name="comment" />
          <Button type="submit">Submit</Button>
        </SecureForm>
      );
      
      const commentInput = screen.getByRole('textbox');
      const submitButton = screen.getByRole('button', { name: /submit/i });
      
      await user.type(commentInput, '<script>alert("test")</script>');
      await user.click(submitButton);
      
      // Form should sanitize the input before calling onSubmit
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          comment: expect.not.stringContaining('<script>')
        })
      );
    });
  });
});