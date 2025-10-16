import { useState, useEffect } from 'react'

function App() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/api/v1/health')
      .then(res => res.json())
      .then(data => {
        setHealthStatus(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Backend connection failed:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-blue-600 mb-4">
          Claims Management System
        </h1>
        <p className="text-gray-600 mb-6">
          Healthcare Claims Processing Platform
        </p>
        
        <div className="border-t pt-4">
          <h2 className="text-lg font-semibold mb-2">System Status</h2>
          {loading ? (
            <p className="text-gray-500">Checking backend connection...</p>
          ) : healthStatus ? (
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                <span className="text-green-700 font-semibold">Backend Online</span>
              </div>
              <p className="text-sm text-gray-600">
                API Version: {healthStatus.version}
              </p>
              <p className="text-sm text-gray-600">
                Status: {healthStatus.status}
              </p>
            </div>
          ) : (
            <div className="flex items-center">
              <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
              <span className="text-red-700 font-semibold">Backend Offline</span>
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t">
          <p className="text-sm text-gray-500 text-center">
            Phase 2: MVP Development
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
