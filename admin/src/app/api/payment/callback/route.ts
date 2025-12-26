import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { parsePaymentResult } from '@/lib/easycheck';

/**
 * Payment callback handler for KICC EasyCheck
 *
 * This endpoint is called when returning from the EasyCheck payment app.
 * It parses the payment result and redirects to the appropriate kiosk screen.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Parse payment result from URL parameters
  const result = parsePaymentResult(searchParams);

  // Get tracking parameters
  const transactionNo = searchParams.get('txn') || result.transactionNo;
  const kioskId = searchParams.get('kiosk');
  const reservationId = searchParams.get('reservation');

  console.log('Payment callback received:', {
    transactionNo,
    kioskId,
    reservationId,
    result,
  });

  try {
    // Use service client to bypass RLS for callback handling
    const supabase = await createServiceClient();

    // Get project_id from kiosk if available
    let projectId: string | null = null;
    if (kioskId) {
      const { data: kiosk } = await supabase
        .from('kiosks')
        .select('project_id')
        .eq('id', kioskId)
        .single();
      projectId = kiosk?.project_id || null;
    }

    // Store payment record in database
    if (result.success) {
      // Insert successful payment record
      const { error: insertError } = await supabase
        .from('payments')
        .insert({
          project_id: projectId,
          transaction_no: transactionNo,
          approval_num: result.approvalNum,
          approval_date: result.approvalDate,
          approval_time: result.approvalTime,
          card_num: result.cardNum,
          card_name: result.cardName,
          amount: result.amount,
          installment: result.installment,
          status: 'completed',
          kiosk_id: kioskId || null,
          reservation_id: reservationId || null,
          raw_response: result.rawParams,
        });

      if (insertError) {
        console.error('Error storing payment record:', insertError);
        // Continue anyway - we don't want to block the user flow
      }

      // Update reservation status if applicable
      if (reservationId) {
        await supabase
          .from('reservations')
          .update({
            status: 'paid',
            payment_status: 'completed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', reservationId);
      }
    } else {
      // Store failed payment attempt
      await supabase
        .from('payments')
        .insert({
          project_id: projectId,
          transaction_no: transactionNo,
          status: 'failed',
          error_code: result.errorCode,
          error_message: result.errorMessage,
          kiosk_id: kioskId || null,
          reservation_id: reservationId || null,
          raw_response: result.rawParams,
        });
    }
  } catch (error) {
    console.error('Error processing payment callback:', error);
  }

  // Build redirect URL back to kiosk
  // Include payment result status so the kiosk can show appropriate screen
  const redirectUrl = new URL('/kiosk', request.nextUrl.origin);

  if (result.success) {
    redirectUrl.searchParams.set('payment', 'success');
    redirectUrl.searchParams.set('txn', transactionNo);
    if (result.approvalNum) {
      redirectUrl.searchParams.set('approval', result.approvalNum);
    }
  } else {
    redirectUrl.searchParams.set('payment', 'failed');
    if (result.errorCode) {
      redirectUrl.searchParams.set('error', result.errorCode);
    }
    if (result.errorMessage) {
      redirectUrl.searchParams.set('message', result.errorMessage);
    }
  }

  // Redirect back to kiosk
  return NextResponse.redirect(redirectUrl);
}

// Also handle POST in case EasyCheck sends data via POST
export async function POST(request: NextRequest) {
  // Parse form data if sent via POST
  try {
    const formData = await request.formData();
    const searchParams = new URLSearchParams();

    formData.forEach((value, key) => {
      if (typeof value === 'string') {
        searchParams.set(key, value);
      }
    });

    // Create a new request with the form data as query params
    const url = new URL(request.url);
    url.search = searchParams.toString();

    const newRequest = new NextRequest(url, {
      method: 'GET',
    });

    return GET(newRequest);
  } catch {
    // If form parsing fails, try to handle as regular GET
    return GET(request);
  }
}
