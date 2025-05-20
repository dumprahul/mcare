"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, Fragment } from "react";
import ProfileForm from "./form";
import AIAnalysis from "./ai-analysis";
import { supabase } from "@/lib/supabase";
import { RainbowButton } from '@/components/magicui/rainbow-button';
import { AnimatedShinyText } from '@/components/magicui/animated-shiny-text';
import { WarpBackground } from '@/components/magicui/warp-background';

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

// Modal component for showing all device data
function DeviceDataModal({ open, onClose, deviceVitals }: { open: boolean, onClose: () => void, deviceVitals: DeviceVital[] }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-4 text-center">All Device Datas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {deviceVitals.map((vital: DeviceVital) => (
            <div key={vital.id} className="flex flex-col items-start border rounded-xl p-4 bg-gray-50">
              <span className="text-sm text-gray-600">{vital.name} ({vital.patient_id})</span>
              <span className="text-lg font-semibold text-gray-800 mt-1">
                HR: {vital.heart_rate} bpm, SpO₂: {vital.spo2}%
              </span>
              <span className={`text-xs mt-1 ${vital.condition === 'normal' ? 'text-green-600' : 'text-red-600'}`}>
                {vital.condition
                  ? vital.condition.charAt(0).toUpperCase() + vital.condition.slice(1)
                  : 'Unknown'}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(vital.timestamp * 1000).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  // All hooks at the top
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState<VisitData[]>([]);
  const [profileHistory, setProfileHistory] = useState<ProfileData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showAllProfileHistory, setShowAllProfileHistory] = useState(false);
  const [showAllVisitHistory, setShowAllVisitHistory] = useState(false);
  const PROFILE_HISTORY_PREVIEW = 2;
  const VISIT_HISTORY_PREVIEW = 2;

  // Device Vitals State
  const [deviceVitals, setDeviceVitals] = useState<DeviceVital[]>([]);
  const [deviceLoading, setDeviceLoading] = useState(true);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [showDeviceModal, setShowDeviceModal] = useState(false);

  // Dummy data for hospital context
  const dummyAppointments = [
    { date: 'Mon, 10 Jun', time: '10:00 am', title: 'General Checkup', platform: 'Room 101', link: '#' },
    { date: 'Tue, 11 Jun', time: '02:30 pm', title: 'Cardiology Consultation', platform: 'Room 202', link: '#' },
    { date: 'Wed, 12 Jun', time: '09:00 am', title: 'Lab Tests', platform: 'Lab A', link: '#' },
    { date: 'Thu, 13 Jun', time: '11:15 am', title: 'Follow-up Visit', platform: 'Room 105', link: '#' },
  ];
  const dummyMetrics = [
    { name: 'Blood Pressure', value: 120, unit: 'mmHg', color: 'bg-blue-400' },
    { name: 'Heart Rate', value: 78, unit: 'bpm', color: 'bg-yellow-400' },
    { name: 'Blood Sugar', value: 92, unit: 'mg/dL', color: 'bg-blue-400' },
    { name: 'Cholesterol', value: 180, unit: 'mg/dL', color: 'bg-yellow-400' },
    { name: 'BMI', value: 24, unit: '', color: 'bg-blue-400' },
  ];
  const dummyStats = [
    { label: 'Patients Admitted', value: 42, color: 'from-pink-200 to-pink-400', icon: '🏥' },
    { label: 'Discharges Today', value: 7, color: 'from-blue-200 to-blue-400', icon: '✅' },
  ];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (session?.user?.email) {
        try {
          setError(null);
          // Fetch current profile data
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', session.user.email)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (profileError) {
            console.error('Error fetching profile:', profileError, JSON.stringify(profileError));
            setError(profileError.message || JSON.stringify(profileError));
          } else {
            setProfileData(profile);
          }
          // Fetch profile history
          const { data: history, error: historyError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', session.user.email)
            .order('updated_at', { ascending: false });
          if (historyError) {
            setError(historyError.message || JSON.stringify(historyError));
          }
          setProfileHistory(history || []);
          // Fetch visit history
          const { data: visitsData, error: visitsError } = await supabase
            .from('user_visits')
            .select('*')
            .eq('user_id', session.user.email)
            .order('visit_time', { ascending: false });
          if (visitsError) {
            setError(visitsError.message || JSON.stringify(visitsError));
          }
          setVisits(visitsData || []);
          // Record new visit
          const visitData = {
            browser: navigator.userAgent,
            device: /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
            location: window.location.href
          };
          await supabase
            .from('user_visits')
            .insert({
              user_id: session.user.email,
              visit_data: visitData
            });
        } catch (error: any) {
          setError(error.message || 'An error occurred while fetching data');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [session]);

  // Fetch device vitals from API route
  useEffect(() => {
    async function fetchVitals() {
      setDeviceLoading(true);
      setDeviceError(null);
      try {
        const res = await fetch('/api/device-vitals');
        if (!res.ok) throw new Error("Failed to fetch device vitals");
        const data = await res.json();
        setDeviceVitals(data);
      } catch (err: any) {
        setDeviceError(err.message || "Failed to fetch device vitals");
      } finally {
        setDeviceLoading(false);
      }
    }
    fetchVitals();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
      router.push('/auth/signin');
    } catch (error) {
      // eslint-disable-next-line no-console
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
    <WarpBackground className="min-h-screen py-8 px-2 md:px-6 lg:px-12">
      {/* Main dashboard grid */}
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {/* Left: Profile Card */}
        <div className="flex flex-col h-full">
          <div className="rounded-3xl bg-white shadow-xl p-8 flex flex-col items-center flex-1 min-h-[520px]">
            {session?.user?.image ? (
              <img className="h-24 w-24 rounded-full border-4 border-blue-300 shadow mb-4" src={session.user.image} alt="Profile" />
            ) : (
              <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-blue-200 to-blue-400 flex items-center justify-center text-4xl font-bold text-white mb-4 border-4 border-blue-300 shadow">
                {session?.user?.name?.[0] || '?'}
              </div>
            )}
            <div className="text-center w-full">
              <span className="text-2xl font-bold text-black block mb-1">{session?.user?.name}</span>
              <div className="text-gray-500 text-sm mb-2">{session?.user?.email}</div>
              <div className="text-xs text-gray-400 mb-4">{session?.user?.provider || 'Google'}</div>
            </div>
            <ProfileForm userId={session?.user?.email || ''} />
            <div className="w-full mt-8 flex-1 flex items-end">
              <RainbowButton
                onClick={handleSignOut}
                className="w-full py-2 px-4 text-base font-semibold rounded-xl shadow-lg hover:scale-105 transition-transform duration-200 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white"
              >
                Sign Out
              </RainbowButton>
            </div>
          </div>
        </div>
        {/* Center: Vitals Overview/Graph */}
        <div className="flex flex-col gap-8 h-full">
          <div className="rounded-3xl bg-white shadow-xl p-8 flex flex-col min-h-[240px] h-full mb-0">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xl font-bold text-gray-800">Vitals Overview</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Range:</span>
                <select className="rounded-lg border border-gray-200 px-2 py-1 text-xs bg-gray-50">
                  <option>Last week</option>
                </select>
              </div>
            </div>
            <div className="text-xs text-gray-400 mb-4">Patient vital signs analytics</div>
            {/* Dummy Graph */}
            <div className="w-full h-32 flex items-end mb-2">
              <svg width="100%" height="100%" viewBox="0 0 400 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="0" width="400" height="80" rx="16" fill="#f7f8fa" />
                <polyline points="0,60 40,40 80,70 120,20 160,40 200,10 240,50 280,30 320,60 360,40 400,70" fill="none" stroke="#f87171" strokeWidth="3" />
                <polyline points="0,70 40,60 80,80 120,50 160,60 200,40 240,70 280,60 320,70 360,60 400,80" fill="none" stroke="#60a5fa" strokeWidth="3" />
              </svg>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-3 h-1 rounded-full bg-red-400 inline-block" /> Systolic/Diastolic</span>
                <span className="flex items-center gap-1"><span className="w-3 h-1 rounded-full bg-blue-400 inline-block" /> Heart Rate</span>
              </div>
              <div className="text-2xl font-bold text-gray-700">41% <span className="text-xs font-normal">Avg. Stability</span></div>
            </div>
          </div>
          {/* Device Datas Box */}
          <div className="rounded-3xl bg-white shadow-xl p-8 flex flex-col min-h-[240px] h-full mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xl font-bold text-gray-800">Device Datas</span>
              {deviceVitals.length > 4 && (
                <button
                  onClick={() => setShowDeviceModal(true)}
                  className="text-xs text-blue-500 hover:underline font-semibold"
                >
                  Show more
                </button>
              )}
            </div>
            <div className="text-xs text-gray-400 mb-4">Connected medical device readings (live data)</div>
            {deviceLoading ? (
              <div className="text-gray-500">Loading device data...</div>
            ) : deviceError ? (
              <div className="text-red-500">Error: {deviceError}</div>
            ) : (
              <div className="grid grid-cols-2 gap-6 mb-2">
                {deviceVitals.slice(0, 4).map((vital) => (
                  <div key={vital.id} className="flex flex-col items-start border rounded-xl p-4 bg-gray-50">
                    <span className="text-sm text-gray-600">{vital.name} ({vital.patient_id})</span>
                    <span className="text-lg font-semibold text-gray-800 mt-1">
                      HR: {vital.heart_rate} bpm, SpO₂: {vital.spo2}%
                    </span>
                    <span className={`text-xs mt-1 ${vital.condition === 'normal' ? 'text-green-600' : 'text-red-600'}`}>
                      {vital.condition
                        ? vital.condition.charAt(0).toUpperCase() + vital.condition.slice(1)
                        : 'Unknown'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(vital.timestamp * 1000).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {/* Modal for all device data */}
            <DeviceDataModal
              open={showDeviceModal}
              onClose={() => setShowDeviceModal(false)}
              deviceVitals={deviceVitals}
            />
          </div>
          {/* Stats Cards */}
          <div className="flex gap-6 mt-6">
            {dummyStats.map((stat, i) => (
              <div key={i} className={`flex-1 rounded-2xl p-6 bg-gradient-to-br ${stat.color} shadow-md flex flex-col items-start justify-between min-h-[120px]`}>
                <div className="text-2xl mb-2">{stat.icon}</div>
                <div className="text-3xl font-bold text-gray-800">{stat.value}</div>
                <div className="text-xs text-gray-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl bg-white shadow p-4 flex items-center justify-between mt-4">
            <span className="text-gray-600 text-sm">Active patients monitored</span>
            <span className="text-gray-900 font-semibold text-sm">18 currently</span>
          </div>
        </div>
        {/* Right: Recent Appointments and Health Metrics */}
        <div className="flex flex-col gap-8 h-full">
          <div className="rounded-3xl bg-white shadow-xl p-8 min-h-[240px] flex-1">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xl font-bold text-gray-800">Recent Appointments</span>
              <span className="text-gray-400 cursor-pointer"><svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#d1d5db" strokeWidth="2" /><path d="M8 12h8M12 8v8" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" /></svg></span>
            </div>
            <div className="flex flex-col gap-3">
              {dummyAppointments.map((appt, i) => (
                <div key={i} className="flex items-center justify-between hover:bg-gray-50 rounded-lg px-2 py-1 transition">
                  <div>
                    <div className="text-xs text-gray-400">{appt.date}, {appt.time}</div>
                    <div className="text-sm font-medium text-gray-700">{appt.title}</div>
                  </div>
                  <span className="text-xs text-blue-500 font-semibold">{appt.platform}</span>
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-400 mt-4 cursor-pointer hover:underline">See all appointments &rarr;</div>
          </div>
          <div className="rounded-3xl bg-white shadow-xl p-8 min-h-[240px] flex-1">
            <span className="text-xl font-bold text-gray-800 mb-4 block">Health Metrics</span>
            <div className="flex flex-col gap-4">
              {dummyMetrics.map((metric, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{metric.name}</span>
                  <div className="flex-1 mx-4">
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                      <div className={`h-2 rounded-full ${metric.color}`} style={{ width: `${Math.min(metric.value, 100)}%` }} />
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 font-semibold">{metric.value}{metric.unit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Profile History and Visit History below dashboard */}
      <div className="max-w-[1400px] mx-auto mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile History Box */}
        <div className="rounded-3xl bg-white shadow-xl p-8 min-h-[320px] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xl font-bold text-black block">Profile History</span>
            {profileHistory.length > PROFILE_HISTORY_PREVIEW && (
              <button
                className="text-xs text-blue-500 hover:underline"
                onClick={() => setShowAllProfileHistory((v) => !v)}
              >
                {showAllProfileHistory ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
          {profileHistory.length === 0 ? (
            <div className="text-gray-500 text-center py-4">
              No profile history available. Please update your profile to see history.
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto">
              {(showAllProfileHistory ? profileHistory : profileHistory.slice(0, PROFILE_HISTORY_PREVIEW)).map((profile, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-600 mb-2">
                    Updated: {new Date(profile.updated_at).toLocaleString()}
                  </div>
                  <div className="space-y-2 text-black">
                    <p><span className="font-medium">Problem Title:</span> {profile.job_title}</p>
                    <p><span className="font-medium">Problem Description:</span> {profile.job_description}</p>
                    <p><span className="font-medium">Gender:</span> {profile.gender}</p>
                    <p><span className="font-medium">More Information:</span> {profile.address}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Visit History Box */}
        <div className="rounded-3xl bg-white shadow-xl p-8 min-h-[320px] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xl font-bold text-black block">Visit History</span>
            {visits.length > VISIT_HISTORY_PREVIEW && (
              <button
                className="text-xs text-blue-500 hover:underline"
                onClick={() => setShowAllVisitHistory((v) => !v)}
              >
                {showAllVisitHistory ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
          {visits.length === 0 ? (
            <div className="text-gray-500 text-center py-4">
              No visit history available. Your visits will be recorded here.
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto">
              {(showAllVisitHistory ? visits : visits.slice(0, VISIT_HISTORY_PREVIEW)).map((visit) => (
                <div key={visit.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col md:flex-row md:justify-between md:items-center">
                  <div>
                    <span className="text-sm text-gray-600 block">
                      {new Date(visit.visit_time).toLocaleString()}
                    </span>
                    <div className="mt-2 text-sm text-black">
                      <p>Browser: {visit.visit_data.browser}</p>
                      <p>Location: {visit.visit_time}</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500 mt-2 md:mt-0 md:ml-4">
                    {visit.visit_data.device}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* AI Analysis below dashboard */}
      <div className="max-w-[1400px] mx-auto mt-10">
        {profileHistory.length > 0 && <AIAnalysis profileHistory={profileHistory} />}
      </div>
    </WarpBackground>
  );
} 