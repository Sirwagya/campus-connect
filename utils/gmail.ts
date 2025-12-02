/**
 * Gmail API Integration
 * Handles token refresh and email fetching using Google OAuth tokens
 */

interface GoogleTokenResponse {
    access_token: string
    expires_in: number
    token_type: string
    scope?: string
}

interface GmailMessage {
    id: string
    threadId: string
}

interface GmailListResponse {
    messages: GmailMessage[]
    nextPageToken?: string
    resultSizeEstimate: number
}

/**
 * Refresh Google OAuth access token using refresh token
 * @param refreshToken - The Google refresh token
 * @returns New access token and expiry time
 */
export async function refreshGoogleToken(
    refreshToken: string
): Promise<{ accessToken: string; expiresIn: number }> {
    const tokenEndpoint = 'https://oauth2.googleapis.com/token'

    const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        }),
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to refresh token: ${error}`)
    }

    const data: GoogleTokenResponse = await response.json()

    return {
        accessToken: data.access_token,
        expiresIn: data.expires_in,
    }
}

/**
 * Fetch emails from Gmail API
 * @param accessToken - Valid Google OAuth access token
 * @param maxResults - Maximum number of messages to return (default: 10)
 * @param query - Gmail query string (default: &apos;is:unread&apos;)
 * @returns List of Gmail messages with IDs and thread IDs
 */
export async function fetchEmails(
    accessToken: string,
    maxResults: number = 10,
    query: string = 'is:unread'
): Promise<GmailListResponse> {
    const baseUrl = 'https://gmail.googleapis.com/gmail/v1/users/me/messages'

    const params = new URLSearchParams({
        maxResults: maxResults.toString(),
        q: query,
    })

    const response = await fetch(`${baseUrl}?${params.toString()}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to fetch emails: ${error}`)
    }

    const data: GmailListResponse = await response.json()
    return data
}

/**
 * Fetch a single email by ID
 * @param accessToken - Valid Google OAuth access token
 * @param messageId - Gmail message ID
 * @returns Full message details
 */
export async function fetchEmailById(
    accessToken: string,
    messageId: string
): Promise<GmailMessage> {
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to fetch email: ${error}`)
    }

    return response.json() as Promise<GmailMessage>;
}

/**
 * Get valid access token, refreshing if necessary
 * @param currentToken - Current access token
 * @param refreshToken - Refresh token
 * @param tokenExpiry - Token expiry timestamp
 * @returns Valid access token and new expiry
 */
export async function getValidAccessToken(
    currentToken: string,
    refreshToken: string,
    tokenExpiry: string
): Promise<{ accessToken: string; expiresAt: string }> {
    const now = new Date()
    const expiry = new Date(tokenExpiry)

    // If token expires in less than 5 minutes, refresh it
    const bufferTime = 5 * 60 * 1000 // 5 minutes
    if (expiry.getTime() - now.getTime() < bufferTime) {
        const { accessToken, expiresIn } = await refreshGoogleToken(refreshToken)
        const newExpiry = new Date(Date.now() + expiresIn * 1000).toISOString()

        return {
            accessToken,
            expiresAt: newExpiry,
        }
    }

    return {
        accessToken: currentToken,
        expiresAt: tokenExpiry,
    }
}
