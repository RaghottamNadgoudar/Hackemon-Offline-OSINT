
import React, { useState, useEffect } from 'react';
import { MapPin, Lock, Unlock, Clock, AlertCircle } from 'lucide-react';
import hackemonLogo from './img/Hackemon_Logo.png';
import pikachuImage from './img/Pikachu_hi_transparent.png';
import ashImage from './img/Ash.png';
import charizardImage from './img/Charizard.png';
import blastoiseImage from './img/Blastoise.png';

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
    const [remainingAttempts, setRemainingAttempts] = useState(parseInt(import.meta.env.VITE_MAX_ATTEMPTS_PER_RIDDLE) || 3);
    const [showAttemptsPopup, setShowAttemptsPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState('');

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

    // API calls
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
            setRemainingAttempts(parseInt(import.meta.env.VITE_MAX_ATTEMPTS_PER_RIDDLE) || 3);
            localStorage.setItem('ctf-token', response.token);
        } catch (error) {
            alert('Failed to start challenge: ' + error.message);
        }
    };

    const verifyLocation = async () => {
        if (!location || isVerifying) return;

        setIsVerifying(true);
        try {
            const response = await apiCall('verify-location', {
                method: 'POST',
                body: JSON.stringify({
                    latitude: location.latitude,
                    longitude: location.longitude
                })
            });

            if (response.success) {
                setKeys(prev => [...prev, response.key]);
                setCompletedRiddles(prev => [...prev, currentRiddle.number]);
                setRemainingAttempts(parseInt(import.meta.env.VITE_MAX_ATTEMPTS_PER_RIDDLE) || 3);
                
                if (currentRiddle.number < 5) {
                    setCurrentRiddle(response.nextRiddle);
                    setToken(response.token);
                    localStorage.setItem('ctf-token', response.token);
                } else {
                    setGameState('completed');
                }
            } else {
                const newAttempts = remainingAttempts - 1;
                setRemainingAttempts(newAttempts);
                setPopupMessage(`Incorrect! ${newAttempts} attempt${newAttempts !== 1 ? 's' : ''} remaining.`);
                setShowAttemptsPopup(true);
                
                if (newAttempts <= 0) {
                    setTimeout(() => {
                        resetChallenge();
                        setPopupMessage('No more attempts! Challenge reset.');
                    }, 1500);
                }
            }
            setLastResult(response);
        } catch (error) {
            console.error('Error verifying location:', error);
            setLastResult({
                success: false,
                message: 'Error verifying location. Please try again.'
            });
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
        <div className="min-h-screen bg-gray-800 text-white relative overflow-hidden">
            {/* Attempts Popup */}
            {showAttemptsPopup && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border-2 border-yellow-400 rounded-xl p-6 max-w-sm w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-yellow-400">Attempts</h3>
                            <button 
                                onClick={() => setShowAttemptsPopup(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                        <p className="text-white mb-4">{popupMessage}</p>
                        <button
                            onClick={() => setShowAttemptsPopup(false)}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
            <img src={charizardImage} alt="Charizard" className="absolute top-0 right-0 w-1/3 sm:w-1/4 lg:w-1/5 opacity-30 sm:opacity-50 hidden sm:block" />
            <img src={blastoiseImage} alt="Blastoise" className="absolute bottom-0 left-0 w-1/3 sm:w-1/4 lg:w-1/5 opacity-30 sm:opacity-50 hidden sm:block" />

            <div className="container mx-auto px-4 py-6 sm:py-8 relative z-10">
                {/* Header */}
                <div className="text-center mb-6 sm:mb-8 flex items-center justify-center flex-col">
                    <img src={hackemonLogo} alt="Hackemon Logo" className="h-20 sm:h-24 md:h-32 mb-4"/>
                    <p className="text-base sm:text-lg text-gray-300 mt-2">
                        Gotta Catch 'Em All... Flags!
                    </p>
                </div>

                {/* Location Status */}
                <div className="bg-gray-900/50 backdrop-blur-md rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 border-2 border-yellow-400/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <MapPin className="text-red-500" size={24} />
                            <div>
                                <p className="text-white font-semibold text-sm sm:text-base">Poké-Tracker Status</p>
                                {location ? (
                                    <p className="text-green-400 text-xs sm:text-sm">
                                        ✅ Online (±{Math.round(location.accuracy)}m accuracy)
                                    </p>
                                ) : (
                                    <p className="text-red-400 text-xs sm:text-sm">
                                        ❌ {locationError || 'Awaiting signal...'}
                                    </p>
                                )}
                            </div>
                        </div>
                        {location && (
                            <div className="text-right">
                                <p className="text-gray-300 text-xs sm:text-sm">Your Coordinates</p>
                                <p className="text-white text-xs font-mono">
                                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Game Content */}
                {gameState === 'idle' && (
                    <div className="bg-gray-900/50 backdrop-blur-md rounded-xl p-6 sm:p-8 text-center border-2 border-yellow-400/50">
                        <img src={pikachuImage} alt="Pikachu" className="mx-auto mb-4 h-28 sm:h-32" />
                        <h2 className="text-xl sm:text-2xl font-bold text-yellow-400 mb-4 text-shadow-custom">
                            Welcome, Trainer!
                        </h2>
                        <p className="text-gray-300 mb-6 text-sm sm:text-base">
                            Your OSINT journey is about to begin. 
                            Use your skills to find locations and collect all the Gym Badges (keys).
                        </p>
                        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 sm:p-4 mb-6">
                            <div className="flex items-center justify-center space-x-2">
                                <AlertCircle className="text-red-400" size={20} />
                                <p className="text-red-400 font-medium text-sm sm:text-base">
                                    Poké-Tracker requires location access!
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={startChallenge}
                            disabled={!location}
                            className={`px-6 sm:px-8 py-3 rounded-lg font-semibold transition-all text-base sm:text-lg border-b-4 ${location ? 'bg-red-600 hover:bg-red-700 text-white border-red-800 hover:border-red-900 shadow-lg hover:shadow-xl' : 'bg-gray-600 text-gray-400 cursor-not-allowed border-gray-700'}`}
                        >
                            {location ? 'Start Your Adventure!' : 'Waiting for Signal...'}
                        </button>
                    </div>
                )}

                {gameState === 'active' && currentRiddle && (
                    <div className="space-y-6">
                        <div className="bg-gray-900/50 backdrop-blur-md rounded-xl p-4 sm:p-6 border-2 border-yellow-400/50">
                            <div className="space-y-2 mb-4">
                                <h3 className="text-lg sm:text-xl font-bold text-yellow-400 text-shadow-custom">
                                    Riddle #{currentRiddle.number} / {currentRiddle.total}
                                </h3>
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center space-x-1 bg-gray-800/80 px-3 py-1.5 rounded-full">
                                        <span className="text-xs sm:text-sm font-medium text-gray-300 whitespace-nowrap">Attempts:</span>
                                        <span className={`text-xs sm:text-sm font-bold ${
                                            remainingAttempts > 2 ? 'text-green-400' : 
                                            remainingAttempts > 1 ? 'text-yellow-400' : 'text-red-400'
                                        } whitespace-nowrap`}>
                                            {remainingAttempts}/{import.meta.env.VITE_MAX_ATTEMPTS_PER_RIDDLE || 3}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2 bg-gray-800/80 px-3 py-1.5 rounded-full">
                                        <Clock className="text-blue-400 flex-shrink-0" size={14} />
                                        <span className="text-blue-400 text-xs sm:text-sm whitespace-nowrap">In Progress</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-800/80 rounded-lg p-4 mb-4 border border-gray-700">
                                <p className="text-gray-100 text-base sm:text-lg leading-relaxed">
                                    {currentRiddle.text}
                                </p>
                            </div>
                            <button
                                onClick={verifyLocation}
                                disabled={isVerifying || !location}
                                className={`w-full py-3 rounded-lg font-semibold transition-all text-base sm:text-lg border-b-4 ${isVerifying ? 'bg-yellow-500 text-white border-yellow-700' : location ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-800 hover:border-blue-900 shadow-lg hover:shadow-xl' : 'bg-gray-600 text-gray-400 cursor-not-allowed border-gray-700'}`}
                            >
                                {isVerifying ? 'Scanning Area...' : "I'm at the Location!"}
                            </button>
                        </div>

                        {lastResult && (
                            <div className={`bg-gray-900/50 backdrop-blur-md rounded-xl p-4 sm:p-6 border-l-4 ${ 
                                lastResult.success ? 'border-green-500' : 'border-red-500'
                            }`}>
                                <div className="flex items-center space-x-3 mb-2">
                                    {lastResult.success ? (
                                        <Unlock className="text-green-400" size={20} />
                                    ) : (
                                        <Lock className="text-red-400" size={20} />
                                    )}
                                    <p className={`font-semibold text-sm sm:text-base ${ 
                                        lastResult.success ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                        {lastResult.success ? 'A Match!' : 'Not quite...'}
                                    </p>
                                </div>
                                <p className="text-gray-300 text-xs sm:text-sm">
                                    {lastResult.message || 
                                     `Distance: ${lastResult.distance}m | Attempts left: ${lastResult.attemptsLeft}`}
                                </p>
                            </div>
                        )}

                        <div className="bg-gray-900/50 backdrop-blur-md rounded-xl p-4 sm:p-6 border-2 border-yellow-400/50">
                            <h4 className="text-base sm:text-lg font-semibold text-yellow-400 mb-4 text-shadow-custom">
                                Gym Badges ({keys.length})
                            </h4>
                            <div className="space-y-2">
                                {keys.length > 0 ? (
                                    keys.map((key, index) => (
                                        <div key={index} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                                            <p className="text-green-400 font-mono text-xs sm:text-sm">
                                                Badge #{index + 1}: {key}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-400 text-sm sm:text-base">No badges collected yet, trainer!</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {gameState === 'completed' && (
                    <div className="bg-gray-900/50 backdrop-blur-md rounded-xl p-6 sm:p-8 text-center border-2 border-yellow-400/50">
                        <img src={ashImage} alt="Ash Ketchum" className="mx-auto mb-4 h-32 sm:h-40" />
                        <h2 className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-4 text-shadow-custom">
                            You're a Pokémon Master!
                        </h2>
                        <p className="text-gray-300 mb-6 text-sm sm:text-base">
                            Congratulations! You've collected all the badges and completed the Hackemon challenge.
                        </p>
                        <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-6">
                            <p className="text-green-400 font-semibold text-base sm:text-lg">
                                Total Badges Collected: {keys.length}
                            </p>
                        </div>
                        <button
                            onClick={resetChallenge}
                            className="px-6 sm:px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all text-base sm:text-lg border-b-4 border-red-800 hover:border-red-900 shadow-lg hover:shadow-xl"
                        >
                            Start a New Journey
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;

