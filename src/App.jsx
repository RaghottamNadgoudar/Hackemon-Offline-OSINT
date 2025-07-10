
import React, { useState, useEffect } from 'react';
import { MapPin, Lock, Unlock, Trophy, Target, Clock, AlertCircle } from 'lucide-react';

function App() {
    const [gameState, setGameState] = useState('idle');
    const [currentRiddle, setCurrentRiddle] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('ctf-token'));
    const [location, setLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [keys, setKeys] = useState([]);
    const [lastResult, setLastResult] = useState(null);
    const [completedRiddles, setCompletedRiddles] = useState([]);

    // Get user location
    useEffect(() => {
        if (navigator.geolocation) {
            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                    setLocationError(null);
                },
                (error) => {
                    setLocationError(`Location Error: ${error.message}`);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
                }
            );

            return () => navigator.geolocation.clearWatch(watchId);
        } else {
            setLocationError('Geolocation is not supported by this browser');
        }
    }, []);

    // API calls - Modified for Vercel
    const apiCall = async (endpoint, options = {}) => {
        const response = await fetch(`/api/${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            ...options
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Request failed');
        }

        return response.json();
    };

    const startChallenge = async () => {
        try {
            const response = await apiCall('start-challenge', { method: 'POST' });
            setToken(response.token);
            setCurrentRiddle(response.riddle);
            setGameState('active');
            setLastResult(null);
            setKeys([]);
            setCompletedRiddles([]);
            localStorage.setItem('ctf-token', response.token);
        } catch (error) {
            alert('Failed to start challenge: ' + error.message);
        }
    };

    const verifyLocation = async () => {
        if (!location) {
            alert('Location not available. Please enable location services.');
            return;
        }

        setIsVerifying(true);
        try {
            const response = await apiCall('verify-location', {
                method: 'POST',
                body: JSON.stringify({
                    latitude: location.latitude,
                    longitude: location.longitude
                })
            });

            setLastResult(response);

            if (response.success) {
                setKeys(prev => [...prev, response.key]);
                setCompletedRiddles(prev => [...prev, currentRiddle.number]);
                
                if (response.completed) {
                    setGameState('completed');
                } else {
                    setCurrentRiddle(response.nextRiddle);
                    setToken(response.token);
                    localStorage.setItem('ctf-token', response.token);
                }
            }
        } catch (error) {
            alert('Failed to verify location: ' + error.message);
        } finally {
            setIsVerifying(false);
        }
    };

    const resetChallenge = () => {
        setGameState('idle');
        setCurrentRiddle(null);
        setToken(null);
        setKeys([]);
        setLastResult(null);
        setCompletedRiddles([]);
        localStorage.removeItem('ctf-token');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                        🎯 Campus CTF Challenge
                    </h1>
                    <p className="text-xl text-gray-300">
                        Solve riddles, explore campus, collect keys
                    </p>
                </div>

                {/* Location Status */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <MapPin className="text-green-400" size={24} />
                            <div>
                                <p className="text-white font-semibold">Location Status</p>
                                {location ? (
                                    <p className="text-green-400 text-sm">
                                        📍 Active (±{Math.round(location.accuracy)}m accuracy)
                                    </p>
                                ) : (
                                    <p className="text-red-400 text-sm">
                                        ❌ {locationError || 'Waiting for location...'}
                                    </p>
                                )}
                            </div>
                        </div>
                        {location && (
                            <div className="text-right">
                                <p className="text-gray-300 text-sm">Current Position</p>
                                <p className="text-white text-xs font-mono">
                                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Game Content - Same as before */}
                {gameState === 'idle' && (
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 text-center">
                        <Target className="mx-auto mb-4 text-yellow-400" size={64} />
                        <h2 className="text-2xl font-bold text-white mb-4">
                            Welcome to Campus CTF
                        </h2>
                        <p className="text-gray-300 mb-6">
                            Test your OSINT skills and explore the campus! 
                            Solve riddles to find locations and collect keys.
                        </p>
                        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-6">
                            <div className="flex items-center justify-center space-x-2">
                                <AlertCircle className="text-yellow-400" size={20} />
                                <p className="text-yellow-400 font-medium">
                                    Location access required for this challenge
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={startChallenge}
                            disabled={!location}
                            className={`px-8 py-3 rounded-lg font-semibold transition-all ${
                                location
                                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            {location ? 'Start Challenge' : 'Waiting for Location...'}
                        </button>
                    </div>
                )}

                {/* Rest of the JSX remains the same... */}
                {gameState === 'active' && currentRiddle && (
                    <div className="space-y-6">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-white">
                                    🧩 Riddle {currentRiddle.number} of {currentRiddle.total}
                                </h3>
                                <div className="flex items-center space-x-2">
                                    <Clock className="text-blue-400" size={16} />
                                    <span className="text-blue-400 text-sm">Active</span>
                                </div>
                            </div>
                            <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                                <p className="text-gray-100 text-lg leading-relaxed">
                                    {currentRiddle.text}
                                </p>
                            </div>
                            <button
                                onClick={verifyLocation}
                                disabled={isVerifying || !location}
                                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                                    isVerifying
                                        ? 'bg-yellow-600 text-white'
                                        : location
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                {isVerifying ? '🔍 Verifying Location...' : '📍 Check My Location'}
                            </button>
                        </div>

                        {lastResult && (
                            <div className={`bg-white/10 backdrop-blur-md rounded-xl p-6 border-l-4 ${
                                lastResult.success ? 'border-green-500' : 'border-red-500'
                            }`}>
                                <div className="flex items-center space-x-3 mb-2">
                                    {lastResult.success ? (
                                        <Unlock className="text-green-400" size={20} />
                                    ) : (
                                        <Lock className="text-red-400" size={20} />
                                    )}
                                    <p className={`font-semibold ${
                                        lastResult.success ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                        {lastResult.success ? 'Correct Location!' : 'Wrong Location'}
                                    </p>
                                </div>
                                <p className="text-gray-300 text-sm">
                                    {lastResult.message || 
                                     `Distance: ${lastResult.distance}m | Attempts left: ${lastResult.attemptsLeft}`}
                                </p>
                            </div>
                        )}

                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
                            <h4 className="text-lg font-semibold text-white mb-4">
                                🔑 Collected Keys ({keys.length})
                            </h4>
                            <div className="space-y-2">
                                {keys.length > 0 ? (
                                    keys.map((key, index) => (
                                        <div key={index} className="bg-gray-800/50 rounded-lg p-3">
                                            <p className="text-green-400 font-mono text-sm">
                                                Key {index + 1}: {key}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-400 text-sm">No keys collected yet</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {gameState === 'completed' && (
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 text-center">
                        <Trophy className="mx-auto mb-4 text-yellow-400" size={64} />
                        <h2 className="text-3xl font-bold text-white mb-4">
                            🎉 Challenge Completed!
                        </h2>
                        <p className="text-gray-300 mb-6">
                            Congratulations! You have successfully completed the Campus CTF Challenge.
                        </p>
                        <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-6">
                            <p className="text-green-400 font-semibold">
                                Total Keys Collected: {keys.length}
                            </p>
                        </div>
                        <button
                            onClick={resetChallenge}
                            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
                        >
                            Start New Challenge
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
const apiCall = async (endpoint, options = {}) => {
    try {
        const response = await fetch(`/api/${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            ...options
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        const text = await response.text();
        console.log('Raw response:', text);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${text}`);
        }

        // Try to parse JSON
        if (text) {
            return JSON.parse(text);
        } else {
            throw new Error('Empty response from server');
        }
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
};


export default App;
