import { NextRequest, NextResponse } from 'next/server';
import { checkAllAlerts } from '@/lib/alerts/alert-checker';

// Configure route to use Edge runtime for better performance
// export const runtime = 'edge';

// Disable caching for this route
export const dynamic = 'force-dynamic';

/**
 * Cron endpoint for checking alert conditions
 *
 * This endpoint should be called periodically (e.g., every 15 minutes)
 * by a cron service like Vercel Cron Jobs.
 *
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/check-alerts",
 *     "schedule": "0/15 * * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security (Vercel adds this header)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // In production, validate the cron secret
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[Cron] Unauthorized cron request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Cron] Starting alert check...');
    const startTime = Date.now();

    // Run the alert checker
    const results = await checkAllAlerts();

    const duration = Date.now() - startTime;

    console.log(
      `[Cron] Alert check completed in ${duration}ms:`,
      `${results.checked} checked, ${results.triggered} triggered, ${results.errors} errors`
    );

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      summary: {
        checked: results.checked,
        triggered: results.triggered,
        errors: results.errors,
      },
      // Only include detailed results in development
      ...(process.env.NODE_ENV === 'development' && { results: results.results }),
    });
  } catch (error) {
    console.error('[Cron] Alert check failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Alert check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering (with auth)
export async function POST(request: NextRequest) {
  return GET(request);
}
