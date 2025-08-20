// ===============================
// Weather Pro - Complete JavaScript Implementation
// Professional weather app with full error handling, themes, and responsive UI
// ===============================

// ============ Configuration ============
const CONFIG = {
    // Update this to your Render backend URL when deployed
    API_BASE: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? "http://127.0.0.1:8000" 
        : "https://weather-forecast-app-bib8.onrender.com", 
    DEFAULT_CITY: "London",
    STORAGE_KEYS: {
        THEME: 'weather_theme',
        LAST_CITY: 'weather_last_city',
        UNIT: 'weather_unit'
    }
};

// ============ Global State ============
let currentState = {
    lastCity: localStorage.getItem(CONFIG.STORAGE_KEYS.LAST_CITY) || CONFIG.DEFAULT_CITY,
    currentUnit: localStorage.getItem(CONFIG.STORAGE_KEYS.UNIT) || 'C',
    isLoading: false,
    lastWeatherData: null
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
    return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
}

function getWeatherClass(condition) {
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
    return { class: '', text: 'Comfortable conditions' };
}

function convertTemp(temp, fromUnit, toUnit) {
    if (fromUnit === toUnit) return temp;
    if (fromUnit === 'C' && toUnit === 'F') return (temp * 9/5) + 32;
    if (fromUnit === 'F' && toUnit === 'C') return (temp - 32) * 5/9;
    return temp;
}

function formatTemp(temp) {
    return currentState.currentUnit === 'C' ? Math.round(temp) : Math.round(convertTemp(temp, 'C', 'F'));
}

