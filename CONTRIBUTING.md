# Contributing to OgaJobs

> Thank you for your interest in contributing to OgaJobs! This guide will help you get started.

## 🌟 Welcome Contributors

OgaJobs is an open-source marketplace platform connecting Nigerian artisans with clients. We welcome contributions from developers, designers, translators, and community members who share our vision of empowering Nigeria's artisan community.

## 🎯 How to Contribute

### Types of Contributions

- **Code**: Bug fixes, new features, performance improvements
- **Documentation**: API docs, user guides, code comments
- **Translation**: New language support and translation improvements
- **Design**: UI/UX improvements, accessibility enhancements
- **Testing**: Test coverage, bug reports, quality assurance
- **Community**: Issue triage, user support, feature feedback

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git version control
- Basic understanding of React, TypeScript, and Supabase
- Familiarity with Nigerian market context (helpful but not required)

### Development Setup

1. **Fork the Repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/ogajobs.git
   cd ogajobs
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Configure your Supabase credentials
   ```

4. **Start Development**
   ```bash
   npm run dev
   ```

5. **Run Tests**
   ```bash
   npm test
   ```

### Project Structure

```
ogajobs/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Page components
│   ├── hooks/              # Custom React hooks
│   ├── contexts/           # React contexts
│   ├── lib/                # Utility functions
│   ├── types/              # TypeScript type definitions
│   ├── i18n/               # Internationalization
│   └── test/               # Test files
├── supabase/
│   ├── functions/          # Edge functions
│   └── migrations/         # Database migrations
├── public/                 # Static assets
├── docs/                   # Documentation
└── README.md
```

## 📋 Development Guidelines

### Code Standards

#### TypeScript
- Use strict TypeScript configuration
- Define interfaces for all data structures
- Avoid `any` types - use proper typing
- Use meaningful variable and function names

```typescript
// ✅ Good
interface BookingRequest {
  clientId: string;
  serviceType: string;
  description: string;
  budget: number;
  urgency: 'low' | 'normal' | 'high';
}

const createBooking = async (request: BookingRequest): Promise<Booking> => {
  // Implementation
};

// ❌ Bad
const createBooking = (data: any) => {
  // Implementation
};
```

#### React Components
- Use functional components with hooks
- Implement proper error boundaries
- Follow single responsibility principle
- Use meaningful component and prop names

```typescript
// ✅ Good
interface BookingCardProps {
  booking: Booking;
  onStatusUpdate: (bookingId: string, status: BookingStatus) => void;
  showActions?: boolean;
}

const BookingCard: React.FC<BookingCardProps> = ({ 
  booking, 
  onStatusUpdate,
  showActions = true 
}) => {
  // Component implementation
};

// ❌ Bad
const Card = ({ data, fn, flag }) => {
  // Component implementation
};
```

#### Styling
- Use Tailwind CSS utility classes
- Follow design system tokens from `index.css`
- Ensure responsive design for all screen sizes
- Maintain accessibility standards

```typescript
// ✅ Good - Using design system tokens
<button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md">
  Book Service
</button>

// ❌ Bad - Using direct colors
<button className="bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded-md">
  Book Service
</button>
```

### Database & API Guidelines

#### Supabase Edge Functions
- Implement proper error handling
- Add comprehensive logging
- Include input validation
- Follow security best practices

```typescript
// ✅ Good edge function structure
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { data, error } = await validateRequest(req);
    if (error) {
      return Response.json({ error }, { status: 400, headers: corsHeaders });
    }

    const result = await processRequest(data);
    return Response.json(result, { headers: corsHeaders });
  } catch (error) {
    console.error('Function error:', error);
    return Response.json(
      { error: 'Internal server error' }, 
      { status: 500, headers: corsHeaders }
    );
  }
});
```

#### Database Design
- Use Row Level Security (RLS) policies
- Implement proper foreign key constraints
- Add appropriate indexes for performance
- Include audit trails for sensitive data

### Testing Requirements

#### Unit Tests
All new components and utilities must include tests:

```typescript
import { render, screen } from '@testing-library/react';
import { BookingCard } from './BookingCard';

