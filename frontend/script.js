// ===============================
// Weather Pro - Complete JavaScript Implementation
// Professional weather app with full error handling, themes, and responsive UI
// Updated for Vercel deployment with Render backend
// ===============================

// ============ Configuration ============
const CONFIG = {
    // Your Render backend URL (confirmed working)
    API_BASE: "https://weather-forecast-app-bib8.onrender.com", 
    DEFAULT_CITY: "London",
    STORAGE_KEYS: {
        THEME: 'weather_theme',
        LAST_CITY: 'weather_last_city',
        UNIT: 'weather_unit',
        LOCATION_PROMPTED: 'weather_location_prompted',
        LAST_UPDATE: 'weather_last_update'
    },
    UPDATE_INTERVAL: 600000, // 10 minutes
    REQUEST_TIMEOUT: 30000 // 30 seconds
};

// ============ Global State ============
let currentState = {
    lastCity: localStorage.getItem(CONFIG.STORAGE_KEYS.LAST_CITY) || CONFIG.DEFAULT_CITY,
    currentUnit: localStorage.getItem(CONFIG.STORAGE_KEYS.UNIT) || 'C',
    isLoading: false,
    lastWeatherData: null,
    currentView: 'current'
};

// ============ DOM Elements ============
const elements = {
    // Inputs and controls
    cityInput: document.getElementById("cityInput"),
    searchBtn: document.getElementById("searchBtn"),
    locationBtn: document.getElementById("locationBtn"),
    refreshBtn: document.getElementById("refreshBtn"),
    themeToggle: document.getElementById("themeToggle"),
    celsiusBtn: document.getElementById("celsiusBtn"),
    fahrenheitBtn: document.getElementById("fahrenheitBtn"),
    retryBtn: document.getElementById("retryBtn"),

    // Tabs
    currentTab: document.getElementById("currentTab"),
    forecastTab: document.getElementById("forecastTab"),
    historyTab: document.getElementById("historyTab"),

    // Views
    loadingContainer: document.getElementById("loadingContainer"),
    errorContainer: document.getElementById("errorContainer"),
    errorText: document.getElementById("errorText"),
    weatherContent: document.getElementById("weatherContent"),
    currentView: document.getElementById("currentView"),
    forecastView: document.getElementById("forecastView"),
    historyView: document.getElementById("historyView"),

    // Current weather elements
    locationName: document.getElementById("locationName"),
    locationDetails: document.getElementById("locationDetails"),
    localTime: document.getElementById("localTime"),
    currentTemp: document.getElementById("currentTemp"),
    feelsLike: document.getElementById("feelsLike"),
    weatherCondition: document.getElementById("weatherCondition"),
    weatherIcon: document.getElementById("weatherIcon"),
    humidity: document.getElementById("humidity"),
    windSpeed: document.getElementById("windSpeed"),
    uvIndex: document.getElementById("uvIndex"),
    visibility: document.getElementById("visibility"),
    pressure: document.getElementById("pressure"),
    airQuality: document.getElementById("airQuality"),
    sunrise: document.getElementById("sunrise"),
    sunset: document.getElementById("sunset"),
    moonPhase: document.getElementById("moonPhase"),
    comfortIndicator: document.getElementById("comfortIndicator"),
    comfortDescription: document.getElementById("comfortDescription"),

    // Containers
    forecastContainer: document.getElementById("forecastContainer"),
    hourlyContainer: document.getElementById("hourlyContainer"),
    historyContainer: document.getElementById("historyContainer"),
    toastContainer: document.getElementById("toastContainer"),

    // Modal
    locationModal: document.getElementById("locationModal"),
    allowLocationBtn: document.getElementById("allowLocationBtn"),
    skipLocationBtn: document.getElementById("skipLocationBtn")
};

