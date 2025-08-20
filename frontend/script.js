// ==================== CONFIG ====================
const API_BASE_URL = window.location.hostname === "localhost"
  ? "http://localhost:8000"
  : "https://weather-forecast-app-bib8.onrender.com"; // update with your deployed backend

let currentUnit = "celsius";
let currentCity = null;
let currentTheme = "light";
let currentView = "current";
let weatherData = {};

// ==================== DOM ELEMENTS ====================
const el = {
  cityInput: document.getElementById("cityInput"),
  searchBtn: document.getElementById("searchBtn"),
  locationBtn: document.getElementById("locationBtn"),
  celsiusBtn: document.getElementById("celsiusBtn"),
  fahrenheitBtn: document.getElementById("fahrenheitBtn"),
  themeToggle: document.getElementById("themeToggle"),

  loading: document.getElementById("loadingState"),
  error: document.getElementById("errorState"),
  errorMsg: document.getElementById("errorMessage"),
  retryBtn: document.getElementById("retryBtn"),

  container: document.getElementById("weatherContainer"),

  // Views
  tabs: {
    current: document.getElementById("currentTab"),
    forecast: document.getElementById("forecastTab"),
    history: document.getElementById("historyTab"),
  },
  views: {
    current: document.getElementById("currentView"),
    forecast: document.getElementById("forecastView"),
    history: document.getElementById("historyView"),
  },

  // Current weather
  locationName: document.getElementById("locationName"),
  locationDetails: document.getElementById("locationDetails"),
  localTime: document.getElementById("localTime"),
  weatherIcon: document.getElementById("weatherIcon"),
  weatherCondition: document.getElementById("weatherCondition"),
  currentTemp: document.getElementById("currentTemp"),
  feelsLike: document.getElementById("feelsLike"),
  humidity: document.getElementById("humidity"),
  windSpeed: document.getElementById("windSpeed"),
  uvIndex: document.getElementById("uvIndex"),
  sunrise: document.getElementById("sunrise"),
  sunset: document.getElementById("sunset"),

  // Forecast
  forecastContainer: document.getElementById("forecastContainer"),
  hourlyContainer: document.getElementById("hourlyContainer"),

  // History
  historyContainer: document.getElementById("historyContainer"),
};

// ==================== EVENT LISTENERS ====================
document.addEventListener("DOMContentLoaded", init);
el.searchBtn.addEventListener("click", handleSearch);
el.cityInput.addEventListener("keypress", e => e.key === "Enter" && handleSearch());
el.locationBtn.addEventListener("click", fetchLocationWeather);
el.celsiusBtn.addEventListener("click", () => setUnit("celsius"));
el.fahrenheitBtn.addEventListener("click", () => setUnit("fahrenheit"));
el.themeToggle.addEventListener("click", toggleTheme);
el.retryBtn.addEventListener("click", () => {
  if (currentCity) searchWeather(currentCity);
  else fetchLocationWeather();
});
Object.entries(el.tabs).forEach(([view, btn]) => btn.addEventListener("click", () => switchView(view)));

// ==================== INIT ====================
function init() {
  const savedTheme = localStorage.getItem("weatherAppTheme") || "light";
  setTheme(savedTheme);
  fetchLocationWeather();
}

// ==================== THEME ====================
function toggleTheme() {
  setTheme(currentTheme === "light" ? "dark" : "light");
}
function setTheme(theme) {
  currentTheme = theme;
  document.body.classList.remove("light-theme", "dark-theme");
  document.body.classList.add(`${theme}-theme`);
  el.themeToggle.querySelector("i").className = theme === "light" ? "fas fa-moon" : "fas fa-sun";
  localStorage.setItem("weatherAppTheme", theme);
}

// ==================== UNIT ====================
function setUnit(unit) {
  currentUnit = unit;
  el.celsiusBtn.classList.toggle("unit-btn--active", unit === "celsius");
  el.fahrenheitBtn.classList.toggle("unit-btn--active", unit === "fahrenheit");
  if (weatherData.current) updateCurrent(weatherData.current);
  if (weatherData.forecast) updateForecast(weatherData.forecast.forecast.forecastday);
  if (weatherData.history) updateHistory(weatherData.history.history);
}

// ==================== VIEWS ====================
function switchView(view) {
  currentView = view;
  Object.values(el.tabs).forEach(btn => btn.classList.remove("tab-btn--active"));
  el.tabs[view].classList.add("tab-btn--active");
  Object.values(el.views).forEach(v => v.classList.remove("view-panel--active"));
  el.views[view].classList.add("view-panel--active");

  if (currentCity) {
    if (view === "forecast" && !weatherData.forecast) fetchForecast(currentCity);
    if (view === "history" && !weatherData.history) fetchHistory(currentCity);
  }
}

// ==================== STATES ====================
function showLoading() {
  el.loading.style.display = "block";
  el.error.style.display = "none";
  el.container.style.display = "none";
}
function showError(msg) {
  el.loading.style.display = "none";
  el.error.style.display = "block";
  el.errorMsg.textContent = msg;
  el.container.style.display = "none";
}
function showContent() {
  el.loading.style.display = "none";
  el.error.style.display = "none";
  el.container.style.display = "block";
}

