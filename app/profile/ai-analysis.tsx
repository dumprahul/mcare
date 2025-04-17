'use client';

import { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useSession } from 'next-auth/react';

interface ProfileData {
  job_title: string;
  job_description: string;
  gender: string;
  address: string;
  updated_at: string;
}

interface AIAnalysisProps {
  profileHistory: ProfileData[];
}

export default function AIAnalysis({ profileHistory }: AIAnalysisProps) {
  const { data: session } = useSession();
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const sendEmail = async (content: string) => {
    try {
      console.log('Attempting to send email to:', session?.user?.email);
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: session?.user?.email,
          subject: 'Your Job History Analysis - Marutham Care',
          content: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Job History Analysis</h2>
              <p>Dear ${session?.user?.name},</p>
              <p>Here is your job history analysis as requested:</p>
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                ${content.split('\n').map(line => `<p>${line}</p>`).join('')}
              </div>
              <p>Best regards,<br>Marutham Care Team</p>
            </div>
          `,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Email send error response:', data);
        throw new Error(data.details || 'Failed to send email');
      }

      console.log('Email sent successfully:', data);
      setEmailSent(true);
    } catch (error: any) {
      console.error('Error sending email:', error);
      setError(`Failed to send email: ${error.message}`);
    }
  };

  const analyzeProfileHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      setEmailSent(false);

      // Check if API key is available
      if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
        throw new Error('Gemini API key is not configured');
      }

      console.log('Starting AI analysis with profile history:', profileHistory);

      // Initialize the Gemini API with the correct model
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      });

      // Format the profile history data for analysis
      const profileSummary = profileHistory.map(profile => ({
        date: new Date(profile.updated_at).toLocaleString(),
        job_title: profile.job_title,
        job_description: profile.job_description,
        gender: profile.gender,
        address: profile.address
      }));

      console.log('Formatted profile summary:', profileSummary);

      // Create a prompt for the AI
      const prompt = `Analyze the following job history data and provide insights:
      
      Profile History:
      ${JSON.stringify(profileSummary, null, 2)}
      
      Please provide:
      1. Job title and description patterns
      2. Changes in job roles over time
      3. Key skills and responsibilities mentioned
      4. Career progression insights
      5. Suggestions for professional development
      
      Format the response in a clear, concise manner with bullet points.`;

      console.log('Sending prompt to Gemini API');

      try {
        // Generate content
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log('Received response from Gemini API:', text);
        setAnalysis(text);
        
        // Send the analysis via email
        await sendEmail(text);
      } catch (apiError: any) {
        console.error('Gemini API Error:', {
          message: apiError.message,
          status: apiError.status,
          details: apiError.details
        });
        throw new Error(`Gemini API Error: ${apiError.message}`);
      }
    } catch (error: any) {
      console.error('Detailed error in AI analysis:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      let errorMessage = 'Failed to analyze profile history. ';
      
      if (error.message.includes('API key')) {
        errorMessage += 'API key is not configured correctly.';
      } else if (error.message.includes('quota')) {
        errorMessage += 'API quota exceeded. Please try again later.';
      } else if (error.message.includes('network')) {
        errorMessage += 'Network error. Please check your connection.';
      } else if (error.message.includes('Gemini API Error')) {
        errorMessage += error.message.replace('Gemini API Error: ', '');
      } else {
        errorMessage += error.message || 'Please try again later.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-8">
        <h3 className="text-xl font-semibold text-black mb-4">AI Analysis</h3>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
            <div className="mt-2">
              <button
                onClick={() => setError(null)}
                className="text-sm text-red-600 hover:text-red-800 mr-4"
              >
                Dismiss
              </button>
              <button
                onClick={analyzeProfileHistory}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {!analysis && !loading && (
          <button
            onClick={analyzeProfileHistory}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Analyze Job History
          </button>
        )}

        {loading && (
          <div className="flex justify-center items-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Analyzing job history...</span>
          </div>
        )}

        {analysis && (
          <div className="mt-4">
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-black">
                {analysis}
              </pre>
            </div>
            {emailSent && (
              <div className="mt-4 p-4 bg-green-50 text-green-600 rounded-lg">
                <p>Analysis has been sent to your email: {session?.user?.email}</p>
              </div>
            )}
            <button
              onClick={() => setAnalysis('')}
              className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Clear Analysis
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 