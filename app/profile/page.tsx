'use client';

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ProfileForm from "./form";
import AIAnalysis from "./ai-analysis";
import { supabase } from "@/lib/supabase";

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

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState<VisitData[]>([]);
  const [profileHistory, setProfileHistory] = useState<ProfileData[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (session?.user?.email) {
        try {
          console.log('Fetching data for user:', session.user.email);
          setError(null);

          // Fetch current profile data
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', session.user.email)
            .single();

          if (profileError) {
            console.error('Error fetching profile:', profileError);
            // If the profile doesn't exist yet, that's okay - we'll create it when the form is submitted
            if (profileError.code === 'PGRST116') {
              console.log('No profile exists yet for this user');
              setProfileData(null);
            } else {
              throw profileError;
            }
          } else {
            console.log('Current profile:', profile);
            setProfileData(profile);
          }

          // Fetch profile history
          const { data: history, error: historyError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', session.user.email)
            .order('updated_at', { ascending: false });

          if (historyError) {
            console.error('Error fetching profile history:', historyError);
            throw historyError;
          }
          console.log('Profile history:', history);
          setProfileHistory(history || []);

          // Fetch visit history
          const { data: visitsData, error: visitsError } = await supabase
            .from('user_visits')
            .select('*')
            .eq('user_id', session.user.email)
            .order('visit_time', { ascending: false });

          if (visitsError) {
            console.error('Error fetching visit history:', visitsError);
            throw visitsError;
          }
          console.log('Visit history:', visitsData);
          setVisits(visitsData || []);

          // Record new visit
          const visitData = {
            browser: navigator.userAgent,
            device: /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
            location: window.location.href
          };

          const { error: insertError } = await supabase
            .from('user_visits')
            .insert({
              user_id: session.user.email,
              visit_data: visitData
            });

          if (insertError) {
            console.error('Error recording visit:', insertError);
            throw insertError;
          }

        } catch (error: any) {
          console.error('Error in fetchData:', error);
          setError(error.message || 'An error occurred while fetching data');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [session]);

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
      router.push('/auth/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column - Profile and Form */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-8">
              <div className="flex items-center justify-center">
                {session?.user?.image && (
                  <img
                    className="h-32 w-32 rounded-full"
                    src={session.user.image}
                    alt="Profile"
                  />
                )}
              </div>
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-black text-center">
                  Profile Details
                </h2>
                <div className="mt-6 space-y-4">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Name:</span>
                    <span className="text-black font-medium">{session?.user?.name}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Email:</span>
                    <span className="text-black font-medium">{session?.user?.email}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Provider:</span>
                    <span className="text-black font-medium capitalize">
                      {session?.user?.provider}
                    </span>
                  </div>
                </div>
              </div>
              
              {session?.user?.email && (
                <>
                  <ProfileForm userId={session.user.email} />
                  <div className="mt-4">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Column - History and AI Analysis */}
          <div className="space-y-8">
            {/* Profile History */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-8">
                <h3 className="text-xl font-semibold text-black mb-4">Profile History</h3>
                {profileHistory.length === 0 ? (
                  <div className="text-gray-500 text-center py-4">
                    No profile history available. Please update your profile to see history.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profileHistory.map((profile, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600 mb-2">
                          Updated: {new Date(profile.updated_at).toLocaleString()}
                        </div>
                        <div className="space-y-2 text-black">
                          <p><span className="font-medium">Job Title:</span> {profile.job_title}</p>
                          <p><span className="font-medium">Job Description:</span> {profile.job_description}</p>
                          <p><span className="font-medium">Gender:</span> {profile.gender}</p>
                          <p><span className="font-medium">Address:</span> {profile.address}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Visit History */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-8">
                <h3 className="text-xl font-semibold text-black mb-4">Visit History</h3>
                {visits.length === 0 ? (
                  <div className="text-gray-500 text-center py-4">
                    No visit history available. Your visits will be recorded here.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {visits.map((visit) => (
                      <div key={visit.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            {new Date(visit.visit_time).toLocaleString()}
                          </span>
                          <span className="text-sm text-gray-500">
                            {visit.visit_data.device}
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-black">
                          <p>Browser: {visit.visit_data.browser}</p>
                          <p>Location: {visit.visit_time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* AI Analysis */}
            {profileHistory.length > 0 && <AIAnalysis profileHistory={profileHistory} />}
          </div>
        </div>
      </div>
    </div>
  );
} 