import { NextResponse } from 'next/server';
import {
  performIDCardOCR,
  performFaceAuth,
  performOCRAndFaceAuth,
  verifyIdStatus,
  matchSignatureWithVerifiedNames,
  IDCardOCRResult,
  FaceAuthResult,
  IDStatusVerificationResult,
} from '@/lib/useb';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * POST /api/identity-verification
 *
 * Perform identity verification for hotel check-in
 * Flow: OCR + 진위확인 (Status Verification) + 안면인증 (Face Authentication)
 *
 * Request body:
 * - idCardImage: base64 encoded ID card image (required)
 * - faceImage: base64 encoded face photo from camera (required for 'full' action)
 * - action: 'full' | 'ocr' | 'face' | 'status' (default: 'full')
 *   - 'full': OCR + 진위확인 + Face Authentication (complete flow)
 *   - 'ocr': ID card OCR only
 *   - 'status': OCR + 진위확인 (verify ID against government database)
 *   - 'face': Face authentication only (compare face with ID card photo)
 * - projectId?: string (required for storing results)
 * - reservationId?: string (to link verification to reservation)
 * - guestIndex?: number (for multiple guests, 0-indexed)
 * - guestCount?: number (total number of guests to verify)
 * - signatureName?: string (name from consent form to match against verified IDs)
 *
 * Response:
 * - success: boolean
 * - data: OCR results + 진위확인 results + face auth results
 * - signatureMatched?: boolean (true if signature matches a verified guest)
 * - error?: string
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      idCardImage,
      faceImage,
      action = 'full',
      projectId,
      reservationId,
      guestIndex = 0,
      guestCount = 1,
      signatureName,
    } = body;

    const isLastGuest = guestIndex === guestCount - 1;

    // Validate required fields
    if (!idCardImage) {
      return NextResponse.json(
        { success: false, error: '신분증 이미지가 필요합니다' },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: any;
    let ocrResult: IDCardOCRResult | undefined;
    let faceAuthResult: FaceAuthResult | undefined;
    let statusVerificationResult: IDStatusVerificationResult | undefined;

    switch (action) {
      case 'ocr':
        // Just OCR the ID card
        ocrResult = await performIDCardOCR(idCardImage);
        result = {
          success: ocrResult.success,
          ocrResult,
          error: ocrResult.error,
        };
        break;

      case 'face':
        // Just face authentication (requires both images)
        if (!faceImage) {
          return NextResponse.json(
            { success: false, error: '얼굴 사진이 필요합니다' },
            { status: 400 }
          );
        }
        faceAuthResult = await performFaceAuth(faceImage, idCardImage);
        result = {
          success: faceAuthResult.success && faceAuthResult.matched,
          faceAuthResult,
          error: faceAuthResult.matched ? undefined : '안면인증 실패 - 얼굴이 일치하지 않습니다',
        };
        break;

      case 'status':
        // Just 진위확인 (requires OCR first)
        ocrResult = await performIDCardOCR(idCardImage);
        if (ocrResult.success && ocrResult.data) {
          statusVerificationResult = await verifyIdStatus(ocrResult.data);
          result = {
            success: statusVerificationResult.success && statusVerificationResult.verified,
            ocrResult,
            statusVerificationResult,
            error: statusVerificationResult.error,
          };
        } else {
          result = {
            success: false,
            ocrResult,
            error: ocrResult.error || 'OCR 실패로 진위확인을 수행할 수 없습니다',
          };
        }
        break;

      case 'full':
      default:
        // Full flow: OCR + 진위확인 + Face Authentication
        if (!faceImage) {
          return NextResponse.json(
            { success: false, error: '얼굴 사진이 필요합니다' },
            { status: 400 }
          );
        }

        const fullResult = await performOCRAndFaceAuth(idCardImage, faceImage);
        ocrResult = fullResult.ocrResult;
        faceAuthResult = fullResult.faceAuthResult;
        statusVerificationResult = fullResult.statusVerificationResult;

        result = {
          success: fullResult.success,
          ocrResult: fullResult.ocrResult,
          statusVerificationResult: fullResult.statusVerificationResult,
          faceAuthResult: fullResult.faceAuthResult,
          isAdult: fullResult.isAdult,
          error: fullResult.error,
        };
        break;
    }

    // Store verification result in database
    if (projectId) {
      try {
        const supabase = await createServiceClient();

        const verificationRecord = {
          project_id: projectId,
          reservation_id: reservationId || null,
          guest_index: guestIndex,
          guest_name: ocrResult?.data?.name || null,
          id_type: ocrResult?.data?.idType || null,
          ocr_success: ocrResult?.success || false,
          status_verified: statusVerificationResult?.verified || false,  // 진위확인 결과
          status_verification_transaction_id: statusVerificationResult?.transactionId || null,
          id_verified: faceAuthResult?.matched || false,  // 안면인증 결과 (face matched)
          face_matched: faceAuthResult?.matched || false,
          similarity_score: faceAuthResult?.similarity || null,
          is_adult: result.isAdult || false,
          status: result.success ? 'verified' : 'failed',
          failure_reason: result.success ? null : (result.error as string) || null,
          verified_at: result.success ? new Date().toISOString() : null,
          signature_name: isLastGuest ? signatureName || null : null,
          signature_matched: null as boolean | null, // Will be updated after signature check
        };

        const { data: insertedVerification, error: insertError } = await supabase
          .from('identity_verifications')
          .insert(verificationRecord)
          .select()
          .single();

        if (insertError) {
          console.error('Failed to insert verification record:', insertError);
        } else {
          result.verificationId = insertedVerification?.id;
        }

        // If verification successful and reservationId provided, update reservation
        if (result.success && reservationId) {
          const { data: currentReservation } = await supabase
            .from('reservations')
            .select('verification_data, verified_guests')
            .eq('id', reservationId)
            .single();

          const currentData = (currentReservation?.verification_data as unknown[]) || [];
          const currentVerifiedGuests = (currentReservation?.verified_guests as { name: string; verified_at: string; verification_id: string }[]) || [];

          const newVerificationEntry = {
            verification_id: insertedVerification?.id,
            guest_index: guestIndex,
            guest_name: ocrResult?.data?.name,
            verified_at: new Date().toISOString(),
          };

          // Add verified guest to the verified_guests array
          const newVerifiedGuest = ocrResult?.data?.name ? {
            name: ocrResult.data.name,
            verified_at: new Date().toISOString(),
            verification_id: insertedVerification?.id || '',
          } : null;

          const updatedVerifiedGuests = newVerifiedGuest
            ? [...currentVerifiedGuests, newVerifiedGuest]
            : currentVerifiedGuests;

          const { error: updateError } = await supabase
            .from('reservations')
            .update({
              verification_data: [...currentData, newVerificationEntry],
              verified_guests: updatedVerifiedGuests,
            })
            .eq('id', reservationId);

          if (updateError) {
            console.error('Failed to update reservation:', updateError);
          }
        }

        // After last guest verification, check if signature matches any verified guest
        if (result.success && isLastGuest && signatureName && projectId) {
          // Get all verified guest names for this reservation/session
          const verifiedNamesQuery = reservationId
            ? supabase
                .from('identity_verifications')
                .select('guest_name')
                .eq('reservation_id', reservationId)
                .eq('status', 'verified')
                .not('guest_name', 'is', null)
            : supabase
                .from('identity_verifications')
                .select('guest_name')
                .eq('project_id', projectId)
                .eq('status', 'verified')
                .not('guest_name', 'is', null)
                .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()); // Last 30 minutes

          const { data: verifiedGuests } = await verifiedNamesQuery;
          const verifiedNames = (verifiedGuests || [])
            .map((g) => g.guest_name as string)
            .filter(Boolean);

          // Include the current guest's name
          if (ocrResult?.data?.name) {
            verifiedNames.push(ocrResult.data.name);
          }

          const signatureMatch = matchSignatureWithVerifiedNames(signatureName, verifiedNames);

          if (!signatureMatch.matched) {
            // Signature doesn't match any verified guest
            result.success = false;
            result.signatureMatched = false;
            result.error = `서명 이름(${signatureName})이 인증된 투숙객 이름과 일치하지 않습니다`;

            // Update the verification record to failed with signature match info
            if (insertedVerification?.id) {
              await supabase
                .from('identity_verifications')
                .update({
                  status: 'failed',
                  failure_reason: result.error,
                  signature_matched: false,
                })
                .eq('id', insertedVerification.id);
            }
          } else {
            result.signatureMatched = true;
            result.matchedGuestName = signatureMatch.matchedName;

            // Update the verification record with signature match success
            if (insertedVerification?.id) {
              await supabase
                .from('identity_verifications')
                .update({
                  signature_matched: true,
                })
                .eq('id', insertedVerification.id);
            }
          }
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Don't fail the verification just because DB save failed
      }
    }

    return NextResponse.json({
      success: result.success,
      data: result,
      signatureMatched: result.signatureMatched,
      error: result.success ? undefined : result.error,
    });
  } catch (error) {
    console.error('Identity verification error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '인증 처리 중 오류가 발생했습니다',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/identity-verification
 *
 * Get verification records
 *
 * Query params:
 * - projectId: filter by project
 * - reservationId: filter by reservation
 * - status: filter by status
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const reservationId = searchParams.get('reservationId');
    const status = searchParams.get('status');

    const supabase = await createServiceClient();

    let query = supabase
      .from('identity_verifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    if (reservationId) {
      query = query.eq('reservation_id', reservationId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.limit(100);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, verifications: data });
  } catch (error) {
    console.error('Get verifications error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch verifications' },
      { status: 500 }
    );
  }
}