// ============ Utility Functions ============
function showToast(message, type = 'info') {
    if (!elements.toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = getToastIcon(type);
    toast.innerHTML = `
        <i class="${icon}"></i>
        <span>${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('toast-show'), 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.remove('toast-show');
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

function getToastIcon(type) {
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    return icons[type] || icons.info;
}

function formatTime(dateString) {
    try {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    } catch (error) {
        return '--:--';
    }
}

function formatDate(dateString) {
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        return '---';
    }
}

function getWeatherClass(condition) {
    if (!condition) return '';
    const text = condition.toLowerCase();
    if (text.includes('sun') || text.includes('clear')) return 'sunny';
    if (text.includes('cloud')) return 'cloudy';
    if (text.includes('rain') || text.includes('drizzle')) return 'rainy';
    if (text.includes('snow') || text.includes('blizzard')) return 'snowy';
    if (text.includes('storm') || text.includes('thunder')) return 'stormy';
    return '';
}

function getComfortLevel(temp, humidity, windSpeed) {
    if (temp < 10) return { class: 'cold', text: 'Cold conditions' };
    if (temp > 30) return { class: 'hot', text: 'Hot conditions' };
    if (humidity > 80) return { class: 'humid', text: 'Very humid' };
    if (windSpeed > 25) return { class: 'windy', text: 'Windy conditions' };
    return { class: 'comfortable', text: 'Comfortable conditions' };
}

function convertTemp(temp, fromUnit, toUnit) {
    if (fromUnit === toUnit) return temp;
    if (fromUnit === 'C' && toUnit === 'F') return (temp * 9/5) + 32;
    if (fromUnit === 'F' && toUnit === 'C') return (temp - 32) * 5/9;
    return temp;
}

function formatTemp(temp) {
    if (temp == null || temp === undefined) return '--';
    return currentState.currentUnit === 'C' ? Math.round(temp) : Math.round(convertTemp(temp, 'C', 'F'));
}

// ============ API Functions ============
async function makeRequest(endpoint, params = {}) {
    try {
        const url = new URL(endpoint, CONFIG.API_BASE);
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                url.searchParams.append(key, params[key]);
            }
        });

        console.log('Making request to:', url.toString());

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.detail || errorMessage;
            } catch (e) {
                // Use default error message if JSON parsing fails
            }
            throw new Error(errorMessage);
        }

        return await response.json();
    } catch (error) {
        console.error(`API Error for ${endpoint}:`, error);
        
        if (error.name === 'AbortError') {
            throw new Error('Request timeout - please try again');
        }
        
        if (!navigator.onLine) {
            throw new Error('No internet connection');
        }
        
        throw error;
    }
}

async function fetchCurrentWeather(city) {
    return await makeRequest('/weather/current', { city: city.trim() });
}

async function fetchForecast(city, days = 3) {
    return await makeRequest('/weather/forecast', { city: city.trim(), days });
}

async function fetchHistory(city, days = 3) {
    return await makeRequest('/weather/history', { city: city.trim(), days });
}

async function fetchLocationWeather() {
    return await makeRequest('/weather/location');
}

async function fetchWeatherByCoordinates(lat, lon) {
    return await makeRequest('/weather/coordinates', { lat: lat.toString(), lon: lon.toString() });
}

// ============ UI State Management ============
function showLoading() {
    if (elements.loadingContainer) elements.loadingContainer.style.display = 'flex';
    if (elements.errorContainer) elements.errorContainer.style.display = 'none';
    if (elements.weatherContent) elements.weatherContent.style.display = 'none';
    currentState.isLoading = true;
    
    // Disable buttons during loading
    [elements.searchBtn, elements.locationBtn, elements.refreshBtn].forEach(btn => {
        if (btn) btn.disabled = true;
    });
}

function showError(message) {
    if (elements.loadingContainer) elements.loadingContainer.style.display = 'none';
    if (elements.weatherContent) elements.weatherContent.style.display = 'none';
    if (elements.errorContainer) elements.errorContainer.style.display = 'flex';
    if (elements.errorText) elements.errorText.textContent = message;
    currentState.isLoading = false;
    
    // Re-enable buttons
    [elements.searchBtn, elements.locationBtn, elements.refreshBtn].forEach(btn => {
        if (btn) btn.disabled = false;
    });
}

function showWeather() {
    if (elements.loadingContainer) elements.loadingContainer.style.display = 'none';
    if (elements.errorContainer) elements.errorContainer.style.display = 'none';
    if (elements.weatherContent) elements.weatherContent.style.display = 'block';
    currentState.isLoading = false;
    
    // Re-enable buttons
    [elements.searchBtn, elements.locationBtn, elements.refreshBtn].forEach(btn => {
        if (btn) btn.disabled = false;
    });
}

function switchTab(tabName) {
    // Remove active class from all tabs
    document.querySelectorAll('.tab-btn').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.view-content').forEach(view => view.style.display = 'none');

    // Activate selected tab
    if (elements[tabName + 'Tab']) {
        elements[tabName + 'Tab'].classList.add('active');
    }
    if (elements[tabName + 'View']) {
        elements[tabName + 'View'].style.display = 'block';
    }
    
    currentState.currentView = tabName;
}

// ============ Weather Data Updates ============
function updateCurrentWeather(data) {
    try {
        const { location, current } = data;
        
        if (!location || !current) {
            throw new Error('Invalid weather data structure');
        }
        
        // Location info
        if (elements.locationName) elements.locationName.textContent = location.name || 'Unknown';
        if (elements.locationDetails) elements.locationDetails.textContent = `${location.region || ''}, ${location.country || ''}`;
        if (elements.localTime && location.localtime) {
            const timeSpan = elements.localTime.querySelector('span');
            if (timeSpan) timeSpan.textContent = formatTime(location.localtime);
        }

        // Temperature
        if (elements.currentTemp) elements.currentTemp.textContent = formatTemp(current.temp_c);
        if (elements.feelsLike) elements.feelsLike.textContent = formatTemp(current.feelslike_c);
        if (elements.weatherCondition) elements.weatherCondition.textContent = current.condition?.text || 'Unknown';

        // Weather icon
        if (elements.weatherIcon && current.condition?.icon) {
            const iconUrl = current.condition.icon.startsWith('http') 
                ? current.condition.icon 
                : `https:${current.condition.icon}`;
            elements.weatherIcon.src = iconUrl;
            elements.weatherIcon.alt = current.condition.text || 'Weather icon';
        }

        // Metrics
        if (elements.humidity) elements.humidity.textContent = `${current.humidity || 0}%`;
        
        if (elements.windSpeed) {
            const windValue = currentState.currentUnit === 'C' 
                ? `${current.wind_kph || 0} km/h` 
                : `${current.wind_mph || 0} mph`;
            elements.windSpeed.textContent = windValue;
        }
        
        if (elements.uvIndex) elements.uvIndex.textContent = current.uv || 'N/A';
        
        if (elements.visibility) {
            const visibilityValue = currentState.currentUnit === 'C' 
                ? `${current.visibility_km || 0} km` 
                : `${current.visibility_miles || 0} mi`;
            elements.visibility.textContent = visibilityValue;
        }
        
        if (elements.pressure) {
            const pressureValue = currentState.currentUnit === 'C' 
                ? `${current.pressure_mb || 0} mb` 
                : `${current.pressure_in || 0} in`;
            elements.pressure.textContent = pressureValue;
        }
        
        // Air quality
        if (elements.airQuality) {
            const aqData = data.air_quality;
            if (aqData && Object.keys(aqData).length > 0) {
                // Simple air quality assessment
                elements.airQuality.textContent = 'Good';
            } else {
                elements.airQuality.textContent = 'N/A';
            }
        }

        // Comfort level
        if (elements.comfortIndicator && elements.comfortDescription) {
            const comfort = getComfortLevel(current.temp_c || 20, current.humidity || 50, current.wind_kph || 0);
            elements.comfortIndicator.className = `comfort-indicator ${comfort.class}`;
            elements.comfortDescription.textContent = comfort.text;
        }

        // Update background theme based on weather
        document.body.className = document.body.className.replace(/\b(sunny|cloudy|rainy|snowy|stormy)\b/g, '');
        const weatherClass = getWeatherClass(current.condition?.text);
        if (weatherClass) {
            document.body.classList.add(weatherClass);
        }

        // Update temperature unit display
        document.querySelectorAll('.temp-unit').forEach(unit => {
            unit.textContent = `°${currentState.currentUnit}`;
        });

        // Store the data for unit conversion
        currentState.lastWeatherData = data;

    } catch (error) {
        console.error('Error updating current weather:', error);
        showToast('Error displaying weather data', 'error');
    }
}

function updateForecast(data) {
    try {
        const container = elements.forecastContainer;
        const hourlyContainer = elements.hourlyContainer;
        
        if (container) {
            container.innerHTML = '';
            
            const forecastDays = data.forecast?.forecastday || [];
            
            if (forecastDays.length === 0) {
                container.innerHTML = '<div class="no-data"><p>No forecast data available</p></div>';
                return;
            }
            
            // Daily forecast (limit to 3 days)
            forecastDays.slice(0, 3).forEach(day => {
                const card = createForecastCard(day);
                container.appendChild(card);
            });
        }

        // Hourly forecast from today
        if (hourlyContainer) {
            hourlyContainer.innerHTML = '';
            
            const forecastDays = data.forecast?.forecastday || [];
            if (forecastDays[0]?.hour) {
                const todayHours = forecastDays[0].hour;
                const currentHour = new Date().getHours();
                
                // Show next 8 hours
                const nextHours = todayHours.slice(currentHour, Math.min(currentHour + 8, todayHours.length));
                
                if (nextHours.length === 0) {
                    hourlyContainer.innerHTML = '<div class="no-data"><p>No hourly data available</p></div>';
                } else {
                    nextHours.forEach(hour => {
                        const card = createHourlyCard(hour);
                        hourlyContainer.appendChild(card);
                    });
                }
            }
        }

        // Update sun/moon info from today's astro data
        const forecastDays = data.forecast?.forecastday || [];
        if (forecastDays[0]?.astro) {
            const astro = forecastDays[0].astro;
            if (elements.sunrise) elements.sunrise.textContent = astro.sunrise || '--:--';
            if (elements.sunset) elements.sunset.textContent = astro.sunset || '--:--';
            if (elements.moonPhase) elements.moonPhase.textContent = astro.moon_phase || '---';
        }

    } catch (error) {
        console.error('Error updating forecast:', error);
        if (elements.forecastContainer) {
            elements.forecastContainer.innerHTML = '<div class="no-data"><p>Error loading forecast data</p></div>';
        }
    }
}

function createForecastCard(day) {
    const card = document.createElement('div');
    card.className = 'forecast-card';
    
    try {
        const date = new Date(day.date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        card.innerHTML = `
            <div class="forecast-header">
                <h4 class="forecast-day">${dayName}</h4>
                <p class="forecast-date">${dateStr}</p>
            </div>
            <div class="forecast-icon">
                <img src="https:${day.day.condition?.icon || ''}" alt="${day.day.condition?.text || 'Weather'}" />
            </div>
            <p class="forecast-condition">${day.day.condition?.text || 'Unknown'}</p>
            <div class="forecast-temps">
                <span class="high-temp">${formatTemp(day.day.maxtemp_c)}°</span>
                <span class="low-temp">${formatTemp(day.day.mintemp_c)}°</span>
            </div>
            <div class="forecast-details">
                <div class="detail-item">
                    <i class="fas fa-tint"></i>
                    <span>${day.day.avghumidity || 0}%</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-wind"></i>
                    <span>${day.day.maxwind_kph || 0} km/h</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-cloud-rain"></i>
                    <span>${day.day.daily_chance_of_rain || 0}%</span>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error creating forecast card:', error);
        card.innerHTML = '<div class="error-card">Error loading day data</div>';
    }
    
    return card;
}

