# Accessibility Guide

> Making OgaJobs inclusive and accessible to all users

## 🌟 Accessibility Overview

OgaJobs is committed to providing an inclusive digital experience that serves all users, including those with disabilities. Our platform complies with WCAG 2.1 AA standards and implements comprehensive accessibility features.

## ♿ Accessibility Features

### Visual Accessibility

#### High Contrast Mode
```typescript
// Automatic high contrast detection and toggle
const AccessibilityProvider = () => {
  const [highContrast, setHighContrast] = useState(false);
  
  useEffect(() => {
    // Detect user preference
    const hasHighContrastPreference = window.matchMedia('(prefers-contrast: high)').matches;
    setHighContrast(hasHighContrastPreference);
  }, []);

  // Apply high contrast classes to document
  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', highContrast);
  }, [highContrast]);
};
```

#### Large Text Support
- **Scalable Typography**: All text scales up to 200% without horizontal scrolling
- **Relative Units**: Uses `rem` and `em` for consistent scaling
- **Responsive Text**: Adapts to user's browser text size settings

```css
/* Large text mode styles */
.large-text {
  --font-scale: 1.25;
  font-size: calc(var(--base-font-size) * var(--font-scale));
}

.large-text .text-sm { font-size: calc(0.875rem * var(--font-scale)); }
.large-text .text-base { font-size: calc(1rem * var(--font-scale)); }
.large-text .text-lg { font-size: calc(1.125rem * var(--font-scale)); }
```

#### Color and Contrast
- **Minimum Contrast**: 4.5:1 for normal text, 3:1 for large text
- **Color Independence**: Information never conveyed by color alone
- **Focus Indicators**: High-contrast focus rings on all interactive elements

### Motor Accessibility

#### Keyboard Navigation
- **Tab Order**: Logical tab sequence throughout the application
- **Skip Links**: Quick navigation to main content
- **Focus Management**: Proper focus handling in modals and dynamic content

```typescript
// Skip navigation implementation
const SkipNavigation = () => (
  <div className="skip-navigation">
    <a 
      href="#main-content" 
      className="skip-link"
      onFocus={(e) => e.target.scrollIntoView()}
    >
      Skip to main content
    </a>
    <a href="#navigation" className="skip-link">
      Skip to navigation
    </a>
  </div>
);
```

#### Touch Targets
- **Minimum Size**: 44x44px touch targets for mobile
- **Adequate Spacing**: Minimum 8px spacing between interactive elements
- **Large Click Areas**: Buttons and links have generous click areas

### Cognitive Accessibility

#### Reduced Motion
Respects user's motion preferences:

```css
/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

#### Clear Content Structure
- **Heading Hierarchy**: Proper H1-H6 structure
- **Descriptive Links**: Link text describes destination
- **Error Messages**: Clear, specific error descriptions

### Screen Reader Support

#### ARIA Implementation
```typescript
// Comprehensive ARIA support
const AccessibleButton = ({ 
  children, 
  loading, 
  disabled, 
  onClick,
  ariaLabel,
  ariaDescribedBy 
}) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    aria-label={ariaLabel}
    aria-describedby={ariaDescribedBy}
    aria-busy={loading}
    className="accessible-button"
  >
    {loading && (
      <span aria-hidden="true" className="loading-spinner" />
    )}
    <span className={loading ? 'sr-only' : ''}>
      {children}
    </span>
    {loading && (
      <span className="sr-only">Loading...</span>
    )}
  </button>
);

