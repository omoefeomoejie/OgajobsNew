import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { sanitizeInput, detectXSS, detectSQLInjection, validators } from '@/lib/security';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface ValidatedInputProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'password';
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  validator?: (value: string) => string | null;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export function ValidatedInput({
  label,
  name,
  type = 'text',
  placeholder,
  required = false,
  minLength,
  maxLength,
  pattern,
  validator,
  className = '',
  value: controlledValue,
  onChange
}: ValidatedInputProps) {
  const [value, setValue] = useState(controlledValue || '');
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const validateInput = (inputValue: string) => {
    // Clear previous validation
    setError(null);
    setIsValid(null);

    if (!inputValue && !required) {
      return;
    }

    if (!inputValue && required) {
      setError(`${label} is required`);
      setIsValid(false);
      return;
    }

    // Length validation
    if (minLength && inputValue.length < minLength) {
      setError(`${label} must be at least ${minLength} characters`);
      setIsValid(false);
      return;
    }

    if (maxLength && inputValue.length > maxLength) {
      setError(`${label} must be less than ${maxLength} characters`);
      setIsValid(false);
      return;
    }

    // Pattern validation
    if (pattern && !new RegExp(pattern).test(inputValue)) {
      setError(`${label} format is invalid`);
      setIsValid(false);
      return;
    }

    // Type-specific validation
    if (type === 'email' && !validators.email(inputValue)) {
      setError('Please enter a valid email address');
      setIsValid(false);
      return;
    }

    if (type === 'tel' && !validators.phone(inputValue)) {
      setError('Please enter a valid Nigerian phone number');
      setIsValid(false);
      return;
    }

    // Security validation
    if (detectXSS(inputValue)) {
      setError('Invalid characters detected');
      setIsValid(false);
      return;
    }

    if (detectSQLInjection(inputValue)) {
      setError('Invalid input detected');
      setIsValid(false);
      return;
    }

    // Custom validation
    if (validator) {
      const customError = validator(inputValue);
      if (customError) {
        setError(customError);
        setIsValid(false);
        return;
      }
    }

    // All validations passed
    setIsValid(true);
  };

  const handleChange = (newValue: string) => {
    const sanitized = sanitizeInput(newValue);
    setValue(sanitized);
    
    if (onChange) {
      onChange(sanitized);
    }

    // Debounced validation
    const timeoutId = setTimeout(() => {
      validateInput(sanitized);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  useEffect(() => {
    if (controlledValue !== undefined) {
      setValue(controlledValue);
      validateInput(controlledValue);
    }
  }, [controlledValue]);

  const inputProps = {
    name,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
      handleChange(e.target.value),
    placeholder,
    required,
    className: `${className} ${error ? 'border-destructive' : isValid ? 'border-green-500' : ''}`,
    'aria-invalid': error ? true : false,
    'aria-describedby': error ? `${name}-error` : undefined
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="flex items-center gap-2">
        {label}
        {required && <span className="text-destructive">*</span>}
        {isValid && <CheckCircle className="h-4 w-4 text-green-500" />}
      </Label>
      
      {type === 'textarea' ? (
        <Textarea
          id={name}
          {...inputProps}
          rows={4}
        />
      ) : (
        <Input
          id={name}
          type={type}
          {...inputProps}
        />
      )}

      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription id={`${name}-error`}>
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}