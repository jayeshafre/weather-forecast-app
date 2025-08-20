// ===============================
// Weather App - script.js (Free API Edition, Default Load)
// ===============================

const API_BASE = "http://127.0.0.1:8000"; // change to your Render URL after deployment

// UI Elements
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const refreshBtn = document.getElementById("refreshBtn");

const currentTab = document.getElementById("currentTab");
const forecastTab = document.getElementById("forecastTab");
const historyTab = document.getElementById("historyTab");

const loadingContainer = document.getElementById("loadingContainer");
const errorContainer = document.getElementById("errorContainer");
const errorText = document.getElementById("errorText");
const weatherContent = document.getElementById("weatherContent");

const currentView = document.getElementById("currentView");
const forecastView = document.getElementById("forecastView");
const historyView = document.getElementById("historyView");

// Global state
let lastCity = null;

// ============ UI Helpers ============
function showLoading() {
    loadingContainer.style.display = "block";
    errorContainer.style.display = "none";
    weatherContent.style.display = "none";
}

function showError(message) {
    loadingContainer.style.display = "none";
    weatherContent.style.display = "none";
    errorContainer.style.display = "block";
    errorText.textContent = message;
}

function showWeather() {
    loadingContainer.style.display = "none";
    errorContainer.style.display = "none";
    weatherContent.style.display = "block";
}

// ============ Fetch Functions ============
async function fetchCurrent(city) {
    const res = await fetch(`${API_BASE}/weather/current?city=${encodeURIComponent(city)}`);
    if (!res.ok) throw new Error("Failed to fetch current weather");
    return res.json();
}

async function fetchForecast(city) {
    const res = await fetch(`${API_BASE}/weather/forecast?city=${encodeURIComponent(city)}&days=3`);
    if (!res.ok) throw new Error("Failed to fetch forecast");
    return res.json();
}

async function fetchHistory(city) {
    const res = await fetch(`${API_BASE}/weather/history?city=${encodeURIComponent(city)}&days=3`);
    if (!res.ok) throw new Error("Failed to fetch history");
    return res.json();
}

async function fetchLocationWeather() {
    const res = await fetch(`${API_BASE}/weather/location`);
    if (!res.ok) throw new Error("Unable to fetch location weather");
    return res.json();
}

// ============ Main Loader ============
async function loadWeather(city) {
    try {
        showLoading();
        lastCity = city;

        const [current, forecast, history] = await Promise.all([
            fetchCurrent(city),
            fetchForecast(city),
            fetchHistory(city)
        ]);

        updateCurrentUI(current);
        updateForecastUI(forecast);
        updateHistoryUI(history);

        showWeather();
    } catch (err) {
        console.error(err);
        showError(err.message);
    }
}

// ============ DOM Updaters ============
function updateCurrentUI(data) {
    document.getElementById("locationName").textContent = data.location.name;
    document.getElementById("locationDetails").textContent = `${data.location.region}, ${data.location.country}`;
    document.getElementById("localTime").querySelector("span").textContent = data.location.localtime;

    document.getElementById("currentTemp").textContent = data.current.temp_c;
    document.getElementById("feelsLike").textContent = data.current.feelslike_c;
    document.getElementById("weatherCondition").textContent = data.current.condition.text;

    document.getElementById("weatherIcon").src = data.current.condition.icon;
    document.getElementById("humidity").textContent = `${data.current.humidity}%`;
    document.getElementById("windSpeed").textContent = `${data.current.wind_kph} km/h`;
    document.getElementById("uvIndex").textContent = data.current.uv;
    document.getElementById("visibility").textContent = `${data.current.visibility_km} km`;
    document.getElementById("pressure").textContent = `${data.current.pressure_mb} mb`;
    document.getElementById("airQuality").textContent = data.air_quality ? "Available" : "N/A";
}

function updateForecastUI(data) {
    const container = document.getElementById("forecastContainer");
    container.innerHTML = "";
    data.forecast.forecastday.forEach(day => {
        const card = document.createElement("div");
        card.className = "forecast-card";
        card.innerHTML = `
            <p>${day.date}</p>
            <img src="${day.day.condition.icon}" alt="">
            <p>${day.day.avgtemp_c}°C</p>
        `;
        container.appendChild(card);
    });
}

function updateHistoryUI(data) {
    const container = document.getElementById("historyContainer");
    container.innerHTML = "";
    data.history.forEach(day => {
        const card = document.createElement("div");
        card.className = "history-card";
        card.innerHTML = `
            <p>${day.date}</p>
            <img src="${day.day.condition.icon}" alt="">
            <p>${day.day.avgtemp_c}°C</p>
        `;
        container.appendChild(card);
    });
}

// ============ Event Listeners ============
searchBtn.addEventListener("click", () => {
    const city = cityInput.value.trim();
    if (city) loadWeather(city);
});

locationBtn.addEventListener("click", async () => {
    try {
        showLoading();
        const data = await fetchLocationWeather();
        loadWeather(data.location.name);
    } catch {
        showError("Unable to fetch location");
    }
});

refreshBtn.addEventListener("click", () => {
    if (lastCity) loadWeather(lastCity);
});

// Tabs
[currentTab, forecastTab, historyTab].forEach(tab => {
    tab.addEventListener("click", () => {
        currentTab.classList.remove("active");
        forecastTab.classList.remove("active");
        historyTab.classList.remove("active");

        currentView.style.display = "none";
        forecastView.style.display = "none";
        historyView.style.display = "none";

        tab.classList.add("active");
        const view = tab.dataset.view;
        document.getElementById(view + "View").style.display = "block";
    });
});

// ============ Default Load ============
window.addEventListener("load", async () => {
    try {
        showLoading();
        const data = await fetchLocationWeather();
        await loadWeather(data.location.name);
    } catch (err) {
        console.error("Default load failed", err);
        showError("Unable to load location by default");
    }
});
