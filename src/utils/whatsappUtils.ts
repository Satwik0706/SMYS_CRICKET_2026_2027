/**
 * WhatsApp Integration Utilities
 * Handles phone formatting, device detection (Desktop PC vs Mobile),
 * link generation (WhatsApp Web vs Mobile App/API), and message composition.
 */

export interface WhatsAppNoticeOptions {
  fullName: string;
  regNumber: string;
  type: 'rejection' | 'correction';
  reason: string;
  tournamentTitle?: string;
  committeeName?: string;
}

/**
 * Normalizes a phone number for WhatsApp deep-linking.
 * WhatsApp requires digits only with country code (no '+', no '-', no spaces).
 * Defaulting to India (country code 91) for 10-digit inputs.
 */
export const formatWhatsAppPhoneNumber = (rawPhone: string): string => {
  if (!rawPhone) return '';
  // Strip all non-digit characters
  let digits = rawPhone.replace(/\D/g, '');

  if (!digits) return '';

  // If number starts with 0 and is 11 digits (e.g. 09876543210), strip the leading 0
  if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }

  // If standard 10-digit Indian mobile number, prefix with 91
  if (digits.length === 10) {
    digits = '91' + digits;
  }

  return digits;
};

/**
 * Detects whether the current device/browser is mobile or desktop
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  const ua = navigator.userAgent || '';
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);
};

/**
 * Formats standard rejection or correction message for the player
 */
export const buildWhatsAppMessage = (options: WhatsAppNoticeOptions): string => {
  const {
    fullName,
    regNumber,
    type,
    reason,
    tournamentTitle = 'SMYS INTRA HOSTEL CRICKET AUCTION 2026',
    committeeName = '75th Sathpantha Tournament Committee',
  } = options;

  const isCorrection = type === 'correction';

  if (isCorrection) {
    return (
      `🏏 *${tournamentTitle}*\n` +
      `*${committeeName}*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Hello *${fullName}*,\n\n` +
      `We are reviewing your player registration for the upcoming cricket auction (*Reg ID: ${regNumber}*).\n\n` +
      `⚠️ *STATUS: CORRECTION SUGGESTED / REQUIRED*\n\n` +
      `📋 *Details / Admin Note:*\n` +
      `"${reason.trim()}"\n\n` +
      `👉 *Next Steps:*\n` +
      `You can check your status, edit your ratings and player info, and submit for recheck directly on our Player Correction Portal:\n` +
      `🔗 https://smys-cricket-2026-2027.vercel.app/correction\n\n` +
      `Alternatively, reply to this message with your updated details.\n\n` +
      `Best regards,\n` +
      `*Chief Administrator & Auction Committee*`
    );
  }

  return (
    `🏏 *${tournamentTitle}*\n` +
    `*${committeeName}*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Hello *${fullName}*,\n\n` +
    `Regarding your player registration for the SMYS Cricket Tournament (*Reg ID: ${regNumber}*):\n\n` +
    `❌ *STATUS: REGISTRATION REJECTED*\n\n` +
    `📋 *Reason / Details:*\n` +
    `"${reason.trim()}"\n\n` +
    `👉 *Review & Re-submit:*\n` +
    `You can review your status and update your registration details on the Player Correction Portal:\n` +
    `🔗 https://smys-cricket-2026-2027.vercel.app/correction\n\n` +
    `If you believe this decision was made in error, please reply to this number or meet the committee desk.\n\n` +
    `Best regards,\n` +
    `*Chief Administrator & Auction Committee*`
  );
};

/**
 * Constructs the appropriate WhatsApp URL based on device or explicit target
 */
export const getWhatsAppUrl = (
  rawPhone: string,
  message: string,
  forceTarget?: 'web' | 'mobile'
): string => {
  const cleanPhone = formatWhatsAppPhoneNumber(rawPhone);
  const encodedText = encodeURIComponent(message);

  const useMobile = forceTarget ? forceTarget === 'mobile' : isMobileDevice();

  if (useMobile) {
    // Mobile deep-link / universal link (opens WhatsApp app directly on iOS & Android)
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
  }

  // Desktop PC -> WhatsApp Web
  return `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
};

/**
 * Opens WhatsApp in a new tab/window
 */
export const openWhatsAppNotice = (
  rawPhone: string,
  message: string,
  forceTarget?: 'web' | 'mobile'
): void => {
  const url = getWhatsAppUrl(rawPhone, message, forceTarget);
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};
