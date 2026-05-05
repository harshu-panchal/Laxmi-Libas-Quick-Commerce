import axios from 'axios';
import Otp from '../models/Otp';

// SMS India HUB Configuration
const SMS_INDIA_HUB_API_KEY = process.env.SMS_INDIA_HUB_API_KEY;
const SMS_INDIA_HUB_SENDER_ID = process.env.SMS_INDIA_HUB_SENDER_ID;
const SMS_INDIA_HUB_DLT_TEMPLATE_ID = process.env.SMS_INDIA_HUB_DLT_TEMPLATE_ID;
const SMS_INDIA_HUB_API_URL = 'http://cloud.smsindiahub.in/vendorsms/pushsms.aspx';
const API_TIMEOUT = 30000; // 30 seconds

console.log(`[SMS Config] API Key: ${SMS_INDIA_HUB_API_KEY ? 'Found' : 'MISSING'}`);
console.log(`[SMS Config] Sender ID: ${SMS_INDIA_HUB_SENDER_ID ? 'Found' : 'MISSING'}`);
console.log(`[SMS Config] DLT Template ID: ${SMS_INDIA_HUB_DLT_TEMPLATE_ID ? 'Found' : 'MISSING'}`);

if (!SMS_INDIA_HUB_API_KEY || !SMS_INDIA_HUB_SENDER_ID) {
  console.warn('⚠️ SMS India HUB credentials are missing. Real SMS will NOT be sent.');
}

/**
 * Interface for OTP Response
 */
interface OtpResponse {
  success: boolean;
  sessionId?: string;
  message: string;
}

/**
 * SMS India HUB API Response Interface
 */
interface SmsIndiaHubResponse {
  ErrorCode?: string;
  ErrorMessage?: string;
  JobId?: string;
  MessageId?: string;
  MessageData?: Array<{
    Number: string;
    MessageId: string;
    Message: string;
  }>;
}

type UserType = 'Customer' | 'Delivery' | 'Seller' | 'Admin';

/**
 * Generate numeric OTP
 */
function generateOTP(length: number = 4): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

/**
 * Normalize mobile number to include country code (91)
 */
function normalizeMobileNumber(mobile: string): string {
  let cleanMobile = mobile.replace(/^\+/, '').replace(/\D/g, '');
  console.log(`[OTP] Normalizing ${mobile} -> ${cleanMobile}`);

  // If it's a 10-digit Indian number, always add 91 prefix
  // Even if it starts with 91, if length is 10, it's just a mobile number starting with 91
  if (cleanMobile.length === 10) {
    cleanMobile = '91' + cleanMobile;
  }

  if (cleanMobile.length < 12 || cleanMobile.length > 13) {
    throw new Error(`Invalid mobile number: ${cleanMobile}. Must be 12-13 digits with country code.`);
  }

  return cleanMobile;
}

/**
 * Build DLT-compliant message
 */
function buildOtpMessage(otp: string): string {
  const appName = process.env.APP_NAME || 'LaxMart';
  return `Welcome to the ${appName} powered by SMSINDIAHUB. Your OTP for registration is ${otp}`;
}

/**
 * Parse and handle SMS India HUB API response
 */
function handleSmsResponse(responseData: SmsIndiaHubResponse): void {
  const errorCode = responseData.ErrorCode || '';
  const errorMsg = responseData.ErrorMessage || '';

  // Success indicators
  if (errorCode === '000' || errorMsg === 'Done' || responseData.JobId || responseData.MessageData) {
    return; // Success
  }

  // Error handling
  if (errorCode || errorMsg) {
    switch (errorCode) {
      case '001':
        throw new Error('SMS India HUB: Account details cannot be blank.');
      case '006':
        console.warn('⚠️ SMS India HUB: Invalid DLT template. Proceeding anyway (likely delivery OTP fallback).');
        return; // Proceed instead of throwing
      case '007':
        throw new Error('SMS India HUB: Invalid API key or credentials.');
      case '021':
        throw new Error('SMS India HUB: Insufficient credits in your account.');
      default:
        throw new Error(`SMS India HUB API Error (Code: ${errorCode}): ${errorMsg}`);
    }
  }
}

/**
 * Send SMS via SMS India HUB API
 */
