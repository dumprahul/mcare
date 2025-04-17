import { NextResponse } from 'next/server';
import { google } from 'googleapis';

// Define the required OAuth scopes
const SCOPES = 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.compose';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Set credentials with proper error handling
try {
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    scope: SCOPES
  });
} catch (error) {
  console.error('Error setting OAuth credentials:', error);
}

export async function POST(request: Request) {
  try {
    console.log('Starting email send process...');
    console.log('Environment variables check:', {
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasRefreshToken: !!process.env.GOOGLE_REFRESH_TOKEN,
      hasSenderEmail: !!process.env.GMAIL_SENDER_EMAIL
    });

    // Verify OAuth client is properly configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error('Google OAuth credentials are not properly configured');
    }

    const { to, subject, content } = await request.json();
    console.log('Email details:', { to, subject, contentLength: content.length });

    // Create Gmail API instance with proper configuration
    const gmail = google.gmail({
      version: 'v1',
      auth: oauth2Client,
      retryConfig: {
        retry: 3,
        onRetryAttempt: (err) => {
          console.log('Retrying Gmail API call:', err);
        }
      }
    });

    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `From: Marutham Care <${process.env.GMAIL_SENDER_EMAIL}>`,
      `To: ${to}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${utf8Subject}`,
      '',
      content
    ];
    const message = messageParts.join('\n');

    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    console.log('Attempting to send email...');
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log('Email sent successfully:', res.data);
    return NextResponse.json({ success: true, messageId: res.data.id });
  } catch (error: any) {
    console.error('Detailed email error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      stack: error.stack
    });
    
    // Provide more specific error messages
    let errorMessage = 'Failed to send email';
    if (error.message.includes('unauthorized_client')) {
      errorMessage = 'OAuth client is not authorized. Please check your Google Cloud Console configuration.';
    } else if (error.message.includes('invalid_grant')) {
      errorMessage = 'Refresh token is invalid or expired. Please update your refresh token.';
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.message,
        code: error.code,
        response: error.response?.data
      },
      { status: 500 }
    );
  }
} 