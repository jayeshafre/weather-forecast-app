/* =========================================================
   Weather Pro - Professional JavaScript Application
   - Integrates with FastAPI backend on Render
   - Deployed frontend on Vercel
   - Modern ES6+ features with error handling
   ========================================================= */

// Configuration
const CONFIG = {
    // Update this with your actual Render backend URL
    API_BASE_URL: 'https://weather-forecast-app-bib8.onrender.com', 
    ENDPOINTS: {
        current: '/weather/current',
        forecast: '/weather/forecast', 
        history: '/weather/history',
        location: '/weather/location',
        coordinates: '/weather/coordinates'
    },
    DEFAULT_CITY: 'London',
    CACHE_DURATION: 10 * 60 * 1000, // 10 minutes
    REQUEST_TIMEOUT: 15000 // 15 seconds
};

// Application State
class WeatherState {
    constructor() {
        this.currentData = null;
        this.forecastData = null;
        this.historyData = null;
        this.isLoading = false;
        this.currentUnit = 'celsius';
        this.currentTheme = 'light';
        this.currentView = 'current';
        this.currentLocation = null;
        this.cache = new Map();
    }

    // Cache management
    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    getCache(key) {
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.timestamp) < CONFIG.CACHE_DURATION) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    clearCache() {
        this.cache.clear();
    }
}

// Initialize state
const state = new WeatherState();

// DOM Elements
const elements = {
    // Containers
    weatherContainer: document.getElementById('weatherContainer'),
    loadingContainer: document.getElementById('loadingContainer'),
    errorContainer: document.getElementById('errorContainer'),
    weatherContent: document.getElementById('weatherContent'),
    
    // Views
    currentView: document.getElementById('currentView'),
    forecastView: document.getElementById('forecastView'),
    historyView: document.getElementById('historyView'),
    
    // Tabs
    currentTab: document.getElementById('currentTab'),
    forecastTab: document.getElementById('forecastTab'),
    historyTab: document.getElementById('historyTab'),
    
    // Controls
    themeToggle: document.getElementById('themeToggle'),
    locationBtn: document.getElementById('locationBtn'),
    refreshBtn: document.getElementById('refreshBtn'),
    celsiusBtn: document.getElementById('celsiusBtn'),
    fahrenheitBtn: document.getElementById('fahrenheitBtn'),
    
    // Search
    cityInput: document.getElementById('cityInput'),
    searchBtn: document.getElementById('searchBtn'),
    
    // Current Weather Elements
    locationName: document.getElementById('locationName'),
    locationDetails: document.getElementById('locationDetails'),
    localTime: document.getElementById('localTime'),
    weatherIcon: document.getElementById('weatherIcon'),
    currentTemp: document.getElementById('currentTemp'),
    feelsLike: document.getElementById('feelsLike'),
    weatherCondition: document.getElementById('weatherCondition'),
    humidity: document.getElementById('humidity'),
    windSpeed: document.getElementById('windSpeed'),
    uvIndex: document.getElementById('uvIndex'),
    visibility: document.getElementById('visibility'),
    pressure: document.getElementById('pressure'),
    airQuality: document.getElementById('airQuality'),
    sunrise: document.getElementById('sunrise'),
    sunset: document.getElementById('sunset'),
    moonPhase: document.getElementById('moonPhase'),
    comfortIndicator: document.getElementById('comfortIndicator'),
    comfortDescription: document.getElementById('comfortDescription'),
    
    // Forecast containers
    forecastContainer: document.getElementById('forecastContainer'),
    hourlyContainer: document.getElementById('hourlyContainer'),
    historyContainer: document.getElementById('historyContainer'),
    
    // Modal
    locationModal: document.getElementById('locationModal'),
    allowLocationBtn: document.getElementById('allowLocationBtn'),
    skipLocationBtn: document.getElementById('skipLocationBtn'),
    
    // Error
    errorText: document.getElementById('errorText'),
    retryBtn: document.getElementById('retryBtn'),
    
    // Toast
    toastContainer: document.getElementById('toastContainer')
};