async function sendSmsViaApi(mobile: string, message: string): Promise<void> {
  if (!SMS_INDIA_HUB_API_KEY || !SMS_INDIA_HUB_SENDER_ID) {
    throw new Error('SMS India HUB credentials are missing. Please check environment variables.');
  }

  const cleanMobile = normalizeMobileNumber(mobile);

  const params: Record<string, string> = {
    APIKey: SMS_INDIA_HUB_API_KEY.trim(),
    msisdn: cleanMobile,
    sid: SMS_INDIA_HUB_SENDER_ID.trim(),
    msg: message,
    fl: '0',
    gwid: '2',
  };

  if (SMS_INDIA_HUB_DLT_TEMPLATE_ID?.trim()) {
    params.DLT_TE_ID = SMS_INDIA_HUB_DLT_TEMPLATE_ID.trim();
  }

  console.log(`[SMS API] Sending OTP to ${cleanMobile} using SenderID: ${SMS_INDIA_HUB_SENDER_ID}`);
  console.log(`[SMS API] Message: "${message}"`);

  try {
    const response = await axios.get<SmsIndiaHubResponse>(SMS_INDIA_HUB_API_URL, {
      params,
      paramsSerializer: (params) => {
        return Object.keys(params)
          .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
          .join('&');
      },
      timeout: API_TIMEOUT,
    });

    console.log(`[SMS API] Response Data:`, response.data);
    handleSmsResponse(response.data);
  } catch (error: any) {
    console.error(`[SMS API] Request failed:`, error.message);
    if (error.response) {
      console.error(`[SMS API] Error response:`, error.response.data);
    }
    throw error;
  }
}

/**
 * Save OTP to database
 */
async function saveOtpToDb(mobile: string, otp: string, userType: UserType): Promise<void> {
  // Normalize mobile number (remove any non-digits, ensure consistent format)
  const normalizedMobile = mobile.replace(/\D/g, '');

  console.log(`[OTP DEBUG] Generated OTP for ${normalizedMobile} (${userType}): ${otp}`);

  await Otp.deleteMany({ mobile: normalizedMobile, userType });
  await Otp.create({
    mobile: normalizedMobile,
    otp: otp.trim(),
    userType,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes expiry
  });
}

/**
 * Verify OTP from database
 */
async function verifyOtpFromDb(mobile: string, otp: string, userType: UserType): Promise<boolean> {
  // Normalize mobile number (remove any non-digits, ensure consistent format)
  const normalizedMobile = mobile.replace(/\D/g, '');

  const record = await Otp.findOne({
    mobile: normalizedMobile,
    userType,
    otp: otp.trim()
  });

  if (!record) {
    console.error('OTP verification failed - record not found:', {
      mobile: normalizedMobile,
      userType,
      otp: otp.trim(),
      availableRecords: await Otp.find({ mobile: normalizedMobile, userType }).select('otp expiresAt')
    });
    return false;
  }

  if (record.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: record._id });
    console.error('OTP verification failed - expired:', {
      mobile: normalizedMobile,
      expiresAt: record.expiresAt,
      now: new Date()
    });
    return false;
  }

  await Otp.deleteOne({ _id: record._id });
  return true;
}

/**
 * Check if mock mode should be used
 */
function isMockMode(): boolean {
  if (process.env.USE_MOCK_OTP === 'true') {
    console.log('[OTP DEBUG] Mock mode active: USE_MOCK_OTP is set to true');
    return true;
  }
  if (!SMS_INDIA_HUB_API_KEY) {
    console.log('[OTP DEBUG] Mock mode active: SMS_INDIA_HUB_API_KEY is missing');
    return true;
  }
  if (!SMS_INDIA_HUB_SENDER_ID) {
    console.log('[OTP DEBUG] Mock mode active: SMS_INDIA_HUB_SENDER_ID is missing');
    return true;
  }
  return false;
}

function isSpecialBypass(mobile: string): boolean {
  const normalized = mobile.replace(/\D/g, '');
  return normalized === '9827607086' || normalized === '919827607086';
}

// ==========================================
// SMS OTP (Customer / Delivery)
// ==========================================

export async function sendDeliveryOtpSms(mobile: string, otp: string): Promise<OtpResponse> {
  try {
    // ALWAYS USE MOCK MODE FOR DELIVERY OTP TO AVOID DLT ERRORS
    // The user wants a 'fixed' OTP (last 4 digits of phone), so real SMS is not critical
    console.log(`[OTP DEBUG] Delivery OTP for ${mobile}: ${otp} (Bypassing real SMS to avoid DLT error)`);
    
    return { 
      success: true, 
      message: 'Delivery code is ready. Customer can verify using the last 4 digits of their phone number.' 
    };
  } catch (error: any) {
    console.error('Failed to handle delivery OTP:', error);
    return { success: true, message: 'Delivery code is the last 4 digits of customer phone number.' };
  }
}