// Live regions for dynamic content
const LiveAnnouncements = () => (
  <>
    <div 
      aria-live="polite" 
      aria-atomic="true" 
      className="sr-only"
      id="status-announcements"
    />
    <div 
      aria-live="assertive" 
      aria-atomic="true" 
      className="sr-only"
      id="error-announcements"
    />
  </>
);
```

#### Alternative Text
- **Images**: Descriptive alt text for all meaningful images
- **Icons**: Appropriate labels for icon-only buttons
- **Complex Graphics**: Extended descriptions for charts and diagrams

## 🧪 Accessibility Testing

### Automated Testing
```typescript
// Accessibility test suite
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<HomePage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper heading hierarchy', () => {
    const { container } = render(<ProfilePage />);
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    // Ensure single H1
    const h1Count = container.querySelectorAll('h1').length;
    expect(h1Count).toBe(1);
    
    // Check hierarchy
    let currentLevel = 1;
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1));
      expect(level).toBeLessThanOrEqual(currentLevel + 1);
      currentLevel = Math.max(currentLevel, level);
    });
  });

  it('should have adequate color contrast', async () => {
    const { container } = render(<BookingForm />);
    
    // Test critical elements
    const buttons = container.querySelectorAll('button');
    const links = container.querySelectorAll('a');
    
    for (const element of [...buttons, ...links]) {
      const style = window.getComputedStyle(element);
      const contrast = calculateContrast(
        style.color, 
        style.backgroundColor
      );
      expect(contrast).toBeGreaterThan(4.5);
    }
  });
});
```

### Manual Testing Checklist

#### Keyboard Navigation
- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical and intuitive
- [ ] Focus indicators are clearly visible
- [ ] Keyboard traps are avoided
- [ ] Skip links function properly

#### Screen Reader Testing
- [ ] Content reads in logical order
- [ ] All images have appropriate alt text
- [ ] Form labels are properly associated
- [ ] Dynamic content announces changes
- [ ] Error messages are announced

#### Visual Testing
- [ ] Text scales to 200% without horizontal scrolling
- [ ] Color contrast meets WCAG standards
- [ ] High contrast mode functions properly
- [ ] Content is readable without color
- [ ] Focus indicators are visible

## 🎨 Accessible Design Patterns

### Form Accessibility
```typescript
const AccessibleFormField = ({ 
  label, 
  error, 
  required, 
  description,
  children 
}) => {
  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  const descId = `${fieldId}-description`;

  return (
    <div className="form-field">
      <label 
        htmlFor={fieldId} 
        className="form-label"
      >
        {label}
        {required && (
          <span aria-label="required" className="required-indicator">
            *
          </span>
        )}
      </label>
      
      {description && (
        <div id={descId} className="form-description">
          {description}
        </div>
      )}
      
      {cloneElement(children, {
        id: fieldId,
        'aria-describedby': [
          description && descId,
          error && errorId
        ].filter(Boolean).join(' '),
        'aria-invalid': !!error,
        required
      })}
      
      {error && (
        <div 
          id={errorId} 
          className="form-error" 
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}
    </div>
  );
};
```

### Modal Accessibility
```typescript
const AccessibleModal = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef(null);
  const previousFocus = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Store previous focus
      previousFocus.current = document.activeElement;
      
      // Focus modal
      modalRef.current?.focus();
      
      // Trap focus
      const trapFocus = (e) => {
        if (e.key === 'Tab') {
          const focusableElements = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }
      };

      document.addEventListener('keydown', trapFocus);
      return () => document.removeEventListener('keydown', trapFocus);
    } else {
      // Restore previous focus
      previousFocus.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="modal-content"
        tabIndex={-1}
      >
        <header className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="modal-close"
          >
            ×
          </button>
        </header>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};
```

## 🌍 Multilingual Accessibility

### Language Support
OgaJobs supports 5 languages with full accessibility in each:

- **English (en)**: Primary language
- **Hausa (ha)**: Northern Nigeria
- **Igbo (ig)**: Southeastern Nigeria
- **Pidgin English (pcn)**: Widely spoken
- **Yoruba (yo)**: Southwestern Nigeria

### Implementation
```typescript
// Language-aware screen reader announcements
const announceInCurrentLanguage = (key: string, values?: Record<string, any>) => {
  const { t, i18n } = useTranslation();
  const message = t(key, values);
  
  // Announce with proper language attribute
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('lang', i18n.language);
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  setTimeout(() => document.body.removeChild(announcement), 1000);
};
```

## 📊 Accessibility Metrics

### Compliance Targets
- **WCAG 2.1 AA**: 100% compliance
- **Keyboard Navigation**: All features accessible
- **Screen Reader Support**: Complete compatibility
- **Color Contrast**: Minimum 4.5:1 ratio
- **Text Scaling**: Up to 200% without issues

### Testing Tools
- **axe-core**: Automated accessibility testing
- **Lighthouse**: Performance and accessibility audits
- **WAVE**: Web accessibility evaluation
- **Colour Contrast Analyser**: Manual contrast testing
- **Screen Readers**: NVDA, JAWS, VoiceOver testing

## 🛠️ Accessibility Tools & Components

### Custom Accessibility Hooks
```typescript
// Focus management hook
export const useFocusManagement = () => {
  const focusRefs = useRef(new Map());
  
  const setFocusRef = useCallback((key: string, element: HTMLElement) => {
    focusRefs.current.set(key, element);
  }, []);
  
  const focusElement = useCallback((key: string) => {
    const element = focusRefs.current.get(key);
    element?.focus();
  }, []);
  
  return { setFocusRef, focusElement };
};

