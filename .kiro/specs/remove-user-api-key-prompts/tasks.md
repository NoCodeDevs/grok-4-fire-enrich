# Implementation Plan

- [x] 1. Update API routes to use only environment variables
  - Remove header-based API key fallback logic from all API endpoints
  - Enhance error handling for missing environment variables
  - Ensure consistent error messages across all endpoints
  - _Requirements: 1.2, 1.3, 3.2, 4.1, 4.2_

- [x] 1.1 Modify enrich API route to remove header fallback
  - Remove `request.headers.get('X-OpenAI-API-Key')` and `request.headers.get('X-Firecrawl-API-Key')` fallback logic
  - Update error handling to return server configuration error when environment variables are missing
  - Test the endpoint with missing environment variables to ensure proper error response
  - _Requirements: 1.2, 1.3, 3.2, 4.1, 4.2_

- [x] 1.2 Modify scrape API route to remove header fallback
  - Remove `request.headers.get('X-Firecrawl-API-Key')` fallback logic
  - Update error handling to return server configuration error when environment variables are missing
  - Ensure error message consistency with other endpoints
  - _Requirements: 1.2, 1.3, 3.2, 4.1, 4.2_

- [x] 1.3 Update generate-fields API route error handling
  - Enhance error message for missing OpenAI API key to match other endpoints
  - Ensure consistent error response format across all API routes
  - _Requirements: 4.1, 4.2_

- [x] 2. Remove API key modal and related UI components
  - Remove all API key input forms, modals, and validation UI
  - Remove API key-related state management from the main page component
  - Clean up unused imports and dependencies
  - _Requirements: 2.1, 3.1, 3.3_

- [x] 2.1 Remove API key modal dialog from main page
  - Remove Dialog component for API key input
  - Remove all API key input fields and validation logic
  - Remove buttons for getting API keys from external sites
  - _Requirements: 2.1, 3.1_

- [x] 2.2 Remove API key state management
  - Remove all useState hooks related to API key management (showApiKeyModal, firecrawlApiKey, openaiApiKey, etc.)
  - Remove API key validation state and loading states
  - Remove pendingCSVData state used for API key flow
  - _Requirements: 2.1, 3.1, 3.3_

- [x] 2.3 Remove API key checking useEffect and localStorage logic
  - Remove environment checking useEffect that calls /api/check-env
  - Remove localStorage API key retrieval and storage logic
  - Remove API key validation functions
  - _Requirements: 2.1, 3.1, 3.3_

- [x] 3. Simplify CSV upload flow
  - Modify handleCSVUpload to proceed directly to setup without API key checks
  - Remove conditional logic that shows API key modal
  - Ensure smooth transition from upload to field selection
  - _Requirements: 1.1, 2.2_

- [x] 3.1 Update CSV upload handler
  - Remove API key checking logic from handleCSVUpload function
  - Remove pendingCSVData flow and directly set csvData and proceed to setup
  - Remove calls to /api/check-env and localStorage checks
  - _Requirements: 1.1, 2.2_

- [x] 3.2 Remove API key submission handler
  - Remove handleApiKeySubmit function entirely
  - Remove API key validation and localStorage saving logic
  - Clean up any related helper functions
  - _Requirements: 3.1, 3.3_

- [x] 4. Update error handling and user messaging
  - Implement proper error handling for server configuration issues
  - Update user-facing error messages to be appropriate for server-managed keys
  - Remove any references to user-provided API keys in error messages
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 4.1 Add server configuration error handling to frontend
  - Add error handling for 500 responses from API routes
  - Display user-friendly "Service temporarily unavailable" messages
  - Remove any error messages that suggest users provide API keys
  - _Requirements: 4.1, 4.3_

- [x] 4.2 Test error scenarios
  - Create test cases for missing environment variables
  - Verify proper error responses from all API endpoints
  - Test frontend error handling with server configuration errors
  - _Requirements: 4.1, 4.2_

- [x] 5. Clean up unused code and dependencies
  - Remove unused imports and components related to API key management
  - Clean up any remaining references to localStorage API key storage
  - Verify no dead code remains from the API key flow
  - _Requirements: 3.1, 3.3_

- [x] 5.1 Remove unused imports and clean up code
  - Remove unused React hooks and components related to API key functionality
  - Remove unused utility functions for API key validation
  - Clean up any commented code or unused variables
  - _Requirements: 3.1, 3.3_