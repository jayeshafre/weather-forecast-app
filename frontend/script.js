// Configuration
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:8000' 
    : 'https://weather-forecast-app-bib8.onrender.com'; // Replace with your Render URL

// State management
let currentUnit = 'celsius';
let currentWeatherData = null;



// DOM elements
const elements = {
    cityInput: document.getElementById('cityInput'),
    searchBtn: document.getElementById('searchBtn'),
    locationBtn: document.getElementById('locationBtn'),
    celsiusBtn: document.getElementById('celsiusBtn'),
    fahrenheitBtn: document.getElementById('fahrenheitBtn'),
    loading: document.getElementById('loading'),
    errorMessage: document.getElementById('errorMessage'),
    errorText: document.getElementById('errorText'),
    weatherContent: document.getElementById('weatherContent'),
    weatherContainer: document.getElementById('weatherContainer'),
    
    // Current weather elements
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
    
    // Forecast elements
    forecastContainer: document.getElementById('forecastContainer'),
    hourlyContainer: document.getElementById('hourlyContainer'),
    sunrise: document.getElementById('sunrise'),
    sunset: document.getElementById('sunset'),
    aqiValue: document.getElementById('aqiValue'),
    aqiDescription: document.getElementById('aqiDescription')
};

// Event listeners
document.addEventListener('DOMContentLoaded', initializeApp);
elements.searchBtn.addEventListener('click', handleSearch);
elements.cityInput.addEventListener('keypress', handleKeyPress);
elements.locationBtn.addEventListener('click', handleLocationSearch);
elements.celsiusBtn.addEventListener('click', () => setUnit('celsius'));
elements.fahrenheitBtn.addEventListener('click', () => setUnit('fahrenheit'));

// Initialize the application
function initializeApp() {
    // Try to get user's location on load
    handleLocationSearch();
}

// Handle search button click
function handleSearch() {
    const city = elements.cityInput.value.trim();
    if (city) {
        searchWeatherByCity(city);
    }
}

// Handle Enter key press in search input
function handleKeyPress(e) {
    if (e.key === 'Enter') {
        handleSearch();
    }
}

// Handle location button click
function handleLocationSearch() {
    fetchWeatherByLocation();
}

// Set temperature unit
function setUnit(unit) {
    currentUnit = unit;
    
    // Update button states
    elements.celsiusBtn.classList.toggle('active', unit === 'celsius');
    elements.fahrenheitBtn.classList.toggle('active', unit === 'fahrenheit');
    
    // Update display if we have weather data
    if (currentWeatherData) {
        updateWeatherDisplay(currentWeatherData);
    }
}

// Show loading state
function showLoading() {
    elements.loading.style.display = 'block';
    elements.errorMessage.style.display = 'none';
    elements.weatherContent.style.display = 'none';
}

// Show error message
function showError(message) {
    elements.loading.style.display = 'none';
    elements.errorMessage.style.display = 'block';
    elements.weatherContent.style.display = 'none';
    elements.errorText.textContent = message;
}

// Show weather content
function showWeatherContent() {
    elements.loading.style.display = 'none';
    elements.errorMessage.style.display = 'none';
    elements.weatherContent.style.display = 'block';
}

// API call to search weather by city
async function searchWeatherByCity(city) {
    showLoading();
    
    try {
        const [currentResponse, forecastResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/weather/current?city=${encodeURIComponent(city)}`),
            fetch(`${API_BASE_URL}/weather/forecast?city=${encodeURIComponent(city)}`)
        ]);

        if (!currentResponse.ok || !forecastResponse.ok) {
            throw new Error('City not found');
        }

        const currentData = await currentResponse.json();
        const forecastData = await forecastResponse.json();
        
        currentWeatherData = { current: currentData, forecast: forecastData };
        updateWeatherDisplay(currentWeatherData);
        showWeatherContent();
        
    } catch (error) {
        console.error('Error fetching weather:', error);
        showError(error.message === 'City not found' ? 'City not found. Please try a different location.' : 'Failed to fetch weather data. Please try again.');
    }
}

// API call to fetch weather by location
async function fetchWeatherByLocation() {
    showLoading();
    
    try {
        const [currentResponse, forecastResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/weather/location`),
            fetch(`${API_BASE_URL}/weather/forecast?city=auto:ip`)
        ]);

        if (!currentResponse.ok || !forecastResponse.ok) {
            throw new Error('Location not available');
        }

        const currentData = await currentResponse.json();
        const forecastData = await forecastResponse.json();
        
        currentWeatherData = { current: currentData, forecast: forecastData };
        updateWeatherDisplay(currentWeatherData);
        showWeatherContent();
        
    } catch (error) {
        console.error('Error fetching location weather:', error);
        showError('Unable to get your location. Please search for a city instead.');
    }
}