// Announce hook for screen readers
export const useAnnounce = () => {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.querySelector(`[aria-live="${priority}"]`);
    if (announcer) {
      announcer.textContent = message;
      setTimeout(() => announcer.textContent = '', 1000);
    }
  }, []);
  
  return announce;
};
```

### Accessibility Settings Panel
```typescript
const AccessibilitySettings = () => {
  const [settings, setSettings] = useLocalStorage('accessibility-settings', {
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReaderOptimized: false
  });

  const updateSetting = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // Apply settings to document
    document.documentElement.classList.toggle(`${key}-mode`, value);
    
    // Announce change
    announce(`${key} ${value ? 'enabled' : 'disabled'}`);
  };

  return (
    <div className="accessibility-settings">
      <h2>Accessibility Settings</h2>
      
      <div className="setting-group">
        <Switch
          checked={settings.highContrast}
          onCheckedChange={(checked) => updateSetting('highContrast', checked)}
          aria-describedby="high-contrast-desc"
        />
        <label>High Contrast Mode</label>
        <p id="high-contrast-desc">
          Increases contrast for better visibility
        </p>
      </div>
      
      <div className="setting-group">
        <Switch
          checked={settings.largeText}
          onCheckedChange={(checked) => updateSetting('largeText', checked)}
          aria-describedby="large-text-desc"
        />
        <label>Large Text</label>
        <p id="large-text-desc">
          Increases text size for easier reading
        </p>
      </div>
      
      <div className="setting-group">
        <Switch
          checked={settings.reducedMotion}
          onCheckedChange={(checked) => updateSetting('reducedMotion', checked)}
          aria-describedby="reduced-motion-desc"
        />
        <label>Reduced Motion</label>
        <p id="reduced-motion-desc">
          Minimizes animations and transitions
        </p>
      </div>
    </div>
  );
};
```

## 📚 Resources & References

### WCAG Guidelines
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Understanding WCAG 2.1](https://www.w3.org/WAI/WCAG21/Understanding/)
- [Techniques for WCAG 2.1](https://www.w3.org/WAI/WCAG21/Techniques/)

### Testing Resources
- [axe Browser Extension](https://www.deque.com/axe/browser-extensions/)
- [Lighthouse DevTools](https://developers.google.com/web/tools/lighthouse)
- [WAVE Web Accessibility Evaluator](https://wave.webaim.org/)

### Screen Reader Testing
- [NVDA (Free)](https://www.nvaccess.org/download/)
- [JAWS (Commercial)](https://www.freedomscientific.com/products/software/jaws/)
- [VoiceOver (macOS/iOS)](https://support.apple.com/guide/voiceover/)

## 🤝 Contributing to Accessibility

### Reporting Issues
1. Use the accessibility label in GitHub issues
2. Provide specific details about the barrier
3. Include steps to reproduce
4. Mention assistive technology used

### Accessibility Reviews
All pull requests undergo accessibility review:
- [ ] Automated tests pass
- [ ] Manual keyboard testing completed
- [ ] Screen reader testing performed
- [ ] Color contrast verified
- [ ] Documentation updated

---

*OgaJobs is committed to digital inclusion. For accessibility questions or concerns, email accessibility@ogajobs.ng*