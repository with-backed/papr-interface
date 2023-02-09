import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * ISO 3166-1 alpha-2 codes corresponding to entire countries which are restricted.
 */
const RESTRICTED_COUNTRIES = new Set([
  // Cuba
  'CU',
  // Iran
  'IR',
  // North Korea
  'KP',
  // Syria
  'SY',
]);

/**
 * ISO 3166-2 codes corresponding to individual (subnational) regions which are restricted.
 */
const RESTRICTED_REGIONS = new Set([
  // Crimea (Ukraine)
  'UA-43',
  // Donetsk People's Republic (Ukraine) -- Donetska oblast
  'UA-14',
  // Luhansk People's Republic (Ukraine) -- Luhanska oblast
  'UA-09',
  // Sevastopol
  'UA-40',
]);

export function middleware(request: NextRequest) {
  const isRestricted =
    RESTRICTED_COUNTRIES.has(request.geo?.country || 'US') ||
    RESTRICTED_REGIONS.has(request.geo?.region || 'US-ME');

  if (isRestricted) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: 'Cannot access from restricted territory.',
      }),
      { status: 403, headers: { 'content-type': 'application/json' } },
    );
  }
  return NextResponse.redirect(new URL('/about-2', request.url));
}
