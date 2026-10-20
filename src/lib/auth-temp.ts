/**
 * Temporary login helpers while email/SMS OTP delivery is unavailable.
 * Remove or disable once real OTP providers are configured.
 */

export const TEMP_DEFAULT_OTP = '123456';

export function isTempDefaultOtp(otp: string): boolean {
  return otp.trim() === TEMP_DEFAULT_OTP;
}
