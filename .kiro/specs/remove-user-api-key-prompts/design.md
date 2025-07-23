# Design Document

## Overview

This design removes all user-facing API key input functionality from the Fire Enrich application and ensures exclusive use of server-side configured environment variables. The solution involves modifying the frontend to remove API key modals and input forms, updating API routes to rely solely on environment variables, and implementing proper error handling for configuration issues.

## Architecture

The current architecture has a dual-path system where API keys can come from either environment variables or user-provided headers. The new architecture will be simplified to use only server-side environment variables:

```
Frontend (React) → API Routes → External APIs (Firecrawl/OpenAI)
                     ↑
              Environment Variables Only
```

### Current Flow (to be removed):
1. Frontend checks `/api/check-env` for environment variables
2. If missing, shows modal to collect user API keys
3. Stores keys in localStorage
4. Sends keys via headers to API routes
5. API routes use env vars OR headers

### New Flow:
1. Frontend directly proceeds with CSV upload
2. API routes use only environment variables
3. If env vars missing, return server configuration error

## Components and Interfaces

### Frontend Components to Modify

#### 1. `app/fire-enrich/page.tsx`
- **Remove**: API key modal dialog and related state
- **Remove**: localStorage API key checking and storage
- **Remove**: API key validation logic
- **Simplify**: CSV upload flow to proceed directly to setup

#### 2. API Routes to Modify

#### `app/api/enrich/route.ts`
- **Remove**: Header-based API key fallback (`request.headers.get('X-OpenAI-API-Key')`)
- **Simplify**: Use only `process.env.OPENAI_API_KEY` and `process.env.FIRECRAWL_API_KEY`
- **Enhance**: Error messages for missing environment variables

#### `app/api/scrape/route.ts`
- **Remove**: Header-based API key fallback (`request.headers.get('X-Firecrawl-API-Key')`)
- **Simplify**: Use only `process.env.FIRECRAWL_API_KEY`
- **Enhance**: Error messages for missing environment variables

#### `app/api/generate-fields/route.ts`
- **Already correct**: Only uses `process.env.OPENAI_API_KEY`
- **Enhance**: Error message consistency

### State Management Changes

#### Remove from Frontend State:
- `showApiKeyModal`
- `firecrawlApiKey`
- `openaiApiKey`
- `isValidatingApiKey`
- `missingKeys`
- `pendingCSVData`

#### Remove from Effects:
- Environment checking useEffect
- localStorage API key retrieval
- API key validation logic

## Data Models

No changes to existing data models are required. The change is purely in authentication/configuration flow.

## Error Handling

### Server-Side Error Handling

#### Missing Environment Variables:
```typescript
if (!process.env.OPENAI_API_KEY || !process.env.FIRECRAWL_API_KEY) {
  return NextResponse.json(
    { 
      error: 'Server configuration error: Missing required API keys. Please contact the administrator.',
      code: 'MISSING_API_KEYS'
    },
    { status: 500 }
  );
}
```

#### API Call Failures:
- Maintain existing error handling for API failures
- Remove any logic that suggests users provide their own keys
- Log detailed errors for server administrators

### Frontend Error Handling

#### Server Configuration Errors:
- Display user-friendly message: "Service temporarily unavailable. Please try again later."
- Log detailed error information for debugging
- Remove any suggestions for users to provide API keys

## Testing Strategy

### Unit Tests
- Test API routes with missing environment variables
- Test API routes with valid environment variables
- Test frontend components without API key modal functionality

### Integration Tests
- Test complete CSV upload and enrichment flow
- Test error scenarios with missing server configuration
- Verify no API key headers are sent from frontend

### Manual Testing Checklist
1. Verify CSV upload proceeds directly to setup
2. Verify enrichment works with server API keys
3. Verify no API key modals appear
4. Test with missing environment variables to ensure proper error handling
5. Verify localStorage is not used for API keys

## Implementation Notes

### Security Improvements
- Eliminates client-side API key storage
- Removes API key transmission via headers
- Centralizes API key management on server

### User Experience Improvements
- Removes friction from user onboarding
- Eliminates need for users to obtain API keys
- Streamlines the CSV enrichment workflow

### Operational Benefits
- Centralized cost control and monitoring
- Simplified deployment (no user key management)
- Better security posture