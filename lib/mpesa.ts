// @ts-nocheck

// M-Pesa Configuration
// You'll need to register on Safaricom Daraja API portal
// https://developer.safaricom.co.ke

const MPESA_CONFIG = {
  // For testing, use sandbox credentials
  // For production, use your actual credentials
  consumerKey: process.env.NEXT_PUBLIC_MPESA_CONSUMER_KEY || '',
  consumerSecret: process.env.NEXT_PUBLIC_MPESA_CONSUMER_SECRET || '',
  passkey: process.env.NEXT_PUBLIC_MPESA_PASSKEY || '',
  shortCode: process.env.NEXT_PUBLIC_MPESA_SHORT_CODE || '174379',
  callbackUrl: process.env.NEXT_PUBLIC_MPESA_CALLBACK_URL || 'https://your-domain.com/api/mpesa/callback',
  environment: process.env.NEXT_PUBLIC_MPESA_ENVIRONMENT || 'sandbox', // 'sandbox' or 'production'
};

// For demo purposes, we'll simulate M-Pesa payments
// When you're ready, replace with actual API calls to Safaricom Daraja

export class MpesaService {
  // Simulate M-Pesa deposit
  static async deposit(phoneNumber: string, amount: number): Promise<{ success: boolean; message: string; reference?: string }> {
    // Simulate API call
    console.log(`💰 Simulating M-Pesa deposit: ${phoneNumber} -> $${amount}`);
    
    // Simulate success after 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Random success/failure for demo
    const success = Math.random() > 0.1; // 90% success rate
    
    if (success) {
      const reference = `MP${Date.now()}`;
      return {
        success: true,
        message: `Successfully deposited $${amount} from ${phoneNumber}`,
        reference: reference
      };
    } else {
      return {
        success: false,
        message: 'M-Pesa transaction failed. Please try again.'
      };
    }
  }

  // Simulate M-Pesa withdrawal
  static async withdraw(phoneNumber: string, amount: number): Promise<{ success: boolean; message: string; reference?: string }> {
    console.log(`💰 Simulating M-Pesa withdrawal: ${phoneNumber} -> $${amount}`);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const success = Math.random() > 0.1;
    
    if (success) {
      const reference = `MPW${Date.now()}`;
      return {
        success: true,
        message: `Successfully withdrew $${amount} to ${phoneNumber}`,
        reference: reference
      };
    } else {
      return {
        success: false,
        message: 'Withdrawal failed. Please try again.'
      };
    }
  }

  // Get the actual M-Pesa API URL based on environment
  static getApiUrl(): string {
    if (MPESA_CONFIG.environment === 'sandbox') {
      return 'https://sandbox.safaricom.co.ke';
    }
    return 'https://api.safaricom.co.ke';
  }

  // Get authentication token from Safaricom
  static async getAuthToken(): Promise<string> {
    // In production, implement actual OAuth flow
    // For demo, return a mock token
    return 'mock_token_' + Date.now();
  }

  // Initiate STK Push (Lipisha Na M-Pesa)
  static async stkPush(
    phoneNumber: string,
    amount: number,
    accountReference: string
  ): Promise<{ success: boolean; message: string; checkoutRequestId?: string }> {
    console.log(`💳 STK Push: ${phoneNumber} -> $${amount} (${accountReference})`);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In production, this would call Safaricom's API
    // For demo, simulate success
    return {
      success: true,
      message: `STK Push sent to ${phoneNumber}. Please check your phone.`,
      checkoutRequestId: `CHK${Date.now()}`
    };
  }
}

// Helper function to format phone number for M-Pesa
export function formatPhoneNumber(phone: string): string {
  // Remove any non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If starts with 0, replace with 254
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  }
  
  // If starts with 7, add 254
  if (cleaned.startsWith('7')) {
    cleaned = '254' + cleaned;
  }
  
  // If starts with 1, add 254
  if (cleaned.startsWith('1')) {
    cleaned = '254' + cleaned;
  }
  
  return cleaned;
}

// Validate phone number format
export function validatePhoneNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  // Kenya phone numbers are 12 digits after formatting (254XXXXXXXXX)
  return formatted.length === 12 && formatted.startsWith('254');
}