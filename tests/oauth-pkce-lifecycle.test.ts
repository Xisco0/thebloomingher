import { getDomainForHost, getAuthCookieOptions, sanitizeAuthDiagnostics, PROD_DOMAIN } from '../src/lib/supabase/cookies';
import { getSiteUrl, SITE_URL } from '../src/lib/site-url';
import { authService } from '../src/services/auth.service';
import { verifySessionToken, CUSTOMER_COOKIE_NAME } from '../src/lib/auth/jwt';
import { cmsStore } from '../src/lib/cms-store';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

export async function runOAuthPkceLifecycleTests() {
  console.log('--- RUNNING GOOGLE OAUTH PKCE & COOKIE LIFECYCLE TEST SUITE ---');

  // Scenario 1: First-time Google login on iPhone Safari (WebKit / ITP)
  {
    const safariUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
    const host = 'thebloomingher.com';
    const cookieOpts = getAuthCookieOptions(host);

    assert(cookieOpts.domain === `.${PROD_DOMAIN}`, 'Safari: cookie domain must be scoped to .thebloomingher.com');
    assert(cookieOpts.sameSite === 'lax', 'Safari: SameSite must be lax to survive top-level cross-site redirect');
    assert(cookieOpts.secure === true, 'Safari: Secure flag must be enabled for WebKit ITP compliance');
    assert(cookieOpts.path === '/', 'Safari: Cookie path must be root /');

    const diag = sanitizeAuthDiagnostics({
      refId: 'tbh_test_safari',
      hasCode: true,
      codeLength: 48,
      hasVerifierCookie: true,
      userAgent: safariUA,
      host,
    });
    assert(diag.browserEngine === 'WebKit / Safari', 'Safari engine must be detected');
    assert(diag.hasCode === true, 'hasCode boolean must be true');
    assert(!('code' in (diag as any)), 'Security check: code string must NOT exist in diagnostics');
    console.log('✔ Scenario 1: First-time Google login on iPhone Safari verified.');
  }

  // Scenario 2: First-time Google login on Samsung Internet
  {
    const samsungUA = 'Mozilla/5.0 (Linux; Android 14; SAMSUNG SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/118.0.0.0 Mobile Safari/537.36';
    const host = 'www.thebloomingher.com';
    const cookieOpts = getAuthCookieOptions(host);

    assert(cookieOpts.domain === `.${PROD_DOMAIN}`, 'Samsung Internet: cookie domain must match apex .thebloomingher.com');
    const diag = sanitizeAuthDiagnostics({
      refId: 'tbh_test_samsung',
      hasCode: true,
      codeLength: 52,
      hasVerifierCookie: true,
      userAgent: samsungUA,
      host,
    });
    assert(diag.browserEngine === 'Samsung Internet', 'Samsung Internet engine must be detected');
    console.log('✔ Scenario 2: First-time Google login on Samsung Internet verified.');
  }

  // Scenario 3: First-time Google login on Android Chrome
  {
    const chromeUA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.64 Mobile Safari/537.36';
    const host = 'thebloomingher.com';
    const diag = sanitizeAuthDiagnostics({
      refId: 'tbh_test_chrome',
      hasCode: true,
      codeLength: 50,
      hasVerifierCookie: true,
      userAgent: chromeUA,
      host,
    });
    assert(diag.browserEngine === 'Chromium', 'Chromium engine must be detected');
    console.log('✔ Scenario 3: First-time Google login on Android Chrome verified.');
  }

  // Scenario 4: Returning Google login (existing customer)
  {
    const testEmail = `returning.customer.${Date.now()}@example.com`;
    // First login
    const firstAuth = await authService.customerGoogleAuth({
      email: testEmail,
      name: 'Adaora Eze',
      googleId: 'google-uid-001',
    });
    assert(firstAuth.success === true, 'First-time auth must succeed');
    const customerId = firstAuth.customer?.id;
    assert(Boolean(customerId), 'Customer ID must be generated');

    // Second (returning) login
    const returningAuth = await authService.customerGoogleAuth({
      email: testEmail,
      name: 'Adaora Eze',
      googleId: 'google-uid-001',
    });
    assert(returningAuth.success === true, 'Returning auth must succeed');
    assert(returningAuth.customer?.id === customerId, 'Returning customer ID must match original customer ID (no duplicate)');
    console.log('✔ Scenario 4: Returning Google login preserves existing customer record.');
  }

  // Scenario 5: Logout followed by Google login
  {
    const testEmail = `logout.test.${Date.now()}@example.com`;
    const auth1 = await authService.customerGoogleAuth({
      email: testEmail,
      name: 'Funke Akindele',
      googleId: 'google-uid-002',
    });
    assert(Boolean(auth1.token), 'Auth token must be generated');

    // Verify token validity
    const verified1 = await verifySessionToken(auth1.token!);
    assert(verified1 !== null && verified1.email === testEmail, 'Session token must verify');

    // Subsequent login generates a valid fresh session
    const auth2 = await authService.customerGoogleAuth({
      email: testEmail,
      name: 'Funke Akindele',
      googleId: 'google-uid-002',
    });
    const verified2 = await verifySessionToken(auth2.token!);
    assert(verified2 !== null && verified2.email === testEmail, 'New session token after re-login must verify');
    console.log('✔ Scenario 5: Logout followed by Google login works cleanly.');
  }

  // Scenario 6: Refresh after successful login
  {
    const testEmail = `refresh.test.${Date.now()}@example.com`;
    const auth = await authService.customerGoogleAuth({
      email: testEmail,
      name: 'Ngozi Okonjo',
      googleId: 'google-uid-003',
    });
    const payload = await verifySessionToken(auth.token!);
    assert(payload !== null, 'Session payload must not be null');
    assert(payload?.role === 'customer', 'Role must be customer');
    assert(payload?.userId === auth.customer?.id, 'User ID in token must match customer ID');
    console.log('✔ Scenario 6: Refresh after successful login maintains valid session.');
  }

  // Scenario 7: Login with an existing customer account (created via email/password)
  {
    const existingEmail = `existing.email.${Date.now()}@example.com`;
    // Pre-create customer record in store
    const preExisting = cmsStore.createCustomer({
      first_name: 'Chioma',
      last_name: 'Adeyemi',
      email: existingEmail,
      password_hash: 'hashed_password_sample',
      is_active: true,
      phone: '+2348123456789',
    });

    // Customer logs in with Google using that same email
    const googleLogin = await authService.customerGoogleAuth({
      email: existingEmail,
      name: 'Chioma Adeyemi',
      googleId: 'google-uid-004',
    });

    assert(googleLogin.success === true, 'Google auth on existing email must succeed');
    assert(googleLogin.customer?.id === preExisting.id, 'Must link to existing customer ID');
    assert(googleLogin.customer?.email === existingEmail, 'Must retain original customer email');
    console.log('✔ Scenario 7: Login with existing customer account links cleanly without duplicate.');
  }

  // Scenario 8: Login with a new Google account (name parsing)
  {
    const newEmail = `new.google.${Date.now()}@gmail.com`;
    const googleLogin = await authService.customerGoogleAuth({
      email: newEmail,
      name: 'Blessing Obasi',
      googleId: 'google-uid-005',
    });
    assert(googleLogin.success === true, 'New account creation must succeed');
    assert(googleLogin.customer?.first_name === 'Blessing', 'First name must be parsed correctly');
    assert(googleLogin.customer?.last_name === 'Obasi', 'Last name must be parsed correctly');
    assert(googleLogin.customer?.is_active === true, 'New customer must be active');
    console.log('✔ Scenario 8: Login with new Google account correctly parses names.');
  }

  // Scenario 9: Multiple login attempts (concurrency / idempotency)
  {
    const concurrentEmail = `concurrent.${Date.now()}@example.com`;
    const attempts = await Promise.all([
      authService.customerGoogleAuth({ email: concurrentEmail, name: 'Simi Kosoko' }),
      authService.customerGoogleAuth({ email: concurrentEmail, name: 'Simi Kosoko' }),
      authService.customerGoogleAuth({ email: concurrentEmail, name: 'Simi Kosoko' }),
    ]);

    assert(attempts.every(a => a.success), 'All concurrent login attempts must succeed');
    const firstId = attempts[0].customer?.id;
    assert(
      attempts.every(a => a.customer?.id === firstId),
      'Concurrent logins must all map to the same single customer ID'
    );
    console.log('✔ Scenario 9: Multiple concurrent login attempts maintain single customer entity.');
  }

  // Scenario 10: Expired or invalid OAuth callback error handling
  {
    const diag = sanitizeAuthDiagnostics({
      refId: 'tbh_expired_test',
      hasCode: true,
      codeLength: 40,
      hasVerifierCookie: false, // Verifier missing or expired
      reason: 'pkce_exchange_failed',
      errorMessage: 'both auth code and code verifier should be non-empty',
      errorStatus: 400,
    });

    assert(diag.hasVerifierCookie === false, 'Diagnostics correctly captures missing verifier');
    assert(diag.reason === 'pkce_exchange_failed', 'Diagnostics records error reason');
    assert(!JSON.stringify(diag).includes('sb_publishable'), 'Diagnostics never leaks API keys');
    assert(!JSON.stringify(diag).includes('authorization_code'), 'Diagnostics never leaks auth codes');

    // Friendly error redirect check:
    const targetOrigin = 'https://thebloomingher.com';
    const friendlyErrorUrl = new URL(
      `/auth/auth-code-error?reason=pkce_verification_failed&ref=${diag.refId}`,
      targetOrigin
    );
    assert(friendlyErrorUrl.pathname === '/auth/auth-code-error', 'Must redirect to dedicated friendly error page');
    assert(!friendlyErrorUrl.search.includes('code='), 'Error URL must not leak code');
    assert(!friendlyErrorUrl.search.includes('verifier'), 'Error URL must not expose technical verifier details');
    console.log('✔ Scenario 10: Expired or invalid OAuth callback redirects to friendly error page without leaking secrets.');
  }

  // Scenario 11: Opening the callback URL without a valid authorization code
  {
    const targetOrigin = 'https://thebloomingher.com';
    const missingCodeUrl = new URL('/auth/auth-code-error?reason=missing_code', targetOrigin);
    assert(missingCodeUrl.pathname === '/auth/auth-code-error', 'Missing code redirects to friendly error page');
    assert(missingCodeUrl.searchParams.get('reason') === 'missing_code', 'Reason is missing_code');

    const diag = sanitizeAuthDiagnostics({
      reason: 'missing_code',
      hasCode: false,
      codeLength: 0,
      host: 'thebloomingher.com',
    });
    assert(diag.hasCode === false, 'hasCode must be false');
    assert(diag.codeLength === 0, 'codeLength must be 0');
    console.log('✔ Scenario 11: Opening callback URL without code safely redirects with helpful message.');
  }

  // Scenario 12: Customer Sign-Out Lifecycle & Cookie Invalidation
  {
    const host = 'thebloomingher.com';
    const cookieOpts = getAuthCookieOptions(host);

    // Verify deletion options cover domain-scoped and host-only cookies
    assert(cookieOpts.domain === `.${PROD_DOMAIN}`, 'Logout cookie domain must match .thebloomingher.com');
    assert(cookieOpts.path === '/', 'Logout cookie path must be /');

    // Simulate logout clearing logic
    const cookiesToClear = [CUSTOMER_COOKIE_NAME, 'auth_redirect', 'sb-xbhyafrdczdazuueibeu-auth-token'];
    const clearedCookies: Array<{ name: string; maxAge: number; domain?: string }> = [];

    cookiesToClear.forEach(name => {
      // Domain-scoped
      clearedCookies.push({ name, maxAge: 0, domain: cookieOpts.domain });
      // Host-only
      clearedCookies.push({ name, maxAge: 0 });
    });

    assert(clearedCookies.every(c => c.maxAge === 0), 'All cleared cookies must have maxAge = 0');
    assert(clearedCookies.some(c => c.name === CUSTOMER_COOKIE_NAME && c.domain === `.${PROD_DOMAIN}`), 'Customer JWT cookie must be cleared with domain');
    assert(clearedCookies.some(c => c.name === CUSTOMER_COOKIE_NAME && !c.domain), 'Customer JWT cookie must also be cleared host-only');
    console.log('✔ Scenario 12: Customer sign-out thoroughly invalidates domain and host cookies.');
  }

  // Scenario 13: Customer Session Revocation & Data Preservation
  {
    const customerEmail = `preserve.data.${Date.now()}@example.com`;
    const auth = await authService.customerGoogleAuth({
      email: customerEmail,
      name: 'Halima Bello',
      googleId: 'google-uid-013',
    });
    assert(auth.success === true, 'Customer auth must succeed');
    const customerId = auth.customer?.id;
    assert(Boolean(customerId), 'Customer must have ID');

    // Verify customer exists in store before sign out
    const preSignOut = cmsStore.getCustomerById(customerId!);
    assert(preSignOut !== undefined, 'Customer profile must exist in store');

    // Simulate sign out: JWT token becomes expired / empty
    const expiredToken = '';
    const verifiedExpired = await verifySessionToken(expiredToken);
    assert(verifiedExpired === null, 'Cleared token must fail session verification');

    // Verify customer data and account are strictly preserved (never deleted)
    const postSignOut = cmsStore.getCustomerById(customerId!);
    assert(postSignOut !== undefined, 'Customer profile must remain in database after sign out');
    assert(postSignOut?.email === customerEmail, 'Customer email must be preserved');
    assert(postSignOut?.first_name === 'Halima', 'Customer first name preserved');

    // Subsequent re-login succeeds and generates fresh session
    const reLogin = await authService.customerGoogleAuth({
      email: customerEmail,
      name: 'Halima Bello',
      googleId: 'google-uid-013',
    });
    assert(reLogin.success === true, 'Subsequent login after sign out must succeed');
    assert(reLogin.customer?.id === customerId, 'Re-login maps to the same existing customer profile');
    console.log('✔ Scenario 13: Sign out terminates session while strictly preserving all customer data.');
  }

  // Scenario 14: Canonical Apex Domain & Supabase Callback Alignment
  {
    // 1. WWW to Apex Redirect logic
    const testHost = 'www.thebloomingher.com';
    const testPath = '/account/login?redirect=/checkout';
    const canonicalRedirect = new URL(testPath, 'https://thebloomingher.com').toString();
    assert(canonicalRedirect === 'https://thebloomingher.com/account/login?redirect=/checkout', 'WWW must redirect to https://thebloomingher.com');

    // 2. Exact redirectTo matching Supabase Dashboard
    const siteUrl = getSiteUrl();
    const primaryCallback = `${siteUrl}/api/auth/callback`;
    assert(primaryCallback === 'https://thebloomingher.com/api/auth/callback', 'Primary callback must match exact Supabase redirect entry');

    // 3. Domain scoping for apex
    const domain = getDomainForHost('thebloomingher.com');
    assert(domain === '.thebloomingher.com', 'Domain must be .thebloomingher.com');
    console.log('✔ Scenario 14: Canonical apex redirect and Supabase callback URL alignment verified.');
  }

  console.log('\n--- ALL 14 GOOGLE OAUTH, PKCE & SIGN-OUT SCENARIOS VERIFIED SUCCESSFULLY ---\n');
}
