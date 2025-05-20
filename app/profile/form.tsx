'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface FormData {
  jobTitle: string;
  jobDescription: string;
  gender: string;
  address: string;
}

export default function ProfileForm({ userId }: { userId: string }) {
  const [formData, setFormData] = useState<FormData>({
    jobTitle: '',
    jobDescription: '',
    gender: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error) throw error;
        
        if (data) {
          setFormData({
            jobTitle: data.job_title || '',
            jobDescription: data.job_description || '',
            gender: data.gender || '',
            address: data.address || ''
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setInitialLoad(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          job_title: formData.jobTitle,
          job_description: formData.jobDescription,
          gender: formData.gender,
          address: formData.address,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      setMessage('Profile updated successfully!');
    } catch (error) {
      setMessage('Error updating profile. Please try again.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoad) {
    return (
      <div className="mt-8">
        <div className="text-center">Loading profile data...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Problem Title</label>
          <input
            type="text"
            value={formData.jobTitle}
            onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Problem Description</label>
          <textarea
            value={formData.jobDescription}
            onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={3}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Gender</label>
          <select
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">More Information</label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={2}
            required
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {message && (
        <div className={`text-sm ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </div>
      )}
    </form>
  );
} 