describe('BookingCard', () => {
  const mockBooking = {
    id: 'test-id',
    clientName: 'John Doe',
    serviceType: 'Plumbing',
    status: 'pending' as const,
    // ... other required fields
  };

  it('displays booking information correctly', () => {
    render(<BookingCard booking={mockBooking} onStatusUpdate={jest.fn()} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Plumbing')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('calls onStatusUpdate when action button clicked', async () => {
    const mockUpdate = jest.fn();
    render(<BookingCard booking={mockBooking} onStatusUpdate={mockUpdate} />);
    
    const acceptButton = screen.getByRole('button', { name: /accept/i });
    await userEvent.click(acceptButton);
    
    expect(mockUpdate).toHaveBeenCalledWith('test-id', 'accepted');
  });
});
```

#### Accessibility Tests
Ensure all components meet accessibility standards:

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('should have no accessibility violations', async () => {
  const { container } = render(<BookingCard booking={mockBooking} onStatusUpdate={jest.fn()} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Internationalization

#### Adding New Languages
1. Create language files in `src/i18n/locales/[lang]/`
2. Add language to `src/i18n/config.ts`
3. Update language selector component
4. Test all UI elements in the new language

#### Translation Guidelines
- Use meaningful keys: `auth.login.button` instead of `button1`
- Include context for translators
- Test text expansion (some languages are 30% longer)
- Consider right-to-left (RTL) support for Arabic

```json
{
  "auth": {
    "login": {
      "title": "Welcome Back",
      "description": "Sign in to your OgaJobs account",
      "button": "Sign In",
      "forgotPassword": "Forgot Password?"
    }
  }
}
```

## 🔄 Contribution Workflow

### 1. Issue Creation
- Search existing issues first
- Use appropriate issue templates
- Provide detailed descriptions
- Include reproduction steps for bugs
- Add relevant labels

### 2. Branch Strategy
```bash
# Create feature branch from main
git checkout main
git pull origin main
git checkout -b feature/booking-system-improvements

# Create bug fix branch
git checkout -b fix/payment-validation-error

# Create documentation branch
git checkout -b docs/api-documentation-update
```

### 3. Development Process
1. Write failing tests first (TDD approach)
2. Implement the feature/fix
3. Ensure all tests pass
4. Update documentation if needed
5. Test manually in different browsers
6. Check accessibility compliance

### 4. Pull Request Process

#### PR Checklist
- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] Accessibility requirements met
- [ ] No breaking changes (or clearly documented)
- [ ] PR description explains the change

#### PR Template
```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Refactoring

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Accessibility testing done

## Screenshots
[If applicable, add screenshots showing the changes]

## Additional Notes
Any additional information for reviewers.
```

### 5. Code Review Process
- All PRs require at least one review
- Address review feedback promptly
- Maintain respectful, constructive discussion
- Be open to suggestions and improvements

## 🌍 Localization Contributions

### Translation Process
1. Check existing translations in `src/i18n/locales/`
2. Identify missing or incorrect translations
3. Create/update translation files
4. Test translations in the application
5. Submit PR with translation updates

### New Language Support
To add a new language:
1. Create directory: `src/i18n/locales/[language-code]/`
2. Copy English files and translate
3. Update `src/i18n/config.ts`
4. Add language to language selector
5. Test thoroughly

## 🐛 Bug Reports

### Bug Report Template
```markdown
**Bug Description**
A clear description of the bug.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment**
- OS: [e.g. iOS]
- Browser: [e.g. chrome, safari]
- Version: [e.g. 22]
- Device: [e.g. iPhone6]

**Additional Context**
Any other context about the problem.
```

## 💡 Feature Requests

### Feature Request Template
```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features you've considered.

**Additional context**
Any other context, mockups, or screenshots.
```

## 🎉 Recognition

### Contributors
We recognize contributors in several ways:
- GitHub contributor list
- Monthly contributor highlights
- Special badges for significant contributions
- Invitation to contributor-only channels

### Types of Recognition
- **Code Contributor**: Merged code contributions
- **Documentation Master**: Significant documentation improvements
- **Translation Hero**: Major translation contributions
- **Bug Hunter**: Significant bug reports and fixes
- **Community Champion**: Outstanding community support

## 📞 Getting Help

### Development Questions
- **GitHub Discussions**: For general questions
- **Discord**: Real-time chat support
- **Email**: dev@ogajobs.ng for private inquiries

### Mentorship Program
New contributors can request mentorship:
1. Comment on the issue you'd like to work on
2. Tag `@mentorship-team`
3. A mentor will guide you through the process

## 📚 Resources

### Learning Resources
- [React Documentation](https://reactjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### Project-Specific Resources
- [Architecture Documentation](./docs/ARCHITECTURE.md)
- [API Documentation](./docs/API_DOCUMENTATION.md)
- [Security Guidelines](./docs/SECURITY.md)
- [Accessibility Guide](./docs/ACCESSIBILITY.md)

## 📄 Code of Conduct

### Our Standards
- **Be Inclusive**: Welcome contributors from all backgrounds
- **Be Respectful**: Treat everyone with respect and kindness
- **Be Collaborative**: Help others and ask for help when needed
- **Be Constructive**: Provide helpful feedback and suggestions
- **Be Patient**: Remember everyone is learning

### Enforcement
- Report violations to conduct@ogajobs.ng
- All reports will be investigated promptly
- Consequences range from warnings to permanent bans
- We reserve the right to remove contributions that violate our standards

## 🙏 Thank You

Thank you for contributing to OgaJobs! Every contribution, no matter how small, helps us build a better platform for Nigeria's artisan community. Together, we're creating opportunities and connecting skilled professionals with those who need their services.

---

*For questions about contributing, email contributors@ogajobs.ng or join our Discord community.*
