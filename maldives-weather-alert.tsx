import React, { useState, useEffect } from 'react';
import { Cloud, CloudRain, Wind, AlertTriangle, Bell, RefreshCw, Droplets, Loader } from 'lucide-react';

export default function MaldivesWeatherAlert() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Using Male, Maldives coordinates
      const lat = 4.1755;
      const lon = 73.5093;
      
      // Try Open-Meteo API with simpler parameters
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,rain,weather_code,wind_speed_10m&hourly=precipitation_probability,precipitation&forecast_days=1`;
      
      console.log('Fetching weather from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Weather data received:', data);
      
      setWeather(data);
      setLastUpdate(new Date());
      
      // Check for alerts
      checkForAlerts(data);
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError(err.message || 'Failed to load weather data');
    } finally {
      setLoading(false);
    }
  };

  const checkForAlerts = (data) => {
    const newAlerts = [];
    const current = data.current;
    const hourly = data.hourly;
    
    // Check for current rain
    if (current.rain && current.rain > 0) {
      newAlerts.push({
        type: 'rain',
        severity: current.rain > 5 ? 'high' : 'medium',
        message: `⚠️ Currently raining: ${current.rain.toFixed(1)}mm`
      });
    }
    
    // Check for high winds (potential storm)
    if (current.wind_speed_10m > 30) {
      newAlerts.push({
        type: 'wind',
        severity: current.wind_speed_10m > 40 ? 'high' : 'medium',
        message: `💨 Strong winds: ${current.wind_speed_10m.toFixed(1)} km/h`
      });
    }
    
    // Check next 6 hours for rain probability
    if (hourly && hourly.precipitation_probability) {
      const next6Hours = hourly.precipitation_probability.slice(0, 6);
      const maxProb = Math.max(...next6Hours);
      
      if (maxProb > 70) {
        newAlerts.push({
          type: 'forecast',
          severity: 'high',
          message: `🌧️ High chance of rain soon (${maxProb}%)`
        });
      } else if (maxProb > 50) {
        newAlerts.push({
          type: 'forecast',
          severity: 'medium',
          message: `☁️ Possible rain in next hours (${maxProb}%)`
        });
      }
    }
    
    // Check for heavy rain forecast
    if (hourly && hourly.precipitation) {
      const next6HoursPrecip = hourly.precipitation.slice(0, 6);
      const totalRain = next6HoursPrecip.reduce((a, b) => a + b, 0);
      
      if (totalRain > 15) {
        newAlerts.push({
          type: 'forecast',
          severity: 'high',
          message: `⛈️ Heavy rain expected (${totalRain.toFixed(1)}mm)`
        });
      }
    }
    
    setAlerts(newAlerts);
    
    // Vibrate if there are high severity alerts (mobile)
    if (newAlerts.some(a => a.severity === 'high') && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    
    // Auto-refresh every 10 minutes
    const interval = setInterval(() => {
      fetchWeather();
    }, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getWeatherDescription = (code) => {
    const descriptions = {
      0: '☀️ Clear sky',
      1: '🌤️ Mainly clear',
      2: '⛅ Partly cloudy',
      3: '☁️ Overcast',
      45: '🌫️ Foggy',
      48: '🌫️ Foggy',
      51: '🌦️ Light drizzle',
      53: '🌧️ Drizzle',
      55: '🌧️ Heavy drizzle',
      61: '🌧️ Light rain',
      63: '🌧️ Rain',
      65: '🌧️ Heavy rain',
      80: '🌦️ Rain showers',
      81: '🌧️ Rain showers',
      82: '⛈️ Heavy showers',
      95: '⛈️ Thunderstorm',
      96: '⛈️ Thunderstorm',
      99: '⛈️ Severe thunderstorm'
    };
    return descriptions[code] || '🌡️ Unknown';
  };

  if (loading && !weather) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm w-full">
          <Loader className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-700 text-lg font-medium">Loading weather...</p>
          <p className="text-gray-500 text-sm mt-2">Connecting to weather service</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md w-full">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchWeather}
            className="w-full bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 active:bg-blue-700 font-medium shadow-lg"
          >
            Try Again
          </button>
          <p className="text-xs text-gray-500 mt-4">
            Make sure you have an internet connection
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 p-4 pb-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Weather Alert</h1>
              <p className="text-gray-600 text-sm">📍 Malé, Maldives</p>
            </div>
            <Bell className="w-10 h-10 text-blue-500" />
          </div>
          
          <div className="flex flex-col gap-3 mt-4">
            <button
              onClick={fetchWeather}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 font-medium shadow-lg"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Updating...' : 'Refresh Now'}
            </button>
            
            <label className="flex items-center gap-3 text-gray-700 bg-gray-50 p-3 rounded-xl">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-5 h-5"
              />
              <span className="text-sm">Auto-refresh every 10 minutes</span>
            </label>
          </div>
          
          {lastUpdate && (
            <p className="text-xs text-gray-500 mt-3 text-center">
              Updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Alerts */}
        {alerts.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-2xl p-6 mb-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
              Active Alerts
            </h2>
            <div className="space-y-3">
              {alerts.map((alert, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl font-medium ${
                    alert.severity === 'high'
                      ? 'bg-red-50 border-2 border-red-300 text-red-800'
                      : 'bg-yellow-50 border-2 border-yellow-300 text-yellow-800'
                  }`}
                >
                  {alert.message}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-2xl p-6 mb-4">
            <p className="text-center text-gray-600">✅ No weather alerts at this time</p>
          </div>
        )}

        {/* Current Weather */}
        {weather && (
          <div className="bg-white rounded-2xl shadow-2xl p-6 mb-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Current Conditions</h2>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <p className="text-3xl mb-2">
                  {getWeatherDescription(weather.current.weather_code).split(' ')[0]}
                </p>
                <p className="text-xs text-gray-600 mb-1">Condition</p>
                <p className="font-semibold text-gray-800 text-sm">
                  {getWeatherDescription(weather.current.weather_code).split(' ').slice(1).join(' ')}
                </p>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-red-50 to-orange-100 rounded-xl">
                <p className="text-3xl mb-2">🌡️</p>
                <p className="text-xs text-gray-600 mb-1">Temperature</p>
                <p className="font-bold text-gray-800 text-xl">
                  {weather.current.temperature_2m}°C
                </p>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl">
                <Droplets className="w-8 h-8 text-cyan-500 mx-auto mb-2" />
                <p className="text-xs text-gray-600 mb-1">Humidity</p>
                <p className="font-semibold text-gray-800">
                  {weather.current.relative_humidity_2m}%
                </p>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                <Wind className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-xs text-gray-600 mb-1">Wind</p>
                <p className="font-semibold text-gray-800">
                  {weather.current.wind_speed_10m} km/h
                </p>
              </div>
              
              {weather.current.rain > 0 && (
                <div className="text-center p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl col-span-2">
                  <CloudRain className="w-10 h-10 text-blue-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-600 mb-1">Current Rainfall</p>
                  <p className="font-bold text-gray-800 text-xl">
                    {weather.current.rain} mm
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hourly Forecast */}
        {weather && weather.hourly && (
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Rain Forecast</h2>
            <div className="overflow-x-auto -mx-2 px-2">
              <div className="flex gap-3 pb-2">
                {weather.hourly.precipitation_probability.slice(0, 12).map((prob, idx) => {
                  const hour = new Date(weather.hourly.time[idx]).getHours();
                  const precip = weather.hourly.precipitation[idx];
                  return (
                    <div key={idx} className="flex-shrink-0 text-center p-3 bg-gray-50 rounded-xl min-w-[70px]">
                      <p className="text-xs font-semibold text-gray-600 mb-2">
                        {hour}:00
                      </p>
                      <CloudRain className={`w-8 h-8 mx-auto mb-2 ${prob > 50 ? 'text-blue-600' : 'text-gray-300'}`} />
                      <p className="font-bold text-sm text-gray-800">{prob}%</p>
                      {precip > 0 && (
                        <p className="text-xs text-blue-600 mt-1 font-medium">
                          {precip.toFixed(1)}mm
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}