import { useState, useCallback, useMemo } from 'react';

// Validation rule types
type ValidationRule<T> = {
  validate: (value: T, allValues: Record<string, unknown>) => boolean;
  message: string;
};

type FieldValidation<T> = {
  required?: boolean | string;
  minLength?: { value: number; message?: string };
  maxLength?: { value: number; message?: string };
  min?: { value: number; message?: string };
  max?: { value: number; message?: string };
  pattern?: { value: RegExp; message?: string };
  email?: boolean | string;
  url?: boolean | string;
  custom?: ValidationRule<T>[];
};

type FormSchema<T extends Record<string, unknown>> = {
  [K in keyof T]?: FieldValidation<T[K]>;
};

type FormErrors<T> = {
  [K in keyof T]?: string;
};

type FormTouched<T> = {
  [K in keyof T]?: boolean;
};

interface UseFormOptions<T extends Record<string, unknown>> {
  initialValues: T;
  validationSchema?: FormSchema<T>;
  onSubmit?: (values: T) => void | Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

interface FormState<T extends Record<string, unknown>> {
  values: T;
  errors: FormErrors<T>;
  touched: FormTouched<T>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

// Built-in validators
const validators = {
  required: (value: unknown): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  },
  email: (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },
  url: (value: string): boolean => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  minLength: (value: string | unknown[], min: number): boolean => {
    return value.length >= min;
  },
  maxLength: (value: string | unknown[], max: number): boolean => {
    return value.length <= max;
  },
  min: (value: number, min: number): boolean => {
    return value >= min;
  },
  max: (value: number, max: number): boolean => {
    return value <= max;
  },
  pattern: (value: string, pattern: RegExp): boolean => {
    return pattern.test(value);
  },
};

/**
 * Form validation hook with support for complex validation schemas
 */
export function useForm<T extends Record<string, unknown>>({
  initialValues,
  validationSchema = {},
  onSubmit,
  validateOnChange = true,
  validateOnBlur = true,
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [touched, setTouched] = useState<FormTouched<T>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate a single field
  const validateField = useCallback(
    (name: keyof T, value: unknown): string | undefined => {
      const rules = validationSchema[name];
      if (!rules) return undefined;

      // Required
      if (rules.required) {
        if (!validators.required(value)) {
          return typeof rules.required === 'string'
            ? rules.required
            : `This field is required`;
        }
      }

      // Only validate other rules if value exists
      if (!validators.required(value)) return undefined;

      // Email
      if (rules.email && typeof value === 'string') {
        if (!validators.email(value)) {
          return typeof rules.email === 'string'
            ? rules.email
            : 'Invalid email address';
        }
      }

      // URL
      if (rules.url && typeof value === 'string') {
        if (!validators.url(value)) {
          return typeof rules.url === 'string'
            ? rules.url
            : 'Invalid URL';
        }
      }

      // Min length
      if (rules.minLength && (typeof value === 'string' || Array.isArray(value))) {
        if (!validators.minLength(value, rules.minLength.value)) {
          return rules.minLength.message || 
            `Must be at least ${rules.minLength.value} characters`;
        }
      }

      // Max length
      if (rules.maxLength && (typeof value === 'string' || Array.isArray(value))) {
        if (!validators.maxLength(value, rules.maxLength.value)) {
          return rules.maxLength.message || 
            `Must be at most ${rules.maxLength.value} characters`;
        }
      }

      // Min
      if (rules.min && typeof value === 'number') {
        if (!validators.min(value, rules.min.value)) {
          return rules.min.message || `Must be at least ${rules.min.value}`;
        }
      }

      // Max
      if (rules.max && typeof value === 'number') {
        if (!validators.max(value, rules.max.value)) {
          return rules.max.message || `Must be at most ${rules.max.value}`;
        }
      }

      // Pattern
      if (rules.pattern && typeof value === 'string') {
        if (!validators.pattern(value, rules.pattern.value)) {
          return rules.pattern.message || 'Invalid format';
        }
      }

      // Custom validators
      if (rules.custom) {
        for (const rule of rules.custom) {
          if (!rule.validate(value as T[keyof T], values as Record<string, unknown>)) {
            return rule.message;
          }
        }
      }

      return undefined;
    },
    [validationSchema, values]
  );

  // Validate all fields
  const validateAll = useCallback((): FormErrors<T> => {
    const newErrors: FormErrors<T> = {};
    
    for (const key of Object.keys(validationSchema) as (keyof T)[]) {
      const error = validateField(key, values[key]);
      if (error) {
        newErrors[key] = error;
      }
    }
    
    return newErrors;
  }, [validateField, validationSchema, values]);

  // Handle field change
  const handleChange = useCallback(
    (name: keyof T, value: unknown) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      
      if (validateOnChange) {
        const error = validateField(name, value);
        setErrors((prev) => ({ ...prev, [name]: error }));
      }
    },
    [validateField, validateOnChange]
  );

  // Handle field blur
  const handleBlur = useCallback(
    (name: keyof T) => {
      setTouched((prev) => ({ ...prev, [name]: true }));
      
      if (validateOnBlur) {
        const error = validateField(name, values[name]);
        setErrors((prev) => ({ ...prev, [name]: error }));
      }
    },
    [validateField, validateOnBlur, values]
  );

  // Get input props for a field
  const getFieldProps = useCallback(
    (name: keyof T) => ({
      name: name as string,
      value: values[name],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const value = e.target.type === 'checkbox' 
          ? (e.target as HTMLInputElement).checked 
          : e.target.value;
        handleChange(name, value);
      },
      onBlur: () => handleBlur(name),
    }),
    [handleChange, handleBlur, values]
  );