function createHourlyCard(hour) {
    const card = document.createElement('div');
    card.className = 'hourly-card';
    
    try {
        const time = formatTime(hour.time);
        
        card.innerHTML = `
            <p class="hourly-time">${time}</p>
            <div class="forecast-icon">
                <img src="https:${hour.condition?.icon || ''}" alt="${hour.condition?.text || 'Weather'}" />
            </div>
            <p class="hourly-temp">${formatTemp(hour.temp_c)}°</p>
            <div class="hourly-details">
                <span><i class="fas fa-tint"></i> ${hour.humidity || 0}%</span>
                <span><i class="fas fa-cloud-rain"></i> ${hour.chance_of_rain || 0}%</span>
            </div>
        `;
    } catch (error) {
        console.error('Error creating hourly card:', error);
        card.innerHTML = '<div class="error-card">Error loading hour data</div>';
    }
    
    return card;
}

function updateHistory(data) {
    try {
        const container = elements.historyContainer;
        if (!container) return;
        
        container.innerHTML = '';
        
        const historyDays = data.history || [];
        
        if (historyDays.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-info-circle"></i>
                    <p>No historical data available</p>
                </div>
            `;
            return;
        }

        historyDays.forEach(day => {
            const card = createHistoryCard(day);
            container.appendChild(card);
        });

    } catch (error) {
        console.error('Error updating history:', error);
        if (elements.historyContainer) {
            elements.historyContainer.innerHTML = '<div class="no-data"><p>Error loading historical data</p></div>';
        }
    }
}

function createHistoryCard(day) {
    const card = document.createElement('div');
    card.className = 'history-card';
    
    try {
        const date = new Date(day.date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        card.innerHTML = `
            <div class="history-header">
                <div class="history-date-info">
                    <h4 class="history-day">${dayName}</h4>
                    <p class="history-date">${dateStr}</p>
                </div>
                <div class="forecast-icon">
                    <img src="https:${day.day.condition?.icon || ''}" alt="${day.day.condition?.text || 'Weather'}" />
                </div>
            </div>
            <p class="history-condition">${day.day.condition?.text || 'Unknown'}</p>
            <div class="history-temps">
                <div class="temp-range">
                    <span class="high-temp">${formatTemp(day.day.maxtemp_c)}°</span>
                    <span class="temp-separator">/</span>
                    <span class="low-temp">${formatTemp(day.day.mintemp_c)}°</span>
                </div>
            </div>
            <div class="history-metrics">
                <div class="metric-item">
                    <label>Humidity</label>
                    <span>${day.day.avghumidity || 0}%</span>
                </div>
                <div class="metric-item">
                    <label>Wind</label>
                    <span>${day.day.maxwind_kph || 0} km/h</span>
                </div>
                <div class="metric-item">
                    <label>UV</label>
                    <span>${day.day.uv || 'N/A'}</span>
                </div>
                <div class="metric-item">
                    <label>Rain</label>
                    <span>${day.day.totalprecip_mm || 0} mm</span>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error creating history card:', error);
        card.innerHTML = '<div class="error-card">Error loading history data</div>';
    }
    
    return card;
}

// ============ Main Weather Loading Function ============
async function loadWeather(city) {
    if (!city?.trim()) {
        showError('Please enter a valid city name');
        showToast('Please enter a valid city name', 'warning');
        return;
    }

    try {
        showLoading();
        const cityName = city.trim();
        currentState.lastCity = cityName;
        
        console.log('Loading weather for:', cityName);
        
        // Store last searched city
        localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_CITY, cityName);

        // Fetch all weather data with proper error handling
        const [currentWeather, forecast, history] = await Promise.allSettled([
            fetchCurrentWeather(cityName),
            fetchForecast(cityName, 3),
            fetchHistory(cityName, 3)
        ]);

        console.log('API responses:', {
            current: currentWeather.status,
            forecast: forecast.status,
            history: history.status
        });

        // Handle current weather (required)
        if (currentWeather.status === 'fulfilled') {
            updateCurrentWeather(currentWeather.value);
        } else {
            console.error('Current weather failed:', currentWeather.reason);
            throw new Error(currentWeather.reason?.message || 'Failed to fetch current weather');
        }

        // Handle forecast (optional)
        if (forecast.status === 'fulfilled') {
            updateForecast(forecast.value);
        } else {
            console.warn('Forecast failed:', forecast.reason);
            if (elements.forecastContainer) {
                elements.forecastContainer.innerHTML = '<div class="no-data"><p>Forecast data unavailable</p></div>';
            }
        }

        // Handle history (optional)
        if (history.status === 'fulfilled') {
            updateHistory(history.value);
        } else {
            console.warn('History failed:', history.reason);
            if (elements.historyContainer) {
                elements.historyContainer.innerHTML = '<div class="no-data"><p>Historical data unavailable</p></div>';
            }
        }

        showWeather();
        showToast(`Weather updated for ${cityName}`, 'success');

        // Update last update timestamp
        localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_UPDATE, Date.now().toString());

    } catch (error) {
        console.error('Weather loading error:', error);
        const errorMessage = error.message || 'Failed to load weather data';
        showError(errorMessage);
        showToast(errorMessage, 'error');
    }
}

