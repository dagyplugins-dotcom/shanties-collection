// lib/mpesa.js

const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const PASSKEY = process.env.MPESA_PASSKEY;
const SHORTCODE = process.env.MPESA_SHORTCODE;
const ENVIRONMENT = process.env.MPESA_ENVIRONMENT || 'sandbox'; // 'sandbox' or 'production'

const BASE_URL = ENVIRONMENT === 'production' 
  ? 'https://api.safaricom.co.ke' 
  : 'https://sandbox.safaricom.co.ke';

// Helper to format phone number to 2547XXXXXXXX
export function formatPhoneNumber(phone) {
  let cleaned = phone.replace(/\D/g, ''); // Remove non-digits
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.slice(1);
  }
  if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
    cleaned = '254' + cleaned;
  }
  return cleaned;
}

// 1. Get OAuth Access Token
export async function getAccessToken() {
  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
  
  const response = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.errorMessage || 'Failed to get access token');
  return data.access_token;
}

// 2. Generate Password and Timestamp
export function generatePassword() {
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');
  return { password, timestamp };
}

// 3. Initiate STK Push
export async function initiateSTKPush({ phone, amount, accountReference, transactionDesc, callbackUrl }) {
  const token = await getAccessToken();
  const { password, timestamp } = generatePassword();
  const formattedPhone = formatPhoneNumber(phone);

  const payload = {
    BusinessShortCode: SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.round(amount), // Ensure it's an integer
    PartyA: formattedPhone,
    PartyB: SHORTCODE,
    PhoneNumber: formattedPhone,
    CallBackURL: callbackUrl,
    AccountReference: accountReference,
    TransactionDesc: transactionDesc,
  };

  const response = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.errorMessage || 'STK Push failed');
  return data;
}