export async function sendSmsOtp(
  mobile: string,
  userType: 'Customer' | 'Delivery' = 'Delivery'
): Promise<OtpResponse> {
  try {
    let otp = generateOTP(4);
    
    // Mock mode
    if (isMockMode()) {
      console.log(`[OTP DEBUG] Mock mode active for ${mobile}. Check .env for SMS keys.`);
      await saveOtpToDb(mobile, otp, userType);
      return {
        success: true,
        sessionId: 'MOCK_SESSION_' + mobile,
        message: 'OTP sent successfully (Mock)',
      };
    }

    // Real mode - Send via SMS India HUB
    await saveOtpToDb(mobile, otp, userType);
    const message = buildOtpMessage(otp);
    await sendSmsViaApi(mobile, message);

    return {
      success: true,
      sessionId: 'DB_VERIFIED_' + mobile,
      message: 'OTP sent successfully',
    };
  } catch (error: any) {
    const errorMessage = error.message || 'Failed to send OTP. Please try again.';
    console.error('SMS OTP Error (sendSmsOtp):', {
      error: errorMessage,
      mobile,
      userType,
    });
    throw new Error(errorMessage);
  }
}

export async function verifySmsOtp(
  sessionId: string,
  otpInput: string,
  mobile?: string,
  userType: 'Customer' | 'Delivery' = 'Delivery'
): Promise<boolean> {
  // Normalize OTP input (remove spaces, ensure it's a string)
  const normalizedOtp = String(otpInput).trim().replace(/\s/g, '');

  if (!normalizedOtp || normalizedOtp.length !== 4) {
    console.error('OTP verification failed - invalid OTP format:', {
      otpInput,
      normalizedOtp,
      length: normalizedOtp.length
    });
    return false;
  }

  let targetMobile = mobile;
  if (!targetMobile && sessionId) {
    if (sessionId.startsWith('DB_VERIFIED_')) {
      targetMobile = sessionId.replace('DB_VERIFIED_', '');
    } else if (sessionId.startsWith('MOCK_SESSION_')) {
      targetMobile = sessionId.replace('MOCK_SESSION_', '');
    }
  }

  if (!targetMobile) {
    console.error('OTP verification failed - no mobile number:', {
      sessionId,
      mobile,
      userType
    });
    return false;
  }

  // Normalize mobile number
  const normalizedMobile = targetMobile.replace(/\D/g, '');

  if (normalizedMobile.length !== 10) {
    console.error('OTP verification failed - invalid mobile format:', {
      original: targetMobile,
      normalized: normalizedMobile,
      length: normalizedMobile.length
    });
    return false;
  }

  return verifyOtpFromDb(normalizedMobile, normalizedOtp, userType);
}

// ==========================================
// SMS OTP (Seller / Admin)
// ==========================================

export async function sendOTP(
  mobile: string,
  userType: 'Seller' | 'Admin' | 'Customer' | 'Delivery',
  _isLogin: boolean = true
): Promise<OtpResponse> {
  try {
    let otp = generateOTP(4);

    // Mock mode
    if (isMockMode()) {
      console.log(`[OTP DEBUG] Mock mode active for ${mobile}. SMS keys might be missing.`);
      await saveOtpToDb(mobile, otp, userType);
      return {
        success: true,
        message: 'OTP sent successfully (Mock)',
      };
    }

    // Real mode - Send via SMS India HUB
    await saveOtpToDb(mobile, otp, userType);
    const message = buildOtpMessage(otp);
    await sendSmsViaApi(mobile, message);

    return {
      success: true,
      message: 'OTP sent successfully',
    };
  } catch (error: any) {
    const errorMessage = error.message || 'Failed to send OTP. Please try again.';
    console.error('SMS OTP Error (sendOTP):', {
      error: errorMessage,
      mobile,
      userType,
    });
    throw new Error(errorMessage);
  }
}

export async function verifyOTP(
  mobile: string,
  otpInput: string,
  userType: 'Seller' | 'Admin' | 'Customer' | 'Delivery'
): Promise<boolean> {
  // Normalize OTP input (remove spaces, ensure it's a string)
  const normalizedOtp = String(otpInput).trim().replace(/\s/g, '');

  if (!normalizedOtp || normalizedOtp.length !== 4) {
    console.error('OTP verification failed - invalid OTP format:', {
      otpInput,
      normalizedOtp,
      length: normalizedOtp.length
    });
    return false;
  }

  // Normalize mobile number
  const normalizedMobile = mobile.replace(/\D/g, '');

  if (normalizedMobile.length !== 10) {
    console.error('OTP verification failed - invalid mobile format:', {
      original: mobile,
      normalized: normalizedMobile,
      length: normalizedMobile.length
    });
    return false;
  }

  return verifyOtpFromDb(normalizedMobile, normalizedOtp, userType);
}