// ============ Geolocation Functions ============
async function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported by this browser'));
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 300000 // 5 minutes cache
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log('Geolocation success:', position.coords);
                resolve(position);
            },
            (error) => {
                console.error('Geolocation error:', error);
                let message = 'Location access denied';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message = 'Location access denied by user';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = 'Location information unavailable';
                        break;
                    case error.TIMEOUT:
                        message = 'Location request timed out';
                        break;
                }
                reject(new Error(message));
            },
            options
        );
    });
}

async function loadLocationWeather() {
    try {
        showLoading();
        
        // Try precise coordinates first
        try {
            console.log('Attempting to get precise location...');
            const position = await getCurrentLocation();
            const { latitude, longitude } = position.coords;
            console.log('Got coordinates:', latitude, longitude);
            
            const data = await fetchWeatherByCoordinates(latitude, longitude);
            currentState.lastCity = data.location.name;
            await loadWeatherData(data);
            showToast('Location detected successfully', 'success');
            return;
        } catch (geoError) {
            console.warn('Precise geolocation failed, trying IP-based location:', geoError.message);
        }

        // Fallback to IP-based location
        console.log('Attempting IP-based location...');
        const data = await fetchLocationWeather();
        currentState.lastCity = data.location.name;
        await loadWeatherData(data);
        showToast('Location detected via IP address', 'info');

    } catch (error) {
        console.error('Location weather error:', error);
        // Final fallback to default city
        console.log('Falling back to default city:', CONFIG.DEFAULT_CITY);
        await loadWeather(CONFIG.DEFAULT_CITY);
        showToast('Using default location due to location detection failure', 'warning');
    }
}