// ============ API Functions ============
async function makeRequest(endpoint, params = {}) {
    try {
        const url = new URL(endpoint, CONFIG.API_BASE);
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                url.searchParams.append(key, params[key]);
            }
        });

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Network error' }));
            throw new Error(errorData.detail || `HTTP ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`API Error for ${endpoint}:`, error);
        throw error;
    }
}

async function fetchCurrentWeather(city) {
    return await makeRequest('/weather/current', { city });
}

async function fetchForecast(city, days = 3) {
    return await makeRequest('/weather/forecast', { city, days });
}

async function fetchHistory(city, days = 3) {
    return await makeRequest('/weather/history', { city, days });
}

async function fetchLocationWeather() {
    return await makeRequest('/weather/location');
}

async function fetchWeatherByCoordinates(lat, lon) {
    return await makeRequest('/weather/coordinates', { lat, lon });
}

// ============ UI State Management ============
function showLoading() {
    elements.loadingContainer.style.display = 'flex';
    elements.errorContainer.style.display = 'none';
    elements.weatherContent.style.display = 'none';
    currentState.isLoading = true;
}

function showError(message) {
    elements.loadingContainer.style.display = 'none';
    elements.weatherContent.style.display = 'none';
    elements.errorContainer.style.display = 'flex';
    elements.errorText.textContent = message;
    currentState.isLoading = false;
}

function showWeather() {
    elements.loadingContainer.style.display = 'none';
    elements.errorContainer.style.display = 'none';
    elements.weatherContent.style.display = 'block';
    currentState.isLoading = false;
}

function switchTab(tabName) {
    // Remove active class from all tabs
    document.querySelectorAll('.tab-btn').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.view-content').forEach(view => view.style.display = 'none');

    // Activate selected tab
    elements[tabName + 'Tab'].classList.add('active');
    elements[tabName + 'View'].style.display = 'block';
}

// ============ Weather Data Updates ============
function updateCurrentWeather(data) {
    const { location, current } = data;
    
    // Location info
    elements.locationName.textContent = location.name;
    elements.locationDetails.textContent = `${location.region}, ${location.country}`;
    elements.localTime.querySelector('span').textContent = formatTime(location.localtime);

    // Temperature
    elements.currentTemp.textContent = formatTemp(current.temp_c);
    elements.feelsLike.textContent = formatTemp(current.feelslike_c);
    elements.weatherCondition.textContent = current.condition.text;

    // Weather icon
    if (elements.weatherIcon && current.condition.icon) {
        elements.weatherIcon.src = current.condition.icon.startsWith('http') 
            ? current.condition.icon 
            : `https:${current.condition.icon}`;
        elements.weatherIcon.alt = current.condition.text;
    }

    // Metrics
    elements.humidity.textContent = `${current.humidity}%`;
    elements.windSpeed.textContent = currentState.currentUnit === 'C' 
        ? `${current.wind_kph} km/h` 
        : `${current.wind_mph} mph`;
    elements.uvIndex.textContent = current.uv || '--';
    elements.visibility.textContent = currentState.currentUnit === 'C' 
        ? `${current.visibility_km} km` 
        : `${current.visibility_miles} mi`;
    elements.pressure.textContent = currentState.currentUnit === 'C' 
        ? `${current.pressure_mb} mb` 
        : `${current.pressure_in} in`;
    
    // Air quality
    const aqData = data.air_quality;
    if (aqData && Object.keys(aqData).length > 0) {
        elements.airQuality.textContent = 'Good'; // Simplified for now
    } else {
        elements.airQuality.textContent = 'N/A';
    }

    // Comfort level
    const comfort = getComfortLevel(current.temp_c, current.humidity, current.wind_kph);
    elements.comfortIndicator.className = `comfort-indicator ${comfort.class}`;
    elements.comfortDescription.textContent = comfort.text;

    // Update background theme based on weather
    document.body.className = document.body.className.replace(/\b(sunny|cloudy|rainy|snowy|stormy)\b/g, '');
    const weatherClass = getWeatherClass(current.condition.text);
    if (weatherClass) {
        document.body.classList.add(weatherClass);
    }

    // Update temperature unit display
    document.querySelectorAll('.temp-unit').forEach(unit => {
        unit.textContent = `°${currentState.currentUnit}`;
    });
}

function updateForecast(data) {
    const container = elements.forecastContainer;
    const hourlyContainer = elements.hourlyContainer;
    
    if (!container) return;
    
    container.innerHTML = '';
    if (hourlyContainer) hourlyContainer.innerHTML = '';

    const forecastDays = data.forecast?.forecastday || [];
    
    // Daily forecast
    forecastDays.slice(0, 3).forEach(day => {
        const card = createForecastCard(day);
        container.appendChild(card);
    });

    // Hourly forecast from today
    if (hourlyContainer && forecastDays[0]?.hour) {
        const todayHours = forecastDays[0].hour;
        const currentHour = new Date().getHours();
        
        // Show next 8 hours
        const nextHours = todayHours.slice(currentHour, currentHour + 8);
        nextHours.forEach(hour => {
            const card = createHourlyCard(hour);
            hourlyContainer.appendChild(card);
        });
    }

    // Update sun/moon info from today's astro data
    if (forecastDays[0]?.astro) {
        const astro = forecastDays[0].astro;
        if (elements.sunrise) elements.sunrise.textContent = astro.sunrise;
        if (elements.sunset) elements.sunset.textContent = astro.sunset;
        if (elements.moonPhase) elements.moonPhase.textContent = astro.moon_phase;
    }
}

function createForecastCard(day) {
    const card = document.createElement('div');
    card.className = 'forecast-card';
    
    const date = new Date(day.date);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    card.innerHTML = `
        <div class="forecast-header">
            <h4 class="forecast-day">${dayName}</h4>
            <p class="forecast-date">${dateStr}</p>
        </div>
        <div class="forecast-icon">
            <img src="https:${day.day.condition.icon}" alt="${day.day.condition.text}" />
        </div>
        <p class="forecast-condition">${day.day.condition.text}</p>
        <div class="forecast-temps">
            <span class="high-temp">${formatTemp(day.day.maxtemp_c)}°</span>
            <span class="low-temp">${formatTemp(day.day.mintemp_c)}°</span>
        </div>
        <div class="forecast-details">
            <div class="detail-item">
                <i class="fas fa-tint"></i>
                <span>${day.day.avghumidity}%</span>
            </div>
            <div class="detail-item">
                <i class="fas fa-wind"></i>
                <span>${day.day.maxwind_kph} km/h</span>
            </div>
            <div class="detail-item">
                <i class="fas fa-cloud-rain"></i>
                <span>${day.day.daily_chance_of_rain}%</span>
            </div>
        </div>
    `;
    
    return card;
}

function createHourlyCard(hour) {
    const card = document.createElement('div');
    card.className = 'hourly-card';
    
    const time = formatTime(hour.time);
    
    card.innerHTML = `
        <p class="hourly-time">${time}</p>
        <div class="forecast-icon">
            <img src="https:${hour.condition.icon}" alt="${hour.condition.text}" />
        </div>
        <p class="hourly-temp">${formatTemp(hour.temp_c)}°</p>
        <div class="hourly-details">
            <span><i class="fas fa-tint"></i> ${hour.humidity}%</span>
            <span><i class="fas fa-cloud-rain"></i> ${hour.chance_of_rain}%</span>
        </div>
    `;
    
    return card;
}

function updateHistory(data) {
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
}

function createHistoryCard(day) {
    const card = document.createElement('div');
    card.className = 'history-card';
    
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
                <img src="https:${day.day.condition.icon}" alt="${day.day.condition.text}" />
            </div>
        </div>
        <p class="history-condition">${day.day.condition.text}</p>
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
                <span>${day.day.avghumidity}%</span>
            </div>
            <div class="metric-item">
                <label>Wind</label>
                <span>${day.day.maxwind_kph} km/h</span>
            </div>
            <div class="metric-item">
                <label>UV</label>
                <span>${day.day.uv || 'N/A'}</span>
            </div>
            <div class="metric-item">
                <label>Rain</label>
                <span>${day.day.totalprecip_mm} mm</span>
            </div>
        </div>
    `;
    
    return card;
}

