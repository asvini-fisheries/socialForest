/**
 * Maps Supabase Auth error codes to user-friendly messages.
 * Prevents raw "{}" or empty errors from reaching the login UI.
 */

interface AuthErrorLike {
  message?: string;
  code?: string;
  status?: number;
  name?: string;
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  otp_expired: 'Verification code has expired. Please request a new code.',
  otp_disabled: 'Login with verification code is disabled. Contact your administrator.',
  invalid_otp: 'Invalid verification code. Please check and try again.',
  over_email_send_rate_limit: 'Too many emails sent. Please wait a few minutes and try again.',
  over_sms_send_rate_limit: 'Too many SMS sent. Please wait a few minutes and try again.',
  user_not_found: 'No account found with this email or mobile. Contact your administrator.',
  email_not_confirmed: 'Please verify your email address before signing in.',
  phone_not_confirmed: 'Please verify your mobile number before signing in.',
  signup_disabled: 'New sign-ups are disabled. Contact your administrator.',
  unexpected_failure: 'Authentication service error. Please try again later.',
  validation_failed: 'Invalid input. Please check your email or mobile number.',
  bad_code_verifier: 'Verification session expired. Please request a new code.',
  session_not_found: 'Session expired. Please sign in again.',
  email_address_invalid: 'This email address is not allowed. Use your registered work email.',
  email_address_not_authorized: 'This email is not authorized to sign in.',
  user_banned: 'Your account has been suspended. Contact your administrator.',
};

export function getAuthErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!error) return fallback;

  if (typeof error === 'string') {
    const trimmed = error.trim();
    if (trimmed && trimmed !== '{}') return trimmed;
    return fallback;
  }

  const authError = error as AuthErrorLike;
  const code = authError.code;
  const message = authError.message?.trim();

  if (code && AUTH_ERROR_MESSAGES[code]) {
    return AUTH_ERROR_MESSAGES[code];
  }

  if (message && message !== '{}' && message !== '[object Object]') {
    // Supabase sometimes returns JSON string in message
    if (message.startsWith('{')) {
      try {
        const parsed = JSON.parse(message) as { msg?: string; message?: string; error_code?: string };
        if (parsed.error_code && AUTH_ERROR_MESSAGES[parsed.error_code]) {
          return AUTH_ERROR_MESSAGES[parsed.error_code];
        }
        if (parsed.msg) return parsed.msg;
        if (parsed.message) return parsed.message;
      } catch {
        // use raw message below if parse fails
      }
    }
    return message;
  }

  if (authError.name === 'AuthRetryableFetchError') {
    return 'Unable to reach authentication service. Check your connection or try email login.';
  }

  return fallback;
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(local.length - 2, 2))}@${domain}`;
}
