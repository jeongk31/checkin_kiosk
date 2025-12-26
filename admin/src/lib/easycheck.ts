/**
 * KICC EasyCheck Payment Integration
 *
 * This module handles app-to-app payment integration with KICC EasyCheck
 * for tablet-based payment processing.
 *
 * URL Schemes:
 * - ecm://link - EasyCheckIC / EasyCheck Mobile
 * - ecm2://link - EasyCheck Mobile 2.0C
 * - ectablet://link - EasyCheck Tablet (verify with KICC)
 *
 * Reference: KICC Developer Documentation
 */

export interface EasyCheckPaymentRequest {
  // Transaction info
  transactionNo: string;          // Unique transaction number
  transactionType: 'CARD' | 'CASH' | 'CANCEL';  // Payment type
  totalAmount: number;            // Total amount in KRW
  tax?: number;                   // Tax amount (usually 10%)
  tip?: number;                   // Tip amount
  installment?: number;           // Installment months (0 = one-time payment)

  // Receipt options
  receiptEmail?: string;
  receiptSms?: string;

  // For cancellation
  approvalNum?: string;           // Original approval number
  approvalDate?: string;          // Original approval date (YYMMDD)
  transactionSerialNo?: string;   // Original transaction serial

  // Merchant info (optional - for multi-merchant setup)
  shopTid?: string;
  shopBizNum?: string;
  shopName?: string;
  shopOwner?: string;
  shopAddress?: string;
  shopTel?: string;

  // Additional fields
  orderNum?: string;              // Order number for reference
  customerCode?: string;
  addField?: string;

  // Callback URL - where to return after payment
  callbackUrl: string;
}

export interface EasyCheckPaymentResult {
  success: boolean;
  transactionNo: string;
  approvalNum?: string;
  approvalDate?: string;
  approvalTime?: string;
  cardNum?: string;               // Masked card number
  cardName?: string;              // Card issuer name
  installment?: number;
  amount?: number;
  errorCode?: string;
  errorMessage?: string;
  rawParams?: Record<string, string>;
}

// URL scheme for EasyCheck apps
// Note: Verify the correct scheme with KICC for your specific device
export const EASYCHECK_SCHEMES = {
  IC: 'ecm://link',           // EasyCheckIC
  MOBILE_2: 'ecm2://link',    // EasyCheck Mobile 2.0C
  TABLET: 'ectablet://link',  // EasyCheck Tablet (verify with KICC)
};

// Default to EasyCheckIC scheme - can be configured
let currentScheme: string = EASYCHECK_SCHEMES.IC;

export function setEasyCheckScheme(scheme: string) {
  currentScheme = scheme;
}

export function getEasyCheckScheme(): string {
  return currentScheme;
}

/**
 * Generate a unique transaction number
 */
export function generateTransactionNo(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `TXN${timestamp}${random}`.toUpperCase();
}

/**
 * Calculate tax amount (10% VAT in Korea)
 */
export function calculateTax(amount: number): number {
  return Math.round(amount / 11); // VAT included price -> VAT amount
}

/**
 * Build the EasyCheck payment URL
 */
export function buildPaymentUrl(request: EasyCheckPaymentRequest): string {
  const params = new URLSearchParams();

  // Required fields
  params.set('TRAN_NO', request.transactionNo);
  params.set('TRAN_TYPE', request.transactionType);
  params.set('TOTAL_AMOUNT', request.totalAmount.toString());

  // Tax (default to 10% of total if not specified)
  const tax = request.tax ?? calculateTax(request.totalAmount);
  params.set('TAX', tax.toString());

  // Optional fields
  if (request.tip !== undefined) {
    params.set('TIP', request.tip.toString());
  }

  params.set('INSTALLMENT', (request.installment ?? 0).toString());

  // Receipt options
  if (request.receiptEmail) {
    params.set('RECEIPT_EMAIL', request.receiptEmail);
  }
  if (request.receiptSms) {
    params.set('RECEIPT_SMS', request.receiptSms);
  }

  // Cancellation fields
  if (request.transactionType === 'CANCEL') {
    if (request.approvalNum) params.set('APPROVAL_NUM', request.approvalNum);
    if (request.approvalDate) params.set('APPROVAL_DATE', request.approvalDate);
    if (request.transactionSerialNo) params.set('TRAN_SERIALNO', request.transactionSerialNo);
  }

  // Multi-merchant fields
  if (request.shopTid) params.set('SHOP_TID', request.shopTid);
  if (request.shopBizNum) params.set('SHOP_BIZ_NUM', request.shopBizNum);
  if (request.shopName) params.set('SHOP_NAME', request.shopName);
  if (request.shopOwner) params.set('SHOP_OWNER', request.shopOwner);
  if (request.shopAddress) params.set('SHOP_ADDRESS', request.shopAddress);
  if (request.shopTel) params.set('SHOP_TEL', request.shopTel);

  // Additional fields
  if (request.orderNum) params.set('ORDER_NUM', request.orderNum);
  if (request.customerCode) params.set('CUSTOMER_CODE', request.customerCode);
  if (request.addField) params.set('ADD_FIELD', request.addField);

  // Callback URL - where to return after payment
  params.set('CALL_WEB_URL', request.callbackUrl);

  return `${currentScheme}?${params.toString()}`;
}

