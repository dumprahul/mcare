'use client';

import { useEffect, useState } from 'react';

interface LiFiData {
  '-1': number;
  '-1.1': number;
  'Critical': string;
  'False': boolean;
  'PD01': string;
  'RAHUL': string;
}

export default function LiFiDataPage() {
  const [data, setData] = useState<LiFiData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(5000); // 5 seconds default

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/lifi');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const jsonData = await response.json();
        setData(jsonData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    
    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading LiFi Data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-lg">
          <div className="flex items-center">
            <svg className="h-6 w-6 text-red-500 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">LiFi Data Dashboard</h1>
          <div className="flex items-center space-x-4">
            <label className="text-sm text-gray-600">Refresh Interval:</label>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value={1000}>1 second</option>
              <option value={5000}>5 seconds</option>
              <option value={10000}>10 seconds</option>
              <option value={30000}>30 seconds</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((item, index) => (
            <div key={index} className="bg-white overflow-hidden shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-300">
              <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900">Sensor {index + 1}</h3>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Signal -1</div>
                    <div className="mt-1 text-lg text-gray-900">{item['-1']}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Signal -1.1</div>
                    <div className="mt-1 text-lg text-gray-900">{item['-1.1']}</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Status</div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      item.Critical === 'Normal' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.Critical}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Active</div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      !item.False 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.False ? 'False' : 'True'}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <div className="text-sm font-medium text-gray-500">PD01</div>
                    <div className="mt-1 text-lg text-gray-900">{item.PD01}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">RAHUL</div>
                    <div className="mt-1 text-lg text-gray-900">{item.RAHUL}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 