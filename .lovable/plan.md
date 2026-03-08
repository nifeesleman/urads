

## Security Scan Results — Assessment

### Current Findings (5 total)

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 1-2 | Security Definer Views (`public_profiles`, `public_advertisers`) | Error | **False positive** — intentional design |
| 3 | Leaked Password Protection Disabled | Warning | **Manual action required** |
| 4-5 | Missing RLS on `public_advertisers` / `public_profiles` | Warning | **False positive** — these are views, not tables |

### Analysis

**Security Definer Views (findings 1-2, 4-5):** The `public_profiles` and `public_advertisers` views are deliberately created with `SECURITY DEFINER` to bypass RLS on the base `profiles` and `advertisers` tables. They only expose non-sensitive columns (id, name, avatar_url, verified, timestamps). This is a standard pattern for serving public-facing data while keeping sensitive fields (email, wallet_address) protected behind owner-only RLS on the base tables. No code changes needed.

**Leaked Password Protection (finding 3):** Cannot be fixed via code or migrations. Must be enabled manually:
1. Open the **Cloud** view
2. Go to **Users → Auth settings** (gear icon)
3. Under **Email settings**, enable **Password HIBP Check**
4. Save

### Plan

1. **Mark the 4 false-positive findings as resolved/ignored** using the security management tool so they don't clutter future scans
2. No code or database changes required

The application's security posture is solid — wallet signature authentication, owner-only profile access, admin role protection, and permissive RLS policies are all correctly configured.