/**
 * Parse payment result from callback URL parameters
 */
export function parsePaymentResult(searchParams: URLSearchParams): EasyCheckPaymentResult {
  const rawParams: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    rawParams[key] = value;
  });

  // Check for success - typically indicated by presence of approval number
  const approvalNum = searchParams.get('APPROVAL_NUM') || searchParams.get('approval_num');
  const errorCode = searchParams.get('ERROR_CODE') || searchParams.get('error_code');

  const success = !!approvalNum && !errorCode;

  return {
    success,
    transactionNo: searchParams.get('TRAN_NO') || searchParams.get('tran_no') || '',
    approvalNum: approvalNum || undefined,
    approvalDate: searchParams.get('APPROVAL_DATE') || searchParams.get('approval_date') || undefined,
    approvalTime: searchParams.get('APPROVAL_TIME') || searchParams.get('approval_time') || undefined,
    cardNum: searchParams.get('CARD_NUM') || searchParams.get('card_num') || undefined,
    cardName: searchParams.get('CARD_NAME') || searchParams.get('card_name') || undefined,
    installment: parseInt(searchParams.get('INSTALLMENT') || searchParams.get('installment') || '0', 10),
    amount: parseInt(searchParams.get('TOTAL_AMOUNT') || searchParams.get('total_amount') || '0', 10),
    errorCode: errorCode || undefined,
    errorMessage: searchParams.get('ERROR_MSG') || searchParams.get('error_msg') || undefined,
    rawParams,
  };
}

/**
 * Launch EasyCheck payment app
 * This will redirect the browser to the EasyCheck app
 */
export function launchPayment(request: EasyCheckPaymentRequest): void {
  const url = buildPaymentUrl(request);
  console.log('Launching EasyCheck payment:', url);

  // Try to open the app using the URL scheme
  window.location.href = url;
}

/**
 * Check if EasyCheck app is likely available
 * Note: This is a best-effort check - actual availability may vary
 */
export async function checkEasyCheckAvailable(): Promise<boolean> {
  // On Android, we can try to detect if the app is installed
  // This is not 100% reliable but can help with fallback logic

  if (typeof navigator !== 'undefined' && 'userAgent' in navigator) {
    const isAndroid = /android/i.test(navigator.userAgent);
    if (isAndroid) {
      // On Android, the URL scheme will be handled by the system
      // We assume the app is available if we're on Android
      return true;
    }
  }

  // For iOS or other platforms, we might need different handling
  return false;
}

/**
 * Create a payment request for a room booking
 */
export function createRoomPaymentRequest(
  roomName: string,
  amount: number,
  callbackBaseUrl: string,
  options?: {
    kioskId?: string;
    reservationId?: string;
    guestName?: string;
  }
): EasyCheckPaymentRequest {
  const transactionNo = generateTransactionNo();

  // Build callback URL with transaction tracking
  const callbackUrl = new URL('/api/payment/callback', callbackBaseUrl);
  callbackUrl.searchParams.set('txn', transactionNo);
  if (options?.kioskId) {
    callbackUrl.searchParams.set('kiosk', options.kioskId);
  }
  if (options?.reservationId) {
    callbackUrl.searchParams.set('reservation', options.reservationId);
  }

  return {
    transactionNo,
    transactionType: 'CARD',
    totalAmount: amount,
    orderNum: `ROOM-${roomName}-${Date.now()}`,
    customerCode: options?.guestName || 'GUEST',
    callbackUrl: callbackUrl.toString(),
  };
}