// Utility Functions
const utils = {
    // Format temperature based on current unit
    formatTemp(tempC, unit = state.currentUnit) {
        if (unit === 'fahrenheit') {
            return Math.round((tempC * 9/5) + 32);
        }
        return Math.round(tempC);
    },

    // Get temperature unit symbol
    getTempUnit(unit = state.currentUnit) {
        return unit === 'fahrenheit' ? '°F' : '°C';
    },

    // Format date
    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        });
    },

    // Format time
    formatTime(timeStr) {
        if (!timeStr) return '--:--';
        return timeStr;
    },

    // Get day name from date
    getDayName(dateStr) {
        const date = new Date(dateStr);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString('en-US', { weekday: 'long' });
        }
    },

    // Get weather condition class for styling
    getWeatherClass(condition) {
        const lower = condition.toLowerCase();
        if (lower.includes('sun') || lower.includes('clear')) return 'sunny';
        if (lower.includes('cloud') || lower.includes('overcast')) return 'cloudy';
        if (lower.includes('rain') || lower.includes('drizzle')) return 'rainy';
        if (lower.includes('snow') || lower.includes('blizzard')) return 'snowy';
        if (lower.includes('thunder') || lower.includes('storm')) return 'stormy';
        return 'cloudy';
    },

    // Calculate comfort level
    calculateComfort(temp, humidity, windSpeed) {
        let comfort = 'comfortable';
        let level = 50; // percentage

        // Temperature comfort (20-25°C is ideal)
        if (temp < 10) {
            comfort = 'very cold';
            level = 15;
        } else if (temp < 18) {
            comfort = 'cold';
            level = 30;
        } else if (temp > 30) {
            comfort = 'very hot';
            level = 20;
        } else if (temp > 26) {
            comfort = 'warm';
            level = 35;
        }

        // Humidity impact (40-60% is ideal)
        if (humidity > 70) {
            comfort = 'humid and ' + comfort;
            level = Math.max(level - 15, 10);
        } else if (humidity < 30) {
            comfort = 'dry and ' + comfort;
            level = Math.max(level - 10, 15);
        }

        // Wind impact (gentle breeze is good)
        if (windSpeed > 30) {
            comfort = 'windy and ' + comfort;
            level = Math.max(level - 10, 10);
        }

        return { description: comfort, level };
    },

    // Debounce function
    debounce(func, wait) {
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
};

// API Service
class APIService {
    static async request(endpoint, params = {}) {
        const url = new URL(CONFIG.API_BASE_URL + endpoint);
        
        // Add parameters to URL
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                url.searchParams.append(key, params[key]);
            }
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);

        try {
            console.log('Making API request to:', url.toString());
            
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Request timeout - please try again');
            }
            
            if (error.message.includes('fetch')) {
                throw new Error('Unable to connect to weather service. Please check your internet connection.');
            }
            
            throw error;
        }
    }

    static async getCurrentWeather(city) {
        const cacheKey = `current-${city}`;
        const cached = state.getCache(cacheKey);
        if (cached) return cached;

        const data = await this.request(CONFIG.ENDPOINTS.current, { city });
        state.setCache(cacheKey, data);
        return data;
    }

    static async getWeatherByCoordinates(lat, lon) {
        const cacheKey = `coords-${lat}-${lon}`;
        const cached = state.getCache(cacheKey);
        if (cached) return cached;

        const data = await this.request(CONFIG.ENDPOINTS.coordinates, { lat, lon });
        state.setCache(cacheKey, data);
        return data;
    }

    static async getForecast(city, days = 5) {
        const cacheKey = `forecast-${city}-${days}`;
        const cached = state.getCache(cacheKey);
        if (cached) return cached;

        const data = await this.request(CONFIG.ENDPOINTS.forecast, { city, days });
        state.setCache(cacheKey, data);
        return data;
    }

    static async getHistory(city, days = 3) {
        const cacheKey = `history-${city}-${days}`;
        const cached = state.getCache(cacheKey);
        if (cached) return cached;

        const data = await this.request(CONFIG.ENDPOINTS.history, { city, days });
        state.setCache(cacheKey, data);
        return data;
    }

    static async getLocationWeather() {
        const data = await this.request(CONFIG.ENDPOINTS.location);
        return data;
    }
}