  // Set field value programmatically
  const setFieldValue = useCallback(
    (name: keyof T, value: unknown) => {
      handleChange(name, value);
    },
    [handleChange]
  );

  // Set field error programmatically
  const setFieldError = useCallback(
    (name: keyof T, error: string | undefined) => {
      setErrors((prev) => ({ ...prev, [name]: error }));
    },
    []
  );

  // Reset form
  const reset = useCallback(
    (newValues?: T) => {
      setValues(newValues || initialValues);
      setErrors({});
      setTouched({});
      setIsSubmitting(false);
    },
    [initialValues]
  );

  // Handle submit
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      // Mark all fields as touched
      const allTouched: FormTouched<T> = {};
      for (const key of Object.keys(values) as (keyof T)[]) {
        allTouched[key] = true;
      }
      setTouched(allTouched);

      // Validate all fields
      const validationErrors = validateAll();
      setErrors(validationErrors);

      // If errors, don't submit
      if (Object.keys(validationErrors).length > 0) {
        return;
      }

      // Submit
      if (onSubmit) {
        setIsSubmitting(true);
        try {
          await onSubmit(values);
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    [onSubmit, validateAll, values]
  );

  // Computed values
  const isValid = useMemo(() => {
    return Object.keys(errors).every((key) => !errors[key as keyof T]);
  }, [errors]);

  const isDirty = useMemo(() => {
    return Object.keys(values).some((key) => {
      const k = key as keyof T;
      return values[k] !== initialValues[k];
    });
  }, [values, initialValues]);

  const state: FormState<T> = {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,
  };

  return {
    ...state,
    handleChange,
    handleBlur,
    handleSubmit,
    getFieldProps,
    setFieldValue,
    setFieldError,
    reset,
    validateField,
    validateAll,
  };
}

/**
 * Simple field-level validation hook
 */
export function useFieldValidation<T>(
  value: T,
  rules: FieldValidation<T>
) {
  const [error, setError] = useState<string | undefined>();
  const [touched, setTouched] = useState(false);

  const validate = useCallback(() => {
    // Required
    if (rules.required && !validators.required(value)) {
      const msg = typeof rules.required === 'string' 
        ? rules.required 
        : 'This field is required';
      setError(msg);
      return false;
    }

    // Email
    if (rules.email && typeof value === 'string' && value) {
      if (!validators.email(value)) {
        const msg = typeof rules.email === 'string' 
          ? rules.email 
          : 'Invalid email address';
        setError(msg);
        return false;
      }
    }

    setError(undefined);
    return true;
  }, [rules, value]);

  const handleBlur = useCallback(() => {
    setTouched(true);
    validate();
  }, [validate]);

  return {
    error: touched ? error : undefined,
    touched,
    validate,
    handleBlur,
    setTouched,
  };
}

/**
 * Common validation patterns
 */
export const validationPatterns = {
  phone: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  username: /^[a-zA-Z0-9_]{3,20}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  numeric: /^\d+$/,
  hex: /^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/,
};
