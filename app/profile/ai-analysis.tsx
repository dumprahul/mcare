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

interface VisitData {
  id: string;
  visit_time: string;
  visit_data: {
    browser: string;
    device: string;
    location: string;
  };
}

interface DeviceVital {
  id: number;
  patient_id: string;
  name: string;
  heart_rate: number;
  spo2: number;
  touch: boolean;
  timestamp: number;
  condition: string;
}

interface AIAnalysisProps {
  profileHistory: ProfileData[];
  visits: VisitData[];
  deviceVitals: DeviceVital[];
}

export default function AIAnalysis({ profileHistory, visits, deviceVitals }: AIAnalysisProps) {
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
          subject: 'Your Patient Data Analysis - Marutham Care',
          content: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Patient Data Analysis</h2>
              <p>Dear ${session?.user?.name},</p>
              <p>Here is your patient data analysis as requested:</p>
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

      if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
        throw new Error('Gemini API key is not configured');
      }

      // Initialize Gemini API
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

      // Format the data for analysis
      const profileSummary = profileHistory.map(profile => ({
        date: new Date(profile.updated_at).toLocaleString(),
        job_title: profile.job_title,
        job_description: profile.job_description,
        gender: profile.gender,
        address: profile.address
      }));
      const visitSummary = visits.map(visit => ({
        date: new Date(visit.visit_time).toLocaleString(),
        device: visit.visit_data.device,
        browser: visit.visit_data.browser,
        location: visit.visit_data.location
      }));
      const deviceSummary = deviceVitals.map(vital => ({
        patient_id: vital.patient_id,
        name: vital.name,
        heart_rate: vital.heart_rate,
        spo2: vital.spo2,
        touch: vital.touch,
        timestamp: new Date(vital.timestamp * 1000).toLocaleString(),
        condition: vital.condition
      }));

      // Create a prompt for the AI (hospital/patient context)
      const prompt = `Analyze the following patient data from a hospital user management system and provide insights.\n\nPatient Profile History:\n${JSON.stringify(profileSummary, null, 2)}\n\nVisit History:\n${JSON.stringify(visitSummary, null, 2)}\n\nDevice Vitals:\n${JSON.stringify(deviceSummary, null, 2)}\n\nPlease provide:\n1. Health/vital sign trends and anomalies\n2. Visit patterns and suggestions for follow-up\n3. Device data insights (e.g., abnormal readings)\n4. Risk factors or alerts\n5. Suggestions for care or monitoring\n\nFormat the response in a clear, concise manner with bullet points.`;

      // Generate content
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        setAnalysis(text);
        await sendEmail(text);
      } catch (apiError: any) {
        throw new Error(`Gemini API Error: ${apiError.message}`);
      }
    } catch (error: any) {
      console.error('Detailed error in AI analysis:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      let errorMessage = 'Failed to analyze patient data. ';
      
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
            Analyze Patient Data
          </button>
        )}

        {loading && (
          <div className="flex justify-center items-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Analyzing patient data...</span>
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