// ============ Main Weather Loading Function ============
async function loadWeather(city) {
    if (!city?.trim()) {
        showError('Please enter a valid city name');
        return;
    }

    try {
        showLoading();
        currentState.lastCity = city.trim();
        
        // Store last searched city
        localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_CITY, currentState.lastCity);

        // Fetch all weather data
        const [currentWeather, forecast, history] = await Promise.allSettled([
            fetchCurrentWeather(currentState.lastCity),
            fetchForecast(currentState.lastCity, 3),
            fetchHistory(currentState.lastCity, 3)
        ]);

        // Handle current weather (required)
        if (currentWeather.status === 'fulfilled') {
            updateCurrentWeather(currentWeather.value);
            currentState.lastWeatherData = currentWeather.value;
        } else {
            throw new Error(currentWeather.reason?.message || 'Failed to fetch current weather');
        }

        // Handle forecast (optional)
        if (forecast.status === 'fulfilled') {
            updateForecast(forecast.value);
        } else {
            console.warn('Forecast failed:', forecast.reason);
            elements.forecastContainer.innerHTML = '<div class="no-data"><p>Forecast data unavailable</p></div>';
        }

        // Handle history (optional)
        if (history.status === 'fulfilled') {
            updateHistory(history.value);
        } else {
            console.warn('History failed:', history.reason);
            elements.historyContainer.innerHTML = '<div class="no-data"><p>Historical data unavailable</p></div>';
        }

        showWeather();
        showToast(`Weather updated for ${currentState.lastCity}`, 'success');

    } catch (error) {
        console.error('Weather loading error:', error);
        showError(error.message || 'Failed to load weather data');
        showToast(error.message || 'Failed to load weather data', 'error');
    }
}

// ============ Geolocation Functions ============
async function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
        };

        navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
}

async function loadLocationWeather() {
    try {
        showLoading();
        
        // Try to get precise coordinates first
        try {
            const position = await getCurrentLocation();
            const { latitude, longitude } = position.coords;
            const data = await fetchWeatherByCoordinates(latitude, longitude);
            await loadWeather(data.location.name);
            showToast('Location detected successfully', 'success');
            return;
        } catch (geoError) {
            console.warn('Geolocation failed, trying IP-based location:', geoError);
        }

        // Fallback to IP-based location
        const data = await fetchLocationWeather();
        await loadWeather(data.location.name);
        showToast('Location detected via IP', 'info');

    } catch (error) {
        console.error('Location weather error:', error);
        // Final fallback to default city
        await loadWeather(CONFIG.DEFAULT_CITY);
        showToast('Using default location', 'warning');
    }
}

// ============ Theme Management ============
function initializeTheme() {
    const savedTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    
    applyTheme(theme);
}

function applyTheme(theme) {
    document.body.className = document.body.className.replace(/\b(light|dark)-theme\b/g, '');
    document.body.classList.add(`${theme}-theme`);
    
    const icon = elements.themeToggle?.querySelector('i');
    if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
    
    localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, theme);
}

function toggleTheme() {
    const isDark = document.body.classList.contains('dark-theme');
    applyTheme(isDark ? 'light' : 'dark');
}

// ============ Unit Management ============
function initializeUnits() {
    const savedUnit = localStorage.getItem(CONFIG.STORAGE_KEYS.UNIT) || 'C';
    currentState.currentUnit = savedUnit;
    updateUnitButtons();
}

function updateUnitButtons() {
    elements.celsiusBtn?.classList.toggle('active', currentState.currentUnit === 'C');
    elements.fahrenheitBtn?.classList.toggle('active', currentState.currentUnit === 'F');
}

function switchUnit(unit) {
    if (currentState.currentUnit === unit) return;
    
    currentState.currentUnit = unit;
    localStorage.setItem(CONFIG.STORAGE_KEYS.UNIT, unit);
    updateUnitButtons();
    
    // Re-render current data with new units
    if (currentState.lastWeatherData) {
        updateCurrentWeather(currentState.lastWeatherData);
    }
    
    // Re-render forecast and history if available
    if (currentState.lastCity) {
        // Just update the display without fetching new data
        document.querySelectorAll('.temp-unit').forEach(unit => {
            unit.textContent = `°${currentState.currentUnit}`;
        });
    }
}

// ============ Event Listeners ============
function setupEventListeners() {
    // Search functionality
    elements.searchBtn?.addEventListener('click', handleSearch);
    elements.cityInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // Controls
    elements.locationBtn?.addEventListener('click', loadLocationWeather);
    elements.refreshBtn?.addEventListener('click', () => {
        if (currentState.lastCity) {
            loadWeather(currentState.lastCity);
        }
    });
    elements.retryBtn?.addEventListener('click', () => {
        if (currentState.lastCity) {
            loadWeather(currentState.lastCity);
        }
    });

    // Theme and units
    elements.themeToggle?.addEventListener('click', toggleTheme);
    elements.celsiusBtn?.addEventListener('click', () => switchUnit('C'));
    elements.fahrenheitBtn?.addEventListener('click', () => switchUnit('F'));

    // Tabs
    elements.currentTab?.addEventListener('click', () => switchTab('current'));
    elements.forecastTab?.addEventListener('click', () => switchTab('forecast'));
    elements.historyTab?.addEventListener('click', () => switchTab('history'));

    // Location modal
    elements.allowLocationBtn?.addEventListener('click', () => {
        elements.locationModal.style.display = 'none';
        loadLocationWeather();
    });
    
    elements.skipLocationBtn?.addEventListener('click', () => {
        elements.locationModal.style.display = 'none';
        loadWeather(CONFIG.DEFAULT_CITY);
    });

    // System theme change detection
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem(CONFIG.STORAGE_KEYS.THEME)) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });
}

function handleSearch() {
    const city = elements.cityInput?.value?.trim();
    if (city) {
        loadWeather(city);
        elements.cityInput.value = '';
    }
}

// ============ Initialization ============
async function initializeApp() {
    try {
        // Initialize theme and units
        initializeTheme();
        initializeUnits();
        
        // Setup all event listeners
        setupEventListeners();
        
        // Check if user wants to use location on first visit
        const hasSeenLocationPrompt = localStorage.getItem('weather_location_prompted');
        
        if (!hasSeenLocationPrompt && navigator.geolocation) {
            // Show location modal for first-time users
            elements.locationModal.style.display = 'flex';
            localStorage.setItem('weather_location_prompted', 'true');
        } else {
            // Load weather for returning users or fallback
            const lastCity = currentState.lastCity || CONFIG.DEFAULT_CITY;
            await loadWeather(lastCity);
        }
        
    } catch (error) {
        console.error('App initialization error:', error);
        showError('Failed to initialize the application');
    }
}

// ============ App Start ============
document.addEventListener('DOMContentLoaded', initializeApp);

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && currentState.lastCity) {
        // Refresh data when user returns to tab (with throttling)
        const lastUpdate = localStorage.getItem('weather_last_update');
        const now = Date.now();
        
        if (!lastUpdate || now - parseInt(lastUpdate) > 600000) { // 10 minutes
            loadWeather(currentState.lastCity);
            localStorage.setItem('weather_last_update', now.toString());
        }
    }
});

// Export for debugging (optional)
if (typeof window !== 'undefined') {
    window.WeatherApp = {
        loadWeather,
        loadLocationWeather,
        toggleTheme,
        switchUnit,
        currentState
    };
}