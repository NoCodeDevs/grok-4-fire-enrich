# Requirements Document

## Introduction

This feature removes the user API key input functionality from the Fire Enrich application, ensuring that the app exclusively uses the server-side configured API keys (FIRECRAWL_API_KEY and OPENAI_API_KEY) from the environment variables. Users should no longer be prompted to enter their own API keys, and the application should work seamlessly with the pre-configured keys.

## Requirements

### Requirement 1

**User Story:** As an application owner, I want the app to use only my configured API keys, so that users don't need to provide their own keys and I maintain control over API usage and costs.

#### Acceptance Criteria

1. WHEN a user uploads a CSV file THEN the system SHALL proceed directly to the setup phase without checking for user-provided API keys
2. WHEN the system needs to make API calls THEN it SHALL use only the server-side environment variables (FIRECRAWL_API_KEY and OPENAI_API_KEY)
3. WHEN the required environment variables are missing THEN the system SHALL display a server configuration error message instead of prompting users for keys

### Requirement 2

**User Story:** As a user, I want to use the enrichment tool without being asked for API keys, so that I can focus on my data enrichment tasks without additional setup steps.

#### Acceptance Criteria

1. WHEN I access the Fire Enrich page THEN the system SHALL NOT display any API key input modals or forms
2. WHEN I upload a CSV file THEN the system SHALL immediately proceed to field selection without API key validation steps
3. WHEN the enrichment process starts THEN it SHALL work transparently using the server's configured API keys

### Requirement 3

**User Story:** As an application owner, I want to remove all client-side API key storage and validation, so that there are no security risks from storing keys in localStorage or transmitting them via headers.

#### Acceptance Criteria

1. WHEN the application loads THEN it SHALL NOT check localStorage for saved API keys
2. WHEN making API requests THEN the system SHALL NOT include X-OpenAI-API-Key or X-Firecrawl-API-Key headers from client-side storage
3. WHEN the application runs THEN it SHALL NOT store any API keys in browser localStorage or sessionStorage

### Requirement 4

**User Story:** As an application owner, I want proper error handling when my server API keys are missing, so that I can quickly identify and fix configuration issues.

#### Acceptance Criteria

1. WHEN server environment variables are missing THEN the system SHALL display a clear "Server configuration error" message
2. WHEN API calls fail due to missing keys THEN the system SHALL log detailed error information for debugging
3. WHEN configuration errors occur THEN the system SHALL provide actionable guidance for the application owner (not end users)