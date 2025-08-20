// ===============================
// Weather App Frontend Script
// ===============================

const API_CONFIG = {
    baseUrl: "https://your-backend-url.onrender.com", // change to your Render backend URL
    timeout: 10000
};

class WeatherApp {
    constructor() {
        this.state = {
            currentWeatherData: null
        };
        this.initEventListeners();
    }

    // Utility: fetch with timeout
    async fetchWithTimeout(resource, options = {}) {
        const { timeout = API_CONFIG.timeout } = options;

        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(resource, {
                ...options,
                signal: controller.signal
            });
            return response;
        } finally {
            clearTimeout(id);
        }
    }

    // Show loading spinner
    showLoading() {
        document.getElementById("loading").style.display = "block";
        document.getElementById("weather-content").style.display = "none";
    }

    // Hide loading spinner
    showWeatherContent() {
        document.getElementById("loading").style.display = "none";
        document.getElementById("weather-content").style.display = "block";
    }

    // Search weather by city (calls backend)
    async searchWeatherByCity(city) {
        this.showLoading();
        try {
            const [currentResponse, forecastResponse] = await Promise.all([
                this.fetchWithTimeout(`${API_CONFIG.baseUrl}/weather/current?city=${encodeURIComponent(city)}`),
                this.fetchWithTimeout(`${API_CONFIG.baseUrl}/weather/forecast?city=${encodeURIComponent(city)}&days=5`)
            ]);

            if (!currentResponse.ok || !forecastResponse.ok) {
                throw new Error("City not found");
            }

            const currentData = await currentResponse.json();
            const forecastData = await forecastResponse.json();

            this.state.currentWeatherData = {
                current: currentData,
                forecast: forecastData
            };

            this.updateWeatherDisplay(this.state.currentWeatherData);
            this.showWeatherContent();
        } catch (error) {
            console.error("Error fetching weather:", error);
            alert("Failed to fetch weather data. Please try again.");
        }
    }

    // Update UI with fetched weather
    updateWeatherDisplay(data) {
        const cityEl = document.getElementById("city-name");
        const tempEl = document.getElementById("temperature");
        const conditionEl = document.getElementById("condition");
        const forecastEl = document.getElementById("forecast");

        if (!data || !data.current || !data.current.current) {
            cityEl.textContent = "N/A";
            tempEl.textContent = "--";
            conditionEl.textContent = "Data not available";
            forecastEl.innerHTML = "";
            return;
        }

        const current = data.current.current;
        const location = data.current.location;

        cityEl.textContent = `${location.name}, ${location.country}`;
        tempEl.textContent = `${current.temp_c}°C`;
        conditionEl.textContent = current.condition.text;

        // Forecast (next 5 days)
        forecastEl.innerHTML = "";
        data.forecast.forecast.forecastday.forEach(day => {
            const div = document.createElement("div");
            div.classList.add("forecast-day");
            div.innerHTML = `
                <p>${day.date}</p>
                <img src="https:${day.day.condition.icon}" alt="${day.day.condition.text}">
                <p>${day.day.avgtemp_c}°C</p>
                <p>${day.day.condition.text}</p>
            `;
            forecastEl.appendChild(div);
        });
    }

    // Setup event listeners
    initEventListeners() {
        const searchBtn = document.getElementById("search-btn");
        const searchInput = document.getElementById("city-input");

        searchBtn.addEventListener("click", () => {
            const city = searchInput.value.trim();
            if (city) {
                this.searchWeatherByCity(city);
            }
        });

        searchInput.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                const city = searchInput.value.trim();
                if (city) {
                    this.searchWeatherByCity(city);
                }
            }
        });
    }
}

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
    new WeatherApp();
});