// ==================== API CALLS ====================
async function searchWeather(city) {
  showLoading();
  try {
    const [current, forecast] = await Promise.all([
      fetch(`${API_BASE_URL}/weather/current?city=${encodeURIComponent(city)}`).then(r => r.json()),
      fetch(`${API_BASE_URL}/weather/forecast?city=${encodeURIComponent(city)}&days=3`).then(r => r.json()),
    ]);
    currentCity = current.location.name;
    weatherData = { current, forecast };
    updateCurrent(current);
    updateForecast(forecast.forecast.forecastday);
    showContent();
  } catch {
    showError("City not found or API error.");
  }
}

async function fetchLocationWeather() {
  showLoading();
  try {
    const [current, forecast] = await Promise.all([
      fetch(`${API_BASE_URL}/weather/location`).then(r => r.json()),
      fetch(`${API_BASE_URL}/weather/forecast?city=auto:ip&days=3`).then(r => r.json()),
    ]);
    currentCity = current.location.name;
    weatherData = { current, forecast };
    updateCurrent(current);
    updateForecast(forecast.forecast.forecastday);
    showContent();
  } catch {
    showError("Unable to get your location.");
  }
}

async function fetchForecast(city) {
  try {
    const forecast = await fetch(`${API_BASE_URL}/weather/forecast?city=${encodeURIComponent(city)}&days=3`).then(r => r.json());
    weatherData.forecast = forecast;
    updateForecast(forecast.forecast.forecastday);
  } catch {}
}

async function fetchHistory(city) {
  try {
    const history = await fetch(`${API_BASE_URL}/weather/history?city=${encodeURIComponent(city)}&days=3`).then(r => r.json());
    weatherData.history = history;
    updateHistory(history.history);
  } catch {
    el.historyContainer.innerHTML = `<p class="error-text">Failed to load historical data</p>`;
  }
}

// ==================== UPDATES ====================
function updateCurrent(data) {
  el.locationName.textContent = data.location.name;
  el.locationDetails.textContent = `${data.location.region}, ${data.location.country}`;
  el.localTime.textContent = data.location.localtime;

  const temp = currentUnit === "celsius" ? data.current.temp_c : data.current.temp_f;
  const feels = currentUnit === "celsius" ? data.current.feelslike_c : data.current.feelslike_f;
  const unit = currentUnit === "celsius" ? "°C" : "°F";

  el.currentTemp.textContent = Math.round(temp);
  el.feelsLike.textContent = Math.round(feels);
  el.weatherCondition.textContent = data.current.condition.text;
  el.weatherIcon.src = `https:${data.current.condition.icon}`;
  el.weatherIcon.alt = data.current.condition.text;

  el.humidity.textContent = `${data.current.humidity}%`;
  el.windSpeed.textContent = `${currentUnit === "celsius" ? data.current.wind_kph + " km/h" : data.current.wind_mph + " mph"} ${data.current.wind_dir}`;
  el.uvIndex.textContent = data.current.uv;
}

function updateForecast(days) {
  el.forecastContainer.innerHTML = "";
  days.forEach((day, idx) => {
    const div = document.createElement("div");
    div.className = "forecast-card";
    div.innerHTML = `
      <h4>${idx === 0 ? "Today" : new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}</h4>
      <img src="https:${day.day.condition.icon}" alt="${day.day.condition.text}">
      <p>${day.day.condition.text}</p>
      <div>${Math.round(currentUnit === "celsius" ? day.day.maxtemp_c : day.day.maxtemp_f)}° / 
      ${Math.round(currentUnit === "celsius" ? day.day.mintemp_c : day.day.mintemp_f)}°</div>
    `;
    el.forecastContainer.appendChild(div);
  });

  if (days[0] && days[0].hour) updateHourly(days[0].hour);
  if (days[0] && days[0].astro) {
    el.sunrise.textContent = days[0].astro.sunrise;
    el.sunset.textContent = days[0].astro.sunset;
  }
}

function updateHourly(hours) {
  el.hourlyContainer.innerHTML = "";
  hours.slice(0, 8).forEach(h => {
    const div = document.createElement("div");
    div.className = "hourly-card";
    div.innerHTML = `
      <span>${new Date(h.time).toLocaleTimeString([], { hour: "numeric" })}</span>
      <img src="https:${h.condition.icon}" alt="${h.condition.text}">
      <span>${Math.round(currentUnit === "celsius" ? h.temp_c : h.temp_f)}°</span>
    `;
    el.hourlyContainer.appendChild(div);
  });
}

function updateHistory(days) {
  el.historyContainer.innerHTML = "";
  days.forEach(d => {
    const div = document.createElement("div");
    div.className = "history-card";
    div.innerHTML = `
      <h4>${d.date}</h4>
      <img src="https:${d.day.condition.icon}" alt="${d.day.condition.text}">
      <p>${d.day.condition.text}</p>
      <p>High: ${Math.round(currentUnit === "celsius" ? d.day.maxtemp_c : d.day.maxtemp_f)}°</p>
      <p>Low: ${Math.round(currentUnit === "celsius" ? d.day.mintemp_c : d.day.mintemp_f)}°</p>
    `;
    el.historyContainer.appendChild(div);
  });
}

// ==================== HANDLERS ====================
function handleSearch() {
  const city = el.cityInput.value.trim();
  if (city) searchWeather(city);
}