// Helper function to load weather data from API response
async function loadWeatherData(currentData) {
    try {
        const cityName = currentData.location.name;
        
        // Update current weather immediately
        updateCurrentWeather(currentData);
        currentState.lastWeatherData = currentData;
        
        // Fetch additional data in parallel
        const [forecast, history] = await Promise.allSettled([
            fetchForecast(cityName, 3),
            fetchHistory(cityName, 3)
        ]);

        // Update forecast if available
        if (forecast.status === 'fulfilled') {
            updateForecast(forecast.value);
        }

        // Update history if available
        if (history.status === 'fulfilled') {
            updateHistory(history.value);
        }

        showWeather();
        
    } catch (error) {
        console.error('Error in loadWeatherData:', error);
        showError('Failed to load complete weather data');
    }
}

// ============ Theme Management ============
function initializeTheme() {
    try {
        const savedTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme || (prefersDark ? 'dark' : 'light');
        
        applyTheme(theme);
    } catch (error) {
        console.error('Error initializing theme:', error);
        applyTheme('light'); // Default fallback
    }
}

function applyTheme(theme) {
    try {
        document.body.className = document.body.className.replace(/\b(light|dark)-theme\b/g, '');
        document.body.classList.add(`${theme}-theme`);
        
        const icon = elements.themeToggle?.querySelector('i');
        if (icon) {
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, theme);
    } catch (error) {
        console.error('Error applying theme:', error);
    }
}