// UI Controller
class UIController {
    static showLoading() {
        state.isLoading = true;
        elements.loadingContainer.style.display = 'flex';
        elements.errorContainer.style.display = 'none';
        elements.weatherContent.style.display = 'none';
    }

    static hideLoading() {
        state.isLoading = false;
        elements.loadingContainer.style.display = 'none';
    }

    static showError(message) {
        elements.errorText.textContent = message;
        elements.errorContainer.style.display = 'flex';
        elements.weatherContent.style.display = 'none';
        this.hideLoading();
    }

    static showWeather() {
        elements.weatherContent.style.display = 'block';
        elements.errorContainer.style.display = 'none';
        this.hideLoading();
    }

    static switchView(viewName) {
        // Update tabs
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.classList.remove('active');
        });
        elements[viewName + 'Tab'].classList.add('active');

        // Update views
        document.querySelectorAll('.view-content').forEach(view => {
            view.style.display = 'none';
        });
        elements[viewName + 'View'].style.display = 'block';

        state.currentView = viewName;
    }

    static updateCurrentWeather(data) {
        const { location, current } = data;

        // Location info
        elements.locationName.textContent = location.name;
        elements.locationDetails.textContent = `${location.region}, ${location.country}`;
        elements.localTime.querySelector('span').textContent = 
            new Date(location.localtime).toLocaleString();

        // Weather icon
        elements.weatherIcon.src = `https:${current.condition.icon}`;
        elements.weatherIcon.alt = current.condition.text;

        // Temperature
        elements.currentTemp.textContent = utils.formatTemp(current.temp_c);
        elements.feelsLike.textContent = utils.formatTemp(current.feelslike_c);
        elements.weatherCondition.textContent = current.condition.text;

        // Update temperature units
        document.querySelectorAll('.temp-unit').forEach(el => {
            el.textContent = utils.getTempUnit();
        });

        // Metrics
        elements.humidity.textContent = `${current.humidity}%`;
        elements.windSpeed.textContent = `${Math.round(current.wind_kph)} km/h`;
        elements.uvIndex.textContent = current.uv || '--';
        elements.visibility.textContent = `${Math.round(current.visibility_km)} km`;
        elements.pressure.textContent = `${Math.round(current.pressure_mb)} mb`;

        // Air quality
        const airQuality = current.air_quality || {};
        const aqi = airQuality.us_epa_index || '--';
        elements.airQuality.textContent = aqi;

        // Comfort level
        const comfort = utils.calculateComfort(
            current.temp_c, 
            current.humidity, 
            current.wind_kph
        );
        elements.comfortDescription.textContent = `Feels ${comfort.description}`;
        elements.comfortIndicator.style.width = `${comfort.level}%`;

        // Apply weather-based styling
        const weatherClass = utils.getWeatherClass(current.condition.text);
        document.body.className = document.body.className.replace(
            /\b(sunny|cloudy|rainy|snowy|stormy)\b/g, ''
        );
        document.body.classList.add(weatherClass);

        state.currentData = data;
        state.currentLocation = location.name;
    }

    static updateForecast(data) {
        if (!data.forecast || !data.forecast.forecastday) {
            elements.forecastContainer.innerHTML = '<div class="no-data">No forecast data available</div>';
            return;
        }

        // Daily forecast
        const forecastHTML = data.forecast.forecastday.slice(0, 5).map(day => `
            <div class="forecast-card">
                <div class="forecast-header">
                    <h4 class="forecast-day">${utils.getDayName(day.date)}</h4>
                    <p class="forecast-date">${utils.formatDate(day.date)}</p>
                </div>
                <div class="forecast-icon">
                    <img src="https:${day.day.condition.icon}" alt="${day.day.condition.text}" />
                </div>
                <p class="forecast-condition">${day.day.condition.text}</p>
                <div class="forecast-temps">
                    <span class="high-temp">${utils.formatTemp(day.day.maxtemp_c)}°</span>
                    <span class="temp-separator">/</span>
                    <span class="low-temp">${utils.formatTemp(day.day.mintemp_c)}°</span>
                </div>
                <div class="forecast-details">
                    <div class="detail-item">
                        <i class="fas fa-tint"></i>
                        <span>${day.day.daily_chance_of_rain}%</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-wind"></i>
                        <span>${Math.round(day.day.maxwind_kph)}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-sun"></i>
                        <span>${day.day.uv || '--'}</span>
                    </div>
                </div>
                ${day.astro ? `
                    <div class="astro-info" style="margin-top: 8px; font-size: 12px; color: var(--muted);">
                        <div>🌅 ${day.astro.sunrise}</div>
                        <div>🌇 ${day.astro.sunset}</div>
                    </div>
                ` : ''}
            </div>
        `).join('');

        elements.forecastContainer.innerHTML = forecastHTML;

        // Hourly forecast (next 24 hours)
        if (data.forecast.forecastday[0] && data.forecast.forecastday[0].hour) {
            const currentHour = new Date().getHours();
            const hourlyData = data.forecast.forecastday[0].hour.slice(currentHour, currentHour + 12);
            
            const hourlyHTML = hourlyData.map(hour => `
                <div class="hourly-card">
                    <div class="hourly-time">${new Date(hour.time).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})}</div>
                    <div class="hourly-icon">
                        <img src="https:${hour.condition.icon}" alt="${hour.condition.text}" />
                    </div>
                    <div class="hourly-temp">${utils.formatTemp(hour.temp_c)}°</div>
                    <div class="hourly-details">
                        <span>${hour.chance_of_rain}%</span>
                        <span>${Math.round(hour.wind_kph)}km/h</span>
                    </div>
                </div>
            `).join('');

            elements.hourlyContainer.innerHTML = hourlyHTML;
        }

        state.forecastData = data;
    }

    static updateHistory(data) {
        if (!data.history || data.history.length === 0) {
            elements.historyContainer.innerHTML = '<div class="no-data">No historical data available</div>';
            return;
        }

        const historyHTML = data.history.map(day => `
            <div class="history-card">
                <div class="history-header">
                    <div class="history-date-info">
                        <h4 class="history-day">${utils.getDayName(day.date)}</h4>
                        <p class="history-date">${utils.formatDate(day.date)}</p>
                    </div>
                    <img src="https:${day.day.condition.icon}" alt="${day.day.condition.text}" />
                </div>
                <p class="history-condition">${day.day.condition.text}</p>
                <div class="history-temps">
                    <div class="temp-range">
                        <span class="high-temp">${utils.formatTemp(day.day.maxtemp_c)}°</span>
                        <span class="temp-separator">/</span>
                        <span class="low-temp">${utils.formatTemp(day.day.mintemp_c)}°</span>
                    </div>
                </div>
                <div class="history-metrics">
                    <div class="metric-item">
                        <i class="fas fa-tint"></i>
                        <label>Rain</label>
                        <span>${day.day.totalprecip_mm}mm</span>
                    </div>
                    <div class="metric-item">
                        <i class="fas fa-wind"></i>
                        <label>Wind</label>
                        <span>${Math.round(day.day.maxwind_kph)}km/h</span>
                    </div>
                    <div class="metric-item">
                        <i class="fas fa-eye"></i>
                        <label>Humid</label>
                        <span>${day.day.avghumidity}%</span>
                    </div>
                    <div class="metric-item">
                        <i class="fas fa-sun"></i>
                        <label>UV</label>
                        <span>${day.day.uv || '--'}</span>
                    </div>
                </div>
            </div>
        `).join('');

        elements.historyContainer.innerHTML = historyHTML;
        state.historyData = data;
    }

    static updateUnits() {
        // Update temperature displays
        if (state.currentData) {
            const current = state.currentData.current;
            elements.currentTemp.textContent = utils.formatTemp(current.temp_c);
            elements.feelsLike.textContent = utils.formatTemp(current.feelslike_c);
        }

        // Update unit symbols
        document.querySelectorAll('.temp-unit').forEach(el => {
            el.textContent = utils.getTempUnit();
        });

        // Refresh forecast and history with new units
        if (state.forecastData) {
            this.updateForecast(state.forecastData);
        }
        if (state.historyData) {
            this.updateHistory(state.historyData);
        }
    }

    static toggleTheme() {
        const body = document.body;
        const themeIcon = elements.themeToggle.querySelector('i');
        
        if (body.classList.contains('dark-theme')) {
            body.classList.remove('dark-theme');
            themeIcon.className = 'fas fa-moon';
            state.currentTheme = 'light';
            localStorage.setItem('weather-theme', 'light');
        } else {
            body.classList.add('dark-theme');
            themeIcon.className = 'fas fa-sun';
            state.currentTheme = 'dark';
            localStorage.setItem('weather-theme', 'dark');
        }
    }

    static showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        }[type];

        toast.innerHTML = `
            <i class="${icon}"></i>
            <span>${message}</span>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        elements.toastContainer.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add('toast-show'), 100);

        // Auto remove after 5 seconds
        const autoRemove = setTimeout(() => this.removeToast(toast), 5000);

        // Manual close
        toast.querySelector('.toast-close').onclick = () => {
            clearTimeout(autoRemove);
            this.removeToast(toast);
        };
    }

    static removeToast(toast) {
        toast.classList.remove('toast-show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
}

// Weather Controller
class WeatherController {
    static async loadWeatherData(location, isCoords = false) {
        try {
            UIController.showLoading();

            let currentWeather, forecast, history;

            if (isCoords) {
                const [lat, lon] = location;
                currentWeather = await APIService.getWeatherByCoordinates(lat, lon);
                forecast = await APIService.request(CONFIG.ENDPOINTS.forecast, { lat, lon, days: 5 });
                history = await APIService.request(CONFIG.ENDPOINTS.history, { 
                    city: `${lat},${lon}`, 
                    days: 3 
                });
            } else {
                currentWeather = await APIService.getCurrentWeather(location);
                forecast = await APIService.getForecast(location, 5);
                history = await APIService.getHistory(location, 3);
            }

            // Update all views
            UIController.updateCurrentWeather(currentWeather);
            UIController.updateForecast(forecast);
            UIController.updateHistory(history);
            UIController.showWeather();

            // Update sun/moon data if available from forecast
            if (forecast.forecast && forecast.forecast.forecastday[0]) {
                const astro = forecast.forecast.forecastday[0].astro;
                if (astro) {
                    elements.sunrise.textContent = utils.formatTime(astro.sunrise);
                    elements.sunset.textContent = utils.formatTime(astro.sunset);
                    elements.moonPhase.textContent = astro.moon_phase || '--';
                }
            }

            UIController.showToast(`Weather updated for ${currentWeather.location.name}`, 'success');

        } catch (error) {
            console.error('Weather load error:', error);
            UIController.showError(error.message || 'Failed to load weather data');
            UIController.showToast(error.message || 'Failed to load weather data', 'error');
        }
    }

    static async searchWeather(city) {
        if (!city || city.trim().length === 0) {
            UIController.showToast('Please enter a city name', 'warning');
            return;
        }

        await this.loadWeatherData(city.trim());
    }

    static async getCurrentLocationWeather() {
        try {
            // First try geolocation API
            if (navigator.geolocation) {
                UIController.showToast('Getting your location...', 'info');
                
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;
                        await this.loadWeatherData([latitude, longitude], true);
                    },
                    async (error) => {
                        console.warn('Geolocation failed:', error);
                        UIController.showToast('Geolocation failed, using IP location', 'warning');
                        
                        // Fallback to IP-based location
                        try {
                            const data = await APIService.getLocationWeather();
                            UIController.updateCurrentWeather(data);
                            UIController.showWeather();
                            UIController.showToast(`Weather updated for ${data.location.name}`, 'success');
                        } catch (ipError) {
                            throw new Error('Unable to determine your location');
                        }
                    },
                    {
                        timeout: 10000,
                        enableHighAccuracy: false
                    }
                );
            } else {
                // No geolocation support, use IP location
                const data = await APIService.getLocationWeather();
                UIController.updateCurrentWeather(data);
                UIController.showWeather();
            }
        } catch (error) {
            console.error('Location weather error:', error);
            UIController.showError(error.message);
            UIController.showToast(error.message, 'error');
        }
    }

    static async refreshWeather() {
        if (state.currentLocation) {
            state.clearCache();
            await this.loadWeatherData(state.currentLocation);
        } else {
            await this.getCurrentLocationWeather();
        }
    }
}

// Event Listeners Setup
function setupEventListeners() {
    // Search functionality
    const handleSearch = () => {
        const city = elements.cityInput.value.trim();
        if (city) {
            WeatherController.searchWeather(city);
            elements.cityInput.value = '';
        }
    };

    elements.searchBtn.addEventListener('click', handleSearch);
    elements.cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // Debounced search on input
    const debouncedSearch = utils.debounce((city) => {
        if (city.length >= 3) {
            // Could implement search suggestions here
        }
    }, 300);

    elements.cityInput.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
    });

    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.addEventListener('click', () => {
            const view = tab.dataset.view;
            UIController.switchView(view);
        });
    });

    // Temperature unit toggle
    elements.celsiusBtn.addEventListener('click', () => {
        if (state.currentUnit !== 'celsius') {
            state.currentUnit = 'celsius';
            elements.celsiusBtn.classList.add('active');
            elements.fahrenheitBtn.classList.remove('active');
            UIController.updateUnits();
            localStorage.setItem('weather-unit', 'celsius');
        }
    });

    elements.fahrenheitBtn.addEventListener('click', () => {
        if (state.currentUnit !== 'fahrenheit') {
            state.currentUnit = 'fahrenheit';
            elements.fahrenheitBtn.classList.add('active');
            elements.celsiusBtn.classList.remove('active');
            UIController.updateUnits();
            localStorage.setItem('weather-unit', 'fahrenheit');
        }
    });

    // Control buttons
    elements.themeToggle.addEventListener('click', UIController.toggleTheme);
    elements.locationBtn.addEventListener('click', WeatherController.getCurrentLocationWeather);
    elements.refreshBtn.addEventListener('click', () => {
        elements.refreshBtn.querySelector('i').style.animation = 'spin 1s linear infinite';
        WeatherController.refreshWeather().finally(() => {
            elements.refreshBtn.querySelector('i').style.animation = '';
        });
    });

    // Modal handlers
    elements.allowLocationBtn.addEventListener('click', () => {
        elements.locationModal.style.display = 'none';
        WeatherController.getCurrentLocationWeather();
        localStorage.setItem('weather-location-permission', 'granted');
    });

    elements.skipLocationBtn.addEventListener('click', () => {
        elements.locationModal.style.display = 'none';
        WeatherController.loadWeatherData(CONFIG.DEFAULT_CITY);
        localStorage.setItem('weather-location-permission', 'denied');
    });

    // Error retry
    elements.retryBtn.addEventListener('click', () => {
        if (state.currentLocation) {
            WeatherController.loadWeatherData(state.currentLocation);
        } else {
            WeatherController.loadWeatherData(CONFIG.DEFAULT_CITY);
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K for search focus
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            elements.cityInput.focus();
        }
        
        // R for refresh
        if (e.key === 'r' && !e.ctrlKey && !e.metaKey && document.activeElement !== elements.cityInput) {
            e.preventDefault();
            WeatherController.refreshWeather();
        }
        
        // T for theme toggle
        if (e.key === 't' && !e.ctrlKey && !e.metaKey && document.activeElement !== elements.cityInput) {
            e.preventDefault();
            UIController.toggleTheme();
        }
        
        // 1, 2, 3 for tab switching
        if (e.key >= '1' && e.key <= '3' && !e.ctrlKey && !e.metaKey && document.activeElement !== elements.cityInput) {
            e.preventDefault();
            const views = ['current', 'forecast', 'history'];
            const viewIndex = parseInt(e.key) - 1;
            if (views[viewIndex]) {
                UIController.switchView(views[viewIndex]);
            }
        }
    });

    // Prevent form submission on Enter in search
    elements.cityInput.closest('form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSearch();
    });
}

// Initialize Application
function initializeApp() {
    console.log('Initializing Weather Pro Application...');

    // Load saved preferences
    loadUserPreferences();

    // Setup event listeners
    setupEventListeners();

    // Check if we should show location modal
    const locationPermission = localStorage.getItem('weather-location-permission');
    const hasVisited = localStorage.getItem('weather-app-visited');

    if (!hasVisited) {
        // First time visitor
        localStorage.setItem('weather-app-visited', 'true');
        if (!locationPermission) {
            elements.locationModal.style.display = 'flex';
            return; // Don't load default weather yet
        }
    }

    // Load initial weather data
    if (locationPermission === 'granted') {
        WeatherController.getCurrentLocationWeather();
    } else {
        // Load default city weather
        WeatherController.loadWeatherData(CONFIG.DEFAULT_CITY);
    }

    console.log('Weather Pro Application initialized successfully');
}

function loadUserPreferences() {
    // Load theme preference
    const savedTheme = localStorage.getItem('weather-theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        elements.themeToggle.querySelector('i').className = 'fas fa-sun';
        state.currentTheme = 'dark';
    }

    // Load unit preference
    const savedUnit = localStorage.getItem('weather-unit');
    if (savedUnit === 'fahrenheit') {
        state.currentUnit = 'fahrenheit';
        elements.fahrenheitBtn.classList.add('active');
        elements.celsiusBtn.classList.remove('active');
    }

    // Load last searched location
    const lastLocation = localStorage.getItem('weather-last-location');
    if (lastLocation) {
        state.currentLocation = lastLocation;
    }
}

// Error Handler for unhandled promises
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    UIController.showToast('An unexpected error occurred', 'error');
});

// Online/Offline detection
window.addEventListener('online', () => {
    UIController.showToast('Connection restored', 'success');
    if (state.currentLocation) {
        WeatherController.refreshWeather();
    }
});

window.addEventListener('offline', () => {
    UIController.showToast('Connection lost. Some features may not work.', 'warning');
});

// Visibility change handler (refresh when tab becomes visible)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && state.currentLocation) {
        // Check if data is older than 10 minutes
        const lastUpdate = localStorage.getItem('weather-last-update');
        if (lastUpdate && (Date.now() - parseInt(lastUpdate)) > 10 * 60 * 1000) {
            WeatherController.refreshWeather();
        }
    }
});

// Service Worker for PWA functionality (if available)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('SW registered:', registration);
        } catch (error) {
            console.log('SW registration failed:', error);
        }
    });
}

// Geolocation options
const geolocationOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 300000 // 5 minutes
};

// Update the getCurrentLocationWeather method to use better geolocation
WeatherController.getCurrentLocationWeather = async function() {
    try {
        if (!navigator.geolocation) {
            throw new Error('Geolocation is not supported by this browser');
        }

        UIController.showToast('Getting your location...', 'info');
        
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, geolocationOptions);
        });

        const { latitude, longitude } = position.coords;
        await this.loadWeatherData([latitude, longitude], true);
        
        // Save location permission
        localStorage.setItem('weather-location-permission', 'granted');
        
    } catch (error) {
        console.warn('Geolocation failed:', error);
        
        // Fallback to IP-based location
        try {
            UIController.showToast('Using IP location...', 'info');
            const data = await APIService.getLocationWeather();
            UIController.updateCurrentWeather(data);
            UIController.showWeather();
            UIController.showToast(`Weather updated for ${data.location.name}`, 'success');
            
            // Update state
            state.currentData = data;
            state.currentLocation = data.location.name;
            
        } catch (ipError) {
            console.error('IP location also failed:', ipError);
            UIController.showError('Unable to determine your location. Please search for a city.');
            UIController.showToast('Location detection failed', 'error');
        }
    }
};

// Enhanced error handling for API requests
const originalRequest = APIService.request;
APIService.request = async function(endpoint, params = {}) {
    try {
        const data = await originalRequest.call(this, endpoint, params);
        
        // Save successful API call timestamp
        localStorage.setItem('weather-last-update', Date.now().toString());
        
        return data;
    } catch (error) {
        // Enhanced error messages based on error type
        if (error.message.includes('404')) {
            throw new Error('Location not found. Please check the spelling and try again.');
        } else if (error.message.includes('429')) {
            throw new Error('Too many requests. Please wait a moment and try again.');
        } else if (error.message.includes('401') || error.message.includes('403')) {
            throw new Error('Weather service authentication failed. Please try again later.');
        } else if (error.message.includes('timeout')) {
            throw new Error('Request timed out. Please check your internet connection.');
        } else if (error.message.includes('fetch')) {
            throw new Error('Network error. Please check your internet connection.');
        }
        
        throw error;
    }
};

// Add animation utilities for better UX
const AnimationUtils = {
    fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        let start = null;
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const opacity = Math.min(progress / duration, 1);
            
            element.style.opacity = opacity;
            
            if (progress < duration) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    },
    
    fadeOut(element, duration = 300) {
        let start = null;
        const initialOpacity = parseFloat(getComputedStyle(element).opacity);
        
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const opacity = initialOpacity * (1 - Math.min(progress / duration, 1));
            
            element.style.opacity = opacity;
            
            if (progress < duration) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
            }
        };
        
        requestAnimationFrame(animate);
    }
};

// Performance optimization: Intersection Observer for lazy loading
const lazyLoadImages = () => {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
};

// Add data persistence for offline functionality
const DataPersistence = {
    save(key, data) {
        try {
            localStorage.setItem(`weather-${key}`, JSON.stringify({
                data,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.warn('Failed to save data to localStorage:', error);
        }
    },
    
    load(key, maxAge = 30 * 60 * 1000) { // 30 minutes default
        try {
            const stored = localStorage.getItem(`weather-${key}`);
            if (!stored) return null;
            
            const parsed = JSON.parse(stored);
            if (Date.now() - parsed.timestamp > maxAge) {
                localStorage.removeItem(`weather-${key}`);
                return null;
            }
            
            return parsed.data;
        } catch (error) {
            console.warn('Failed to load data from localStorage:', error);
            return null;
        }
    },
    
    clear() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('weather-') && !key.includes('theme') && !key.includes('unit')) {
                localStorage.removeItem(key);
            }
        });
    }
};

// Initialize the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Export for potential external use
window.WeatherApp = {
    state,
    WeatherController,
    UIController,
    APIService,
    utils
};