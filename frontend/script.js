// Enhanced Weather App JavaScript with Geolocation and Modern Features

// Configuration
const API_CONFIG = {
    baseUrl: window.location.hostname === 'localhost' 
        ? 'http://localhost:8000' 
        : 'https://weather-forecast-app-bib8.onrender.com',
    timeout: 15000
};

// Application State
class WeatherApp {
    constructor() {
        this.state = {
            currentUnit: 'celsius',
            currentWeatherData: null,
            currentLocation: null,
            currentTheme: 'light',
            currentView: 'current',
            isLoading: false,
            userCoordinates: null,
            lastUpdateTime: null
        };

        this.elements = this.initializeElements();
        this.init();
    }

    // Initialize DOM elements
    initializeElements() {
        return {
            // Modals
            locationModal: document.getElementById('locationModal'),
            allowLocationBtn: document.getElementById('allowLocationBtn'),
            skipLocationBtn: document.getElementById('skipLocationBtn'),

            // Controls
            cityInput: document.getElementById('cityInput'),
            searchBtn: document.getElementById('searchBtn'),
            locationBtn: document.getElementById('locationBtn'),
            refreshBtn: document.getElementById('refreshBtn'),
            celsiusBtn: document.getElementById('celsiusBtn'),
            fahrenheitBtn: document.getElementById('fahrenheitBtn'),
            themeToggle: document.getElementById('themeToggle'),

            // Views
            loadingContainer: document.getElementById('loadingContainer'),
            errorContainer: document.getElementById('errorContainer'),
            weatherContent: document.getElementById('weatherContent'),
            retryBtn: document.getElementById('retryBtn'),
            errorText: document.getElementById('errorText'),

            // Tabs
            currentTab: document.getElementById('currentTab'),
            forecastTab: document.getElementById('forecastTab'),
            historyTab: document.getElementById('historyTab'),
            currentView: document.getElementById('currentView'),
            forecastView: document.getElementById('forecastView'),
            historyView: document.getElementById('historyView'),

            // Weather display elements
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

            // Additional info
            sunrise: document.getElementById('sunrise'),
            sunset: document.getElementById('sunset'),
            moonPhase: document.getElementById('moonPhase'),
            comfortIndicator: document.getElementById('comfortIndicator'),
            comfortDescription: document.getElementById('comfortDescription'),

            // Containers
            forecastContainer: document.getElementById('forecastContainer'),
            hourlyContainer: document.getElementById('hourlyContainer'),
            historyContainer: document.getElementById('historyContainer'),
            toastContainer: document.getElementById('toastContainer')
        };
    }

    // Initialize the application
    async init() {
        this.setupEventListeners();
        this.loadTheme();
        await this.showLocationModal();
    }

    // Setup all event listeners
    setupEventListeners() {
        // Location modal
        this.elements.allowLocationBtn.addEventListener('click', () => this.requestGeolocation());
        this.elements.skipLocationBtn.addEventListener('click', () => this.skipGeolocation());

        // Search functionality
        this.elements.searchBtn.addEventListener('click', () => this.handleSearch());
        this.elements.cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
        this.elements.cityInput.addEventListener('input', (e) => this.handleSearchInput(e));

        // Controls
        this.elements.locationBtn.addEventListener('click', () => this.getCurrentLocationWeather());
        this.elements.refreshBtn.addEventListener('click', () => this.refreshCurrentData());
        this.elements.celsiusBtn.addEventListener('click', () => this.setUnit('celsius'));
        this.elements.fahrenheitBtn.addEventListener('click', () => this.setUnit('fahrenheit'));
        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());

        // Tab navigation
        this.elements.currentTab.addEventListener('click', () => this.switchView('current'));
        this.elements.forecastTab.addEventListener('click', () => this.switchView('forecast'));
        this.elements.historyTab.addEventListener('click', () => this.switchView('history'));