function toggleTheme() {
    try {
        const isDark = document.body.classList.contains('dark-theme');
        applyTheme(isDark ? 'light' : 'dark');
        showToast(`Switched to ${isDark ? 'light' : 'dark'} theme`, 'info');
    } catch (error) {
        console.error('Error toggling theme:', error);
    }
}

// ============ Unit Management ============
function initializeUnits() {
    try {
        const savedUnit = localStorage.getItem(CONFIG.STORAGE_KEYS.UNIT) || 'C';
        currentState.currentUnit = savedUnit;
        updateUnitButtons();
    } catch (error) {
        console.error('Error initializing units:', error);
        currentState.currentUnit = 'C';
        updateUnitButtons();
    }
}

function updateUnitButtons() {
    try {
        if (elements.celsiusBtn) {
            elements.celsiusBtn.classList.toggle('active', currentState.currentUnit === 'C');
        }
        if (elements.fahrenheitBtn) {
            elements.fahrenheitBtn.classList.toggle('active', currentState.currentUnit === 'F');
        }
    } catch (error) {
        console.error('Error updating unit buttons:', error);
    }
}

function switchUnit(unit) {
    try {
        if (currentState.currentUnit === unit) return;
        
        currentState.currentUnit = unit;
        localStorage.setItem(CONFIG.STORAGE_KEYS.UNIT, unit);
        updateUnitButtons();
        
        // Re-render current data with new units
        if (currentState.lastWeatherData) {
            updateCurrentWeather(currentState.lastWeatherData);
        }
        
        // Update temperature unit display throughout the app
        document.querySelectorAll('.temp-unit').forEach(unitElement => {
            unitElement.textContent = `°${unit}`;
        });
        
        showToast(`Switched to °${unit}`, 'info');
    } catch (error) {
        console.error('Error switching unit:', error);
    }
}