// Update weather display
function updateWeatherDisplay(data) {
    const { current, forecast } = data;
    
    // Update location info
    elements.locationName.textContent = current.location.name;
    elements.locationDetails.textContent = `${current.location.region}, ${current.location.country}`;
    elements.localTime.textContent = `Local time: ${formatDateTime(current.location.localtime)}`;
    
    // Update current weather
    const temp = currentUnit === 'celsius' ? current.current.temp_c : current.current.temp_f;
    const feelsLike = currentUnit === 'celsius' ? current.current.feelslike_c : current.current.feelslike_f;
    const unit = currentUnit === 'celsius' ? '°C' : '°F';
    
    elements.currentTemp.textContent = Math.round(temp);
    elements.feelsLike.textContent = Math.round(feelsLike);
    elements.weatherCondition.textContent = current.current.condition.text;
    elements.weatherIcon.src = `https:${current.current.condition.icon}`;
    elements.weatherIcon.alt = current.current.condition.text;
    
    // Update unit displays
    document.querySelectorAll('.unit').forEach(el => el.textContent = unit);
    
    // Update weather details
    elements.humidity.textContent = `${current.current.humidity}%`;
    
    const windSpeed = currentUnit === 'celsius' ? current.current.wind_kph : current.current.wind_mph;
    const windUnit = currentUnit === 'celsius' ? 'km/h' : 'mph';
    elements.windSpeed.textContent = `${windSpeed} ${windUnit} ${current.current.wind_dir}`;
    
    elements.uvIndex.textContent = current.current.uv;
    
    // Update air quality
    if (current.air_quality && current.air_quality.co) {
        const aqi = calculateAQI(current.air_quality);
        elements.aqiValue.textContent = aqi.value;
        elements.aqiDescription.textContent = aqi.description;
    } else {
        elements.aqiValue.textContent = 'N/A';
        elements.aqiDescription.textContent = 'Data not available';
    }
    
    // Update forecast
    updateForecastDisplay(forecast.forecast.forecastday);
    
    // Update sun times (from first forecast day)
    if (forecast.forecast.forecastday.length > 0) {
        const astro = forecast.forecast.forecastday[0].astro;
        elements.sunrise.textContent = astro.sunrise;
        elements.sunset.textContent = astro.sunset;
    }
    
    // Update background based on weather condition
    updateBackground(current.current.condition.code);
}

// Update forecast display
function updateForecastDisplay(forecastDays) {
    elements.forecastContainer.innerHTML = '';
    
    forecastDays.forEach((day, index) => {
        const forecastElement = document.createElement('div');
        forecastElement.className = 'forecast-day';
        
        const date = new Date(day.date);
        const dayName = index === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
        
        const highTemp = currentUnit === 'celsius' ? day.day.maxtemp_c : day.day.maxtemp_f;
        const lowTemp = currentUnit === 'celsius' ? day.day.mintemp_c : day.day.mintemp_f;
        const unit = currentUnit === 'celsius' ? '°C' : '°F';
        
        forecastElement.innerHTML = `
            <h4>${dayName}</h4>
            <img src="https:${day.day.condition.icon}" alt="${day.day.condition.text}">
            <div class="condition">${day.day.condition.text}</div>
            <div class="temps">
                <span class="high">${Math.round(highTemp)}${unit}</span>
                <span class="low">${Math.round(lowTemp)}${unit}</span>
            </div>
        `;
        
        elements.forecastContainer.appendChild(forecastElement);
    });
    
    // Update hourly forecast for today
    if (forecastDays.length > 0) {
        updateHourlyDisplay(forecastDays[0].hour);
    }
}

// Update hourly forecast display
function updateHourlyDisplay(hourlyData) {
    elements.hourlyContainer.innerHTML = '';
    
    // Show next 8 hours
    hourlyData.slice(0, 8).forEach(hour => {
        const hourlyElement = document.createElement('div');
        hourlyElement.className = 'hourly-item';
        
        const time = new Date(hour.time);
        const hourString = time.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            hour12: true 
        });
        
        const temp = currentUnit === 'celsius' ? hour.temp_c : hour.temp_f;
        const unit = currentUnit === 'celsius' ? '°C' : '°F';
        
        hourlyElement.innerHTML = `
            <h4>${hourString}</h4>
            <img src="https:${hour.condition.icon}" alt="${hour.condition.text}">
            <div class="temp">${Math.round(temp)}${unit}</div>
            <div class="humidity">${hour.humidity}%</div>
        `;
        
        elements.hourlyContainer.appendChild(hourlyElement);
    });
}

// Calculate simple AQI from air quality data
function calculateAQI(airQuality) {
    if (!airQuality || !airQuality.co) {
        return { value: 'N/A', description: 'No data' };
    }
    
    // Simple AQI calculation based on CO levels
    const co = airQuality.co;
    let aqi, description;
    
    if (co <= 4.4) {
        aqi = Math.round((50 / 4.4) * co);
        description = 'Good';
    } else if (co <= 9.4) {
        aqi = Math.round(50 + ((100 - 50) / (9.4 - 4.4)) * (co - 4.4));
        description = 'Moderate';
    } else if (co <= 12.4) {
        aqi = Math.round(100 + ((150 - 100) / (12.4 - 9.4)) * (co - 9.4));
        description = 'Unhealthy for Sensitive Groups';
    } else if (co <= 15.4) {
        aqi = Math.round(150 + ((200 - 150) / (15.4 - 12.4)) * (co - 12.4));
        description = 'Unhealthy';
    } else {
        aqi = 200;
        description = 'Very Unhealthy';
    }
    
    return { value: aqi, description };
}

// Update background based on weather condition
function updateBackground(conditionCode) {
    const body = document.body;
    
    // Remove existing weather classes
    body.classList.remove('sunny', 'cloudy', 'rainy', 'snowy');
    
    // Weather condition codes from WeatherAPI
    if ([1000].includes(conditionCode)) {
        body.classList.add('sunny');
    } else if ([1003, 1006, 1009].includes(conditionCode)) {
        body.classList.add('cloudy');
    } else if ([1063, 1150, 1153, 1180, 1183, 1186, 1189, 1192, 1195, 1198, 1201, 1240, 1243, 1246, 1273, 1276, 1279, 1282].includes(conditionCode)) {
        body.classList.add('rainy');
    } else if ([1066, 1069, 1072, 1114, 1117, 1204, 1207, 1210, 1213, 1216, 1219, 1222, 1225, 1237, 1249, 1252, 1255, 1258, 1261, 1264].includes(conditionCode)) {
        body.classList.add('snowy');
    } else {
        body.classList.add('cloudy'); // Default to cloudy
    }
}

// Format date and time
function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

// Service worker registration for PWA (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}