        // Error handling
        this.elements.retryBtn.addEventListener('click', () => this.retryLastAction());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboardNavigation(e));
    }

    // Show location permission modal
    async showLocationModal() {
        // Check if user has already made a choice
        const locationPermission = localStorage.getItem('weatherApp_locationPermission');
        
        if (locationPermission === 'granted') {
            await this.getCurrentLocationWeather();
        } else if (locationPermission === 'denied') {
            this.showDefaultWeather();
        } else {
            this.elements.locationModal.style.display = 'flex';
        }
    }

    // Request user geolocation
    async requestGeolocation() {
        this.hideLocationModal();
        this.showLoading('Getting your location...');

        try {
            const position = await this.getGeolocation();
            this.state.userCoordinates = {
                lat: position.coords.latitude,
                lon: position.coords.longitude
            };

            localStorage.setItem('weatherApp_locationPermission', 'granted');
            await this.fetchWeatherByCoordinates(position.coords.latitude, position.coords.longitude);
            
        } catch (error) {
            console.error('Geolocation error:', error);
            this.showToast('Location access denied or unavailable', 'error');
            this.showDefaultWeather();
        }
    }

    // Skip geolocation and show default
    skipGeolocation() {
        localStorage.setItem('weatherApp_locationPermission', 'denied');
        this.hideLocationModal();
        this.showDefaultWeather();
    }

    // Get geolocation promise wrapper
    getGeolocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                }
            );
        });
    }

    // Hide location modal
    hideLocationModal() {
        this.elements.locationModal.style.display = 'none';
    }

    // Show default weather (fallback)
    async showDefaultWeather() {
        try {
            // Try IP-based location first
            await this.fetchWeatherByLocation();
        } catch (error) {
            // If that fails, show a popular city
            await this.searchWeatherByCity('New York');
        }
    }

    // Handle search input with debouncing
    handleSearchInput(e) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            const query = e.target.value.trim();
            if (query.length > 2) {
                // Could implement search suggestions here
            }
        }, 300);
    }

    // Handle search button click
    async handleSearch() {
        const city = this.elements.cityInput.value.trim();
        if (!city) {
            this.showToast('Please enter a city name', 'warning');
            return;
        }

        this.state.currentLocation = city;
        await this.searchWeatherByCity(city);
    }

    // Get current location weather
    async getCurrentLocationWeather() {
        if (this.state.userCoordinates) {
            await this.fetchWeatherByCoordinates(
                this.state.userCoordinates.lat,
                this.state.userCoordinates.lon
            );
        } else {
            await this.requestGeolocation();
        }
    }

    // Refresh current data
    async refreshCurrentData() {
        if (this.state.currentLocation) {
            await this.searchWeatherByCity(this.state.currentLocation);
        } else if (this.state.userCoordinates) {
            await this.fetchWeatherByCoordinates(
                this.state.userCoordinates.lat,
                this.state.userCoordinates.lon
            );
        } else {
            await this.showDefaultWeather();
        }
    }

    // Set temperature unit
    setUnit(unit) {
        this.state.currentUnit = unit;
        
        // Update button states
        this.elements.celsiusBtn.classList.toggle('active', unit === 'celsius');
        this.elements.fahrenheitBtn.classList.toggle('active', unit === 'fahrenheit');
        
        // Update display if we have weather data
        if (this.state.currentWeatherData) {
            this.updateWeatherDisplay(this.state.currentWeatherData);
            if (this.state.currentWeatherData.forecast) {
                this.updateForecastDisplay(this.state.currentWeatherData.forecast.forecast.forecastday);
            }
            if (this.state.currentWeatherData.history) {
                this.updateHistoryDisplay(this.state.currentWeatherData.history);
            }
        }

        // Save preference
        localStorage.setItem('weatherApp_unit', unit);
    }

    // Load and set theme
    loadTheme() {
        const savedTheme = localStorage.getItem('weatherApp_theme') || 'light';
        this.setTheme(savedTheme);
    }

    // Toggle theme
    toggleTheme() {
        const newTheme = this.state.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    // Set theme
    setTheme(theme) {
        this.state.currentTheme = theme;
        document.body.className = `${theme}-theme`;
        
        // Update theme toggle icon
        const icon = this.elements.themeToggle.querySelector('i');
        icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        
        // Save theme preference
        localStorage.setItem('weatherApp_theme', theme);
    }

    // Switch between views
    async switchView(viewName) {
        this.state.currentView = viewName;
        
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-view="${viewName}"]`).classList.add('active');
        
        // Show/hide view content
        document.querySelectorAll('.view-content').forEach(view => view.style.display = 'none');
        this.elements[`${viewName}View`].style.display = 'block';
        
        // Load data for the selected view
        if (this.state.currentLocation || this.state.userCoordinates) {
            switch (viewName) {
                case 'forecast':
                    if (!this.state.currentWeatherData?.forecast) {
                        await this.loadForecastData();
                    }
                    break;
                case 'history':
                    if (!this.state.currentWeatherData?.history) {
                        await this.loadHistoryData();
                    }
                    break;
            }
        }
    }

    // Show loading state
    showLoading(message = 'Loading weather data...') {
        this.state.isLoading = true;
        this.elements.loadingContainer.style.display = 'flex';
        this.elements.loadingContainer.querySelector('.loading-text').textContent = message;
        this.elements.errorContainer.style.display = 'none';
        this.elements.weatherContent.style.display = 'none';
    }

    // Show error state
    showError(message, retryAction = null) {
        this.state.isLoading = false;
        this.elements.loadingContainer.style.display = 'none';
        this.elements.errorContainer.style.display = 'flex';
        this.elements.weatherContent.style.display = 'none';
        this.elements.errorText.textContent = message;
        
        this.lastRetryAction = retryAction;
    }

    // Show weather content
    showWeatherContent() {
        this.state.isLoading = false;
        this.elements.loadingContainer.style.display = 'none';
        this.elements.errorContainer.style.display = 'none';
        this.elements.weatherContent.style.display = 'block';
        this.state.lastUpdateTime = new Date();
    }

    // Retry last action
    async retryLastAction() {
        if (this.lastRetryAction) {
            await this.lastRetryAction();
        } else {
            await this.refreshCurrentData();
        }
    }

    // API call to search weather by city
    async searchWeatherByCity(city) {
        this.showLoading();
        
        try {
            const [currentResponse, forecastResponse] = await Promise.all([
                this.fetchWithTimeout(`${API_CONFIG.baseUrl}/weather/current?city=${encodeURIComponent(city)}`),
                this.fetchWithTimeout(`${API_CONFIG.baseUrl}/weather/forecast?city=${encodeURIComponent(city)}&days=5`)
            ]);

            if (!currentResponse.ok || !forecastResponse.ok) {
                throw new Error('City not found');
            }

            const currentData = await currentResponse.json();
            const forecastData = await forecastResponse.json();
            
            this.state.currentWeatherData = { current: currentData, forecast: forecastData };
            this.updateWeatherDisplay(this.state.currentWeatherData);
            this.showWeatherContent();
            
            // Clear search input
            this.elements.cityInput.value = '';
            
            this.showToast(`Weather data updated for ${currentData.location.name}`, 'success');
            
        } catch (error) {
            console.error('Error fetching weather:', error);
            const errorMessage = error.message === 'City not found' 
                ? 'City not found. Please try a different location.' 
                : 'Failed to fetch weather data. Please check your connection.';
            
            this.showError(errorMessage, () => this.searchWeatherByCity(city));
        }
    }

    // Fetch weather by coordinates
    async fetchWeatherByCoordinates(lat, lon) {
        this.showLoading('Getting weather for your location...');
        
        try {
            const [currentResponse, forecastResponse] = await Promise.all([
                this.fetchWithTimeout(`${API_CONFIG.baseUrl}/weather/coordinates?lat=${lat}&lon=${lon}`),
                this.fetchWithTimeout(`${API_CONFIG.baseUrl}/weather/forecast?lat=${lat}&lon=${lon}&days=5`)
            ]);

            if (!currentResponse.ok || !forecastResponse.ok) {
                throw new Error('Unable to get weather for your location');
            }

            const currentData = await currentResponse.json();
            const forecastData = await forecastResponse.json();
            
            this.state.currentWeatherData = { current: currentData, forecast: forecastData };
            this.state.currentLocation = `${currentData.location.name}, ${currentData.location.region}`;
            
            this.updateWeatherDisplay(this.state.currentWeatherData);
            this.showWeatherContent();
            
            this.showToast(`Weather updated for your location`, 'success');
            
        } catch (error) {
            console.error('Error fetching weather by coordinates:', error);
            this.showError('Unable to get weather for your location', () => 
                this.fetchWeatherByCoordinates(lat, lon)
            );
        }
    }

    // Fetch weather by IP location
    async fetchWeatherByLocation() {
        this.showLoading();
        
        try {
            const [currentResponse, forecastResponse] = await Promise.all([
                this.fetchWithTimeout(`${API_CONFIG.baseUrl}/weather/location`),
                this.fetchWithTimeout(`${API_CONFIG.baseUrl}/weather/forecast?city=auto:ip&days=5`)
            ]);

            if (!currentResponse.ok || !forecastResponse.ok) {
                throw new Error('Location not available');
            }

            const currentData = await currentResponse.json();
            const forecastData = await forecastResponse.json();
            
            this.state.currentLocation = currentData.location.name;
            this.state.currentWeatherData = { current: currentData, forecast: forecastData };
            
            this.updateWeatherDisplay(this.state.currentWeatherData);
            this.showWeatherContent();
            
        } catch (error) {
            console.error('Error fetching location weather:', error);
            throw error;
        }
    }

    // Load forecast data
    async loadForecastData() {
        if (!this.state.currentLocation) return;

        try {
            const response = await this.fetchWithTimeout(
                `${API_CONFIG.baseUrl}/weather/forecast?city=${encodeURIComponent(this.state.currentLocation)}&days=5`
            );
            
            if (!response.ok) {
                throw new Error('Failed to fetch forecast data');
            }
            
            const forecastData = await response.json();
            this.state.currentWeatherData.forecast = forecastData;
            this.updateForecastDisplay(forecastData.forecast.forecastday);
            
        } catch (error) {
            console.error('Error fetching forecast:', error);
            this.showToast('Failed to load forecast data', 'error');
        }
    }

    // Load history data
    async loadHistoryData() {
        if (!this.state.currentLocation) return;

        try {
            this.showLoading('Loading historical data...');
            
            const response = await this.fetchWithTimeout(
                `${API_CONFIG.baseUrl}/weather/history?city=${encodeURIComponent(this.state.currentLocation)}&days=3`
            );
            
            if (!response.ok) {
                throw new Error('Failed to fetch history data');
            }
            
            const historyData = await response.json();
            this.state.currentWeatherData.history = historyData.history;
            this.updateHistoryDisplay(historyData.history);
            this.showWeatherContent();
            
        } catch (error) {
            console.error('Error fetching history:', error);
            this.elements.historyContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to load historical data</p>
                </div>
            `;
            this.showWeatherContent();
        }
    }

    // Fetch with timeout wrapper
    async fetchWithTimeout(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }

    // Update weather display
    updateWeatherDisplay(data) {
        const { current } = data;
        
        try {
            // Update location info
            this.elements.locationName.textContent = current.location.name;
            this.elements.locationDetails.textContent = `${current.location.region}, ${current.location.country}`;
            this.elements.localTime.querySelector('span').textContent = this.formatDateTime(current.location.localtime);
            
            // Update current weather
            const temp = this.state.currentUnit === 'celsius' ? current.current.temp_c : current.current.temp_f;
            const feelsLike = this.state.currentUnit === 'celsius' ? current.current.feelslike_c : current.current.feelslike_f;
            const unit = this.state.currentUnit === 'celsius' ? '°C' : '°F';
            
            this.elements.currentTemp.textContent = Math.round(temp);
            this.elements.feelsLike.textContent = Math.round(feelsLike);
            this.elements.weatherCondition.textContent = current.current.condition.text;
            
            // Update weather icon
            this.elements.weatherIcon.src = `https:${current.current.condition.icon}`;
            this.elements.weatherIcon.alt = current.current.condition.text;
            
            // Update unit displays
            document.querySelectorAll('.temp-unit').forEach(el => el.textContent = unit);
            
            // Update weather metrics
            this.elements.humidity.textContent = `${current.current.humidity}%`;
            
            const windSpeed = this.state.currentUnit === 'celsius' ? current.current.wind_kph : current.current.wind_mph;
            const windUnit = this.state.currentUnit === 'celsius' ? 'km/h' : 'mph';
            this.elements.windSpeed.textContent = `${windSpeed} ${windUnit} ${current.current.wind_dir}`;
            
            this.elements.uvIndex.textContent = current.current.uv;
            
            // Update visibility and pressure
            if (current.current.visibility_km !== undefined) {
                const visibility = this.state.currentUnit === 'celsius' ? current.current.visibility_km : current.current.visibility_miles;
                const visUnit = this.state.currentUnit === 'celsius' ? 'km' : 'mi';
                this.elements.visibility.textContent = `${visibility} ${visUnit}`;
            }
            
            if (current.current.pressure_mb !== undefined) {
                const pressure = this.state.currentUnit === 'celsius' ? current.current.pressure_mb : current.current.pressure_in;
                const pressureUnit = this.state.currentUnit === 'celsius' ? 'mb' : 'in';
                this.elements.pressure.textContent = `${pressure} ${pressureUnit}`;
            }
            
            // Update air quality
            this.updateAirQuality(current.air_quality);
            
            // Update comfort level
            this.updateComfortLevel(temp, current.current.humidity, windSpeed);
            
            // Update forecast if available
            if (data.forecast) {
                this.updateForecastDisplay(data.forecast.forecast.forecastday);
                
                // Update sun/moon times
                if (data.forecast.forecast.forecastday.length > 0) {
                    const astro = data.forecast.forecast.forecastday[0].astro;
                    this.elements.sunrise.textContent = astro.sunrise;
                    this.elements.sunset.textContent = astro.sunset;
                    this.elements.moonPhase.textContent = astro.moon_phase;
                }
            }
            
            // Update background based on weather condition
            this.updateBackground(current.current.condition.code);
            
        } catch (error) {
            console.error('Error updating weather display:', error);
        }
    }

    // Update air quality display
    updateAirQuality(airQuality) {
        if (airQuality && Object.keys(airQuality).length > 0) {
            const aqi = this.calculateAQI(airQuality);
            this.elements.airQuality.textContent = `${aqi.value} - ${aqi.description}`;
        } else {
            this.elements.airQuality.textContent = 'N/A';
        }
    }

    // Update comfort level indicator
    updateComfortLevel(temp, humidity, windSpeed) {
        let comfort = 'comfortable';
        let description = 'Pleasant weather conditions';

        // Simple comfort calculation based on temperature and humidity
        if (temp < 10) {
            comfort = 'cold';
            description = 'Bundle up! It\'s quite cold outside';
        } else if (temp > 30) {
            comfort = 'hot';
            description = 'Stay hydrated and seek shade';
        } else if (humidity > 80) {
            comfort = 'humid';
            description = 'High humidity may feel uncomfortable';
        } else if (windSpeed > 25) {
            comfort = 'windy';
            description = 'Windy conditions - secure loose items';
        }

        // Update comfort indicator
        this.elements.comfortIndicator.className = `comfort-indicator ${comfort}`;
        this.elements.comfortDescription.textContent = description;
    }

    // Update forecast display
    updateForecastDisplay(forecastDays) {
        if (!forecastDays || forecastDays.length === 0) return;

        this.elements.forecastContainer.innerHTML = '';
        
        forecastDays.slice(0, 5).forEach((day, index) => {
            const forecastCard = document.createElement('div');
            forecastCard.className = 'forecast-card';
            
            const date = new Date(day.date);
            const dayName = index === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
            const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            const highTemp = this.state.currentUnit === 'celsius' ? day.day.maxtemp_c : day.day.maxtemp_f;
            const lowTemp = this.state.currentUnit === 'celsius' ? day.day.mintemp_c : day.day.mintemp_f;
            const unit = this.state.currentUnit === 'celsius' ? '°C' : '°F';
            
            forecastCard.innerHTML = `
                <div class="forecast-header">
                    <h4 class="forecast-day">${dayName}</h4>
                    <p class="forecast-date">${monthDay}</p>
                </div>
                <div class="forecast-icon">
                    <img src="https:${day.day.condition.icon}" alt="${day.day.condition.text}" />
                </div>
                <div class="forecast-condition">${day.day.condition.text}</div>
                <div class="forecast-temps">
                    <span class="high-temp">${Math.round(highTemp)}${unit}</span>
                    <span class="low-temp">${Math.round(lowTemp)}${unit}</span>
                </div>
                <div class="forecast-details">
                    <div class="detail-item">
                        <i class="fas fa-tint"></i>
                        <span>${day.day.avghumidity}%</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-wind"></i>
                        <span>${Math.round(day.day.maxwind_kph)} km/h</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-cloud-rain"></i>
                        <span>${day.day.daily_chance_of_rain || 0}%</span>
                    </div>
                </div>
            `;
            
            this.elements.forecastContainer.appendChild(forecastCard);
        });
        
        // Update hourly forecast for today
        if (forecastDays.length > 0 && forecastDays[0].hour) {
            this.updateHourlyDisplay(forecastDays[0].hour);
        }
    }

    // Update hourly forecast display
    updateHourlyDisplay(hourlyData) {
        if (!hourlyData || hourlyData.length === 0) return;

        this.elements.hourlyContainer.innerHTML = '';
        
        // Get current hour and show next 12 hours
        const currentHour = new Date().getHours();
        const relevantHours = hourlyData.filter((hour, index) => {
            const hourTime = new Date(hour.time).getHours();
            return hourTime >= currentHour || index < 12;
        }).slice(0, 12);
        
        relevantHours.forEach(hour => {
            const hourlyCard = document.createElement('div');
            hourlyCard.className = 'hourly-card';
            
            const time = new Date(hour.time);
            const hourString = time.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                hour12: true 
            });
            
            const temp = this.state.currentUnit === 'celsius' ? hour.temp_c : hour.temp_f;
            const unit = this.state.currentUnit === 'celsius' ? '°C' : '°F';
            
            hourlyCard.innerHTML = `
                <div class="hourly-time">${hourString}</div>
                <div class="hourly-icon">
                    <img src="https:${hour.condition.icon}" alt="${hour.condition.text}" />
                </div>
                <div class="hourly-temp">${Math.round(temp)}${unit}</div>
                <div class="hourly-details">
                    <div class="hourly-detail">
                        <i class="fas fa-tint"></i>
                        <span>${hour.humidity}%</span>
                    </div>
                    <div class="hourly-detail">
                        <i class="fas fa-wind"></i>
                        <span>${Math.round(hour.wind_kph)}</span>
                    </div>
                </div>
            `;
            
            this.elements.hourlyContainer.appendChild(hourlyCard);
        });
    }

    // Update history display
    updateHistoryDisplay(historyData) {
        if (!historyData || historyData.length === 0) {
            this.elements.historyContainer.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-calendar-times"></i>
                    <p>No historical data available</p>
                </div>
            `;
            return;
        }
        
        this.elements.historyContainer.innerHTML = '';
        
        historyData.forEach((day, index) => {
            const historyCard = document.createElement('div');
            historyCard.className = 'history-card';
            
            const date = new Date(day.date);
            const dayName = this.getHistoryDayName(index);
            
            const highTemp = this.state.currentUnit === 'celsius' ? day.day.maxtemp_c : day.day.maxtemp_f;
            const lowTemp = this.state.currentUnit === 'celsius' ? day.day.mintemp_c : day.day.mintemp_f;
            const avgTemp = this.state.currentUnit === 'celsius' ? day.day.avgtemp_c : day.day.avgtemp_f;
            const unit = this.state.currentUnit === 'celsius' ? '°C' : '°F';
            
            historyCard.innerHTML = `
                <div class="history-header">
                    <div class="history-date-info">
                        <h4 class="history-day">${dayName}</h4>
                        <p class="history-date">${date.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                        })}</p>
                    </div>
                    <div class="history-icon">
                        <img src="https:${day.day.condition.icon}" alt="${day.day.condition.text}" />
                    </div>
                </div>
                <div class="history-condition">${day.day.condition.text}</div>
                <div class="history-temps">
                    <div class="temp-range">
                        <span class="temp-high">${Math.round(highTemp)}${unit}</span>
                        <span class="temp-separator">/</span>
                        <span class="temp-low">${Math.round(lowTemp)}${unit}</span>
                    </div>
                    <div class="temp-avg">Avg: ${Math.round(avgTemp)}${unit}</div>
                </div>
                <div class="history-metrics">
                    <div class="metric-item">
                        <i class="fas fa-tint"></i>
                        <span>${day.day.avghumidity}%</span>
                        <label>Humidity</label>
                    </div>
                    <div class="metric-item">
                        <i class="fas fa-wind"></i>
                        <span>${Math.round(day.day.maxwind_kph)}</span>
                        <label>Wind km/h</label>
                    </div>
                    <div class="metric-item">
                        <i class="fas fa-cloud-rain"></i>
                        <span>${day.day.totalprecip_mm}</span>
                        <label>Rain mm</label>
                    </div>
                    <div class="metric-item">
                        <i class="fas fa-sun"></i>
                        <span>${day.day.uv}</span>
                        <label>UV Index</label>
                    </div>
                </div>
            `;
            
            this.elements.historyContainer.appendChild(historyCard);
        });
    }

    // Get history day name
    getHistoryDayName(index) {
        const days = ['Yesterday', '2 days ago', '3 days ago', '4 days ago', '5 days ago', '6 days ago', '1 week ago'];
        return days[index] || `${index + 1} days ago`;
    }

    // Calculate simple AQI from air quality data
    calculateAQI(airQuality) {
        if (!airQuality || !airQuality.co) {
            return { value: 'N/A', description: 'No data' };
        }
        
        // Simple AQI calculation based on CO levels (mg/m³)
        const co = airQuality.co;
        let aqi, description, color;
        
        if (co <= 4.4) {
            aqi = Math.round((50 / 4.4) * co);
            description = 'Good';
            color = 'green';
        } else if (co <= 9.4) {
            aqi = Math.round(50 + ((100 - 50) / (9.4 - 4.4)) * (co - 4.4));
            description = 'Moderate';
            color = 'yellow';
        } else if (co <= 12.4) {
            aqi = Math.round(100 + ((150 - 100) / (12.4 - 9.4)) * (co - 9.4));
            description = 'Unhealthy for Sensitive';
            color = 'orange';
        } else if (co <= 15.4) {
            aqi = Math.round(150 + ((200 - 150) / (15.4 - 12.4)) * (co - 12.4));
            description = 'Unhealthy';
            color = 'red';
        } else {
            aqi = Math.round(200 + Math.min(100, (co - 15.4) * 10));
            description = 'Very Unhealthy';
            color = 'purple';
        }
        
        return { value: Math.min(aqi, 300), description, color };
    }

    // Update background based on weather condition
    updateBackground(conditionCode) {
        const body = document.body;
        
        // Remove existing weather classes
        body.classList.remove('sunny', 'cloudy', 'rainy', 'snowy', 'stormy');
        
        // Weather condition codes from WeatherAPI
        if ([1000].includes(conditionCode)) {
            body.classList.add('sunny');
        } else if ([1003, 1006, 1009].includes(conditionCode)) {
            body.classList.add('cloudy');
        } else if ([1063, 1150, 1153, 1180, 1183, 1186, 1189, 1192, 1195, 1198, 1201, 1240, 1243, 1246].includes(conditionCode)) {
            body.classList.add('rainy');
        } else if ([1066, 1069, 1072, 1114, 1117, 1204, 1207, 1210, 1213, 1216, 1219, 1222, 1225, 1237, 1249, 1252, 1255, 1258, 1261, 1264].includes(conditionCode)) {
            body.classList.add('snowy');
        } else if ([1273, 1276, 1279, 1282].includes(conditionCode)) {
            body.classList.add('stormy');
        } else {
            body.classList.add('cloudy'); // Default to cloudy
        }
    }

    // Format date and time
    formatDateTime(dateTimeString) {
        try {
            const date = new Date(dateTimeString);
            return date.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } catch (error) {
            return 'Unknown';
        }
    }

    // Handle keyboard navigation
    handleKeyboardNavigation(e) {
        // ESC key to close modal
        if (e.key === 'Escape' && this.elements.locationModal.style.display === 'flex') {
            this.skipGeolocation();
        }
        
        // Tab navigation for views
        if (e.key >= '1' && e.key <= '3' && e.ctrlKey) {
            e.preventDefault();
            const views = ['current', 'forecast', 'history'];
            const viewIndex = parseInt(e.key) - 1;
            if (views[viewIndex]) {
                this.switchView(views[viewIndex]);
            }
        }
        
        // R key to refresh
        if (e.key === 'r' && e.ctrlKey) {
            e.preventDefault();
            this.refreshCurrentData();
        }
    }

    // Show toast notification
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = this.getToastIcon(type);
        toast.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add close functionality
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.removeToast(toast);
        });
        
        // Add to container
        this.elements.toastContainer.appendChild(toast);
        
        // Auto remove after duration
        setTimeout(() => {
            this.removeToast(toast);
        }, duration);
        
        // Animate in
        setTimeout(() => {
            toast.classList.add('toast-show');
        }, 10);
    }

    // Get toast icon based on type
    getToastIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    // Remove toast
    removeToast(toast) {
        if (toast && toast.parentNode) {
            toast.classList.remove('toast-show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.weatherApp = new WeatherApp();
});

// Handle visibility change to refresh data when tab becomes active
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.weatherApp) {
        const timeSinceUpdate = Date.now() - (window.weatherApp.state.lastUpdateTime || 0);
        // Refresh if data is older than 10 minutes
        if (timeSinceUpdate > 10 * 60 * 1000) {
            window.weatherApp.refreshCurrentData();
        }
    }
});

// Handle online/offline events
window.addEventListener('online', () => {
    if (window.weatherApp) {
        window.weatherApp.showToast('Connection restored', 'success');
        window.weatherApp.refreshCurrentData();
    }
});

window.addEventListener('offline', () => {
    if (window.weatherApp) {
        window.weatherApp.showToast('No internet connection', 'warning');
    }
});