// ============ Event Handlers ============
function handleSearch() {
    try {
        const city = elements.cityInput?.value?.trim();
        if (city) {
            loadWeather(city);
            elements.cityInput.value = '';
        } else {
            showToast('Please enter a city name', 'warning');
        }
    } catch (error) {
        console.error('Error handling search:', error);
        showToast('Search error occurred', 'error');
    }
}

function handleRefresh() {
    try {
        if (currentState.lastCity) {
            loadWeather(currentState.lastCity);
        } else {
            loadWeather(CONFIG.DEFAULT_CITY);
        }
    } catch (error) {
        console.error('Error handling refresh:', error);
        showToast('Refresh error occurred', 'error');
    }
}

function handleLocationRequest() {
    try {
        loadLocationWeather();
    } catch (error) {
        console.error('Error handling location request:', error);
        showToast('Location request error', 'error');
    }
}

// ============ Event Listeners ============
function setupEventListeners() {
    try {
        // Search functionality
        if (elements.searchBtn) {
            elements.searchBtn.addEventListener('click', handleSearch);
        }
        
        if (elements.cityInput) {
            elements.cityInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                }
            });
        }

        // Controls
        if (elements.locationBtn) {
            elements.locationBtn.addEventListener('click', handleLocationRequest);
        }
        
        if (elements.refreshBtn) {
            elements.refreshBtn.addEventListener('click', handleRefresh);
        }
        
        if (elements.retryBtn) {
            elements.retryBtn.addEventListener('click', handleRefresh);
        }

        // Theme and units
        if (elements.themeToggle) {
            elements.themeToggle.addEventListener('click', toggleTheme);
        }
        
        if (elements.celsiusBtn) {
            elements.celsiusBtn.addEventListener('click', () => switchUnit('C'));
        }
        
        if (elements.fahrenheitBtn) {
            elements.fahrenheitBtn.addEventListener('click', () => switchUnit('F'));
        }

        // Tabs
        if (elements.currentTab) {
            elements.currentTab.addEventListener('click', () => switchTab('current'));
        }
        
        if (elements.forecastTab) {
            elements.forecastTab.addEventListener('click', () => switchTab('forecast'));
        }
        
        if (elements.historyTab) {
            elements.historyTab.addEventListener('click', () => switchTab('history'));
        }

        // Location modal
        if (elements.allowLocationBtn) {
            elements.allowLocationBtn.addEventListener('click', () => {
                if (elements.locationModal) {
                    elements.locationModal.style.display = 'none';
                }
                loadLocationWeather();
            });
        }
        
        if (elements.skipLocationBtn) {
            elements.skipLocationBtn.addEventListener('click', () => {
                if (elements.locationModal) {
                    elements.locationModal.style.display = 'none';
                }
                loadWeather(CONFIG.DEFAULT_CITY);
            });
        }

        // System theme change detection
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (!localStorage.getItem(CONFIG.STORAGE_KEYS.THEME)) {
                    applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }

        // Online/offline status
        window.addEventListener('online', () => {
            showToast('Connection restored', 'success');
            if (currentState.lastCity) {
                loadWeather(currentState.lastCity);
            }
        });

        window.addEventListener('offline', () => {
            showToast('No internet connection', 'warning');
        });

        // Page visibility change
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && currentState.lastCity) {
                const lastUpdate = localStorage.getItem(CONFIG.STORAGE_KEYS.LAST_UPDATE);
                const now = Date.now();
                
                if (!lastUpdate || now - parseInt(lastUpdate) > CONFIG.UPDATE_INTERVAL) {
                    console.log('Auto-refreshing weather data...');
                    loadWeather(currentState.lastCity);
                }
            }
        });

        console.log('Event listeners setup complete');

    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

// ============ Initialization ============
async function initializeApp() {
    try {
        console.log('Initializing Weather Pro app...');
        
        // Initialize theme and units
        initializeTheme();
        initializeUnits();
        
        // Setup all event listeners
        setupEventListeners();
        
        // Check if user has seen location prompt before
        const hasSeenLocationPrompt = localStorage.getItem(CONFIG.STORAGE_KEYS.LOCATION_PROMPTED);
        
        if (!hasSeenLocationPrompt && navigator.geolocation && elements.locationModal) {
            // Show location modal for first-time users
            elements.locationModal.style.display = 'flex';
            localStorage.setItem(CONFIG.STORAGE_KEYS.LOCATION_PROMPTED, 'true');
            console.log('Showing location permission modal');
        } else {
            // Load weather for returning users or fallback
            const lastCity = currentState.lastCity || CONFIG.DEFAULT_CITY;
            console.log('Loading weather for:', lastCity);
            await loadWeather(lastCity);
        }
        
        console.log('App initialization complete');
        
    } catch (error) {
        console.error('App initialization error:', error);
        showError('Failed to initialize the application');
        
        // Try to load default city as last resort
        try {
            await loadWeather(CONFIG.DEFAULT_CITY);
        } catch (fallbackError) {
            console.error('Fallback initialization failed:', fallbackError);
        }
    }
}

// ============ App Performance Optimization ============
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Debounced search for better performance
const debouncedSearch = debounce(handleSearch, 300);

// ============ Error Recovery ============
window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
    showToast('An unexpected error occurred', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showToast('Network or data error occurred', 'error');
    event.preventDefault();
});

// ============ App Start ============
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting app initialization...');
    initializeApp();
});

// ============ Service Worker Registration ============
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered successfully:', registration.scope);
        } catch (error) {
            console.log('Service Worker registration failed:', error);
        }
    });
}

// ============ Export for Debugging ============
if (typeof window !== 'undefined') {
    window.WeatherApp = {
        loadWeather,
        loadLocationWeather,
        toggleTheme,
        switchUnit,
        currentState,
        CONFIG
    };
    
    console.log('WeatherApp object available for debugging');
}