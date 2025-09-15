// Comprehensive input validation and sanitization utilities

export interface ValidationResult<T = string> {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: T;
}

// Phone number validation for Senegal (+221) and US (+1)
export function validatePhoneNumber(phone: string): ValidationResult {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, errors: ['Phone number is required'] };
  }

  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Check for valid formats
  const senegalRegex = /^\+221[0-9]{9}$/; // +221 followed by 9 digits
  const usRegex = /^\+1[0-9]{10}$/; // +1 followed by 10 digits
  
  if (senegalRegex.test(cleaned)) {
    return { isValid: true, errors: [], sanitizedValue: cleaned };
  }
  
  if (usRegex.test(cleaned)) {
    return { isValid: true, errors: [], sanitizedValue: cleaned };
  }
  
  // Check if it's a valid format without country code
  const digitsOnly = cleaned.replace(/^\+/, '');
  if (digitsOnly.length >= 9 && digitsOnly.length <= 11) {
    // Auto-add country code based on length
    if (digitsOnly.length === 9) {
      return { isValid: true, errors: [], sanitizedValue: `+221${digitsOnly}` };
    } else if (digitsOnly.length === 10) {
      return { isValid: true, errors: [], sanitizedValue: `+1${digitsOnly}` };
    }
  }
  
  return { 
    isValid: false, 
    errors: ['Invalid phone number format. Use +221XXXXXXXXX for Senegal or +1XXXXXXXXXX for US'] 
  };
}

// Name validation
export function validateName(name: string): ValidationResult {
  if (!name || typeof name !== 'string') {
    return { isValid: false, errors: ['Name is required'] };
  }

  const trimmed = name.trim();
  
  if (trimmed.length < 2) {
    return { isValid: false, errors: ['Name must be at least 2 characters long'] };
  }
  
  if (trimmed.length > 100) {
    return { isValid: false, errors: ['Name must be less than 100 characters'] };
  }
  
  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-ZÀ-ÿ\s\-']+$/;
  if (!nameRegex.test(trimmed)) {
    return { isValid: false, errors: ['Name contains invalid characters'] };
  }
  
  return { isValid: true, errors: [], sanitizedValue: trimmed };
}

// Email validation
export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { isValid: false, errors: ['Email is required'] };
  }

  const trimmed = email.trim().toLowerCase();
  
  if (trimmed.length > 254) {
    return { isValid: false, errors: ['Email is too long'] };
  }
  
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, errors: ['Invalid email format'] };
  }
  
  return { isValid: true, errors: [], sanitizedValue: trimmed };
}

// Password validation
export function validatePassword(password: string): ValidationResult {
  if (!password || typeof password !== 'string') {
    return { isValid: false, errors: ['Password is required'] };
  }

  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password is too long');
  }
  
  if (!/(?=.*[a-zA-Z])/.test(password)) {
    errors.push('Password must contain at least one letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  // Check for common weak passwords
  const commonPasswords = ['password', '123456', '123456789', 'qwerty', 'abc123'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common');
  }
  
  return { 
    isValid: errors.length === 0, 
    errors, 
    sanitizedValue: password 
  };
}

// Service type validation
export function validateServiceType(serviceType: string): ValidationResult {
  if (!serviceType || typeof serviceType !== 'string') {
    return { isValid: false, errors: ['Service type is required'] };
  }

  const trimmed = serviceType.trim();
  
  if (trimmed.length < 2) {
    return { isValid: false, errors: ['Service type must be at least 2 characters long'] };
  }
  
  if (trimmed.length > 50) {
    return { isValid: false, errors: ['Service type must be less than 50 characters'] };
  }
  
  // Check for valid characters (letters, numbers, spaces, hyphens)
  const serviceRegex = /^[a-zA-Z0-9\s\-]+$/;
  if (!serviceRegex.test(trimmed)) {
    return { isValid: false, errors: ['Service type contains invalid characters'] };
  }
  
  return { isValid: true, errors: [], sanitizedValue: trimmed };
}

// Location validation
export function validateLocation(location: string): ValidationResult {
  if (!location || typeof location !== 'string') {
    return { isValid: true, errors: [], sanitizedValue: '' }; // Location is optional
  }

  const trimmed = location.trim();
  
  if (trimmed.length > 100) {
    return { isValid: false, errors: ['Location must be less than 100 characters'] };
  }
  
  // Check for valid characters (letters, numbers, spaces, hyphens, commas)
  const locationRegex = /^[a-zA-Z0-9\s\-,]+$/;
  if (!locationRegex.test(trimmed)) {
    return { isValid: false, errors: ['Location contains invalid characters'] };
  }
  
  return { isValid: true, errors: [], sanitizedValue: trimmed };
}

// HTML sanitization to prevent XSS
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Remove HTML tags
  const withoutTags = input.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities
  const decoded = withoutTags
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
  
  // Remove any remaining potentially dangerous characters
  return decoded.replace(/[<>]/g, '');
}

// Validate and sanitize text input
export function validateTextInput(input: string, fieldName: string, maxLength: number = 1000): ValidationResult {
  if (!input || typeof input !== 'string') {
    return { isValid: false, errors: [`${fieldName} is required`] };
  }

  const sanitized = sanitizeHtml(input.trim());
  
  if (sanitized.length === 0) {
    return { isValid: false, errors: [`${fieldName} cannot be empty`] };
  }
  
  if (sanitized.length > maxLength) {
    return { isValid: false, errors: [`${fieldName} must be less than ${maxLength} characters`] };
  }
  
  return { isValid: true, errors: [], sanitizedValue: sanitized };
}

// Validate UUID format
export function validateUUID(uuid: string): ValidationResult {
  if (!uuid || typeof uuid !== 'string') {
    return { isValid: false, errors: ['UUID is required'] };
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(uuid)) {
    return { isValid: false, errors: ['Invalid UUID format'] };
  }
  
  return { isValid: true, errors: [], sanitizedValue: uuid };
}

// Validate array of strings (for qualities, watchFor, etc.)
export function validateStringArray(arr: any, fieldName: string, maxItems: number = 10): ValidationResult<string[]> {
  if (!Array.isArray(arr)) {
    return { isValid: false, errors: [`${fieldName} must be an array`] };
  }
  
  if (arr.length > maxItems) {
    return { isValid: false, errors: [`${fieldName} cannot have more than ${maxItems} items`] };
  }
  
  const errors: string[] = [];
  const sanitizedItems: string[] = [];
  
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    if (typeof item !== 'string') {
      errors.push(`${fieldName}[${i}] must be a string`);
      continue;
    }
    
    const sanitized = sanitizeHtml(item.trim());
    if (sanitized.length === 0) {
      errors.push(`${fieldName}[${i}] cannot be empty`);
      continue;
    }
    
    if (sanitized.length > 50) {
      errors.push(`${fieldName}[${i}] must be less than 50 characters`);
      continue;
    }
    
    sanitizedItems.push(sanitized);
  }
  
  return { 
    isValid: errors.length === 0, 
    errors, 
    sanitizedValue: sanitizedItems 
  };
}
