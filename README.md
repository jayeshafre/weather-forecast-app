# 🌤️ Weather Forecast Application

A modern, responsive weather forecast application built with FastAPI backend and vanilla JavaScript frontend. Features current weather, 3-day forecasts, 3-day history, and location-based weather detection.

## 🔗 Live Preview

👉 [Weather Forecast App](https://weather-forecast-chi-plum.vercel.app/)

---

## 📸 Screenshots

### Homepage
<img width="1874" height="943" alt="image" src="https://github.com/user-attachments/assets/a2286a2a-3267-43d9-91e6-8224d90e578f" />


### City Search Result
<img width="1872" height="932" alt="image" src="https://github.com/user-attachments/assets/96706e03-5237-4051-b4e5-a3c2a755c44d" />


### History View
<img width="1890" height="940" alt="image" src="https://github.com/user-attachments/assets/1fbe8204-def6-4804-8353-b3b72379d52a" />


---

## ✨ Features

### Core Features
- **Current Weather**: Temperature, feels-like, humidity, wind, UV index
- **Location Detection**: Auto-detect weather based on IP location
- **City Search**: Search weather by city name
- **3-Day Forecast**: Daily weather predictions with high/low temperatures
- **Hourly Forecast**: 8-hour detailed weather breakdown
- **Responsive Design**: Mobile-first, works on all screen sizes
- **Weather Backgrounds**: Dynamic backgrounds based on weather conditions
- **Units Toggle**: Switch between Celsius and Fahrenheit

### Additional Features
- **Air Quality Index**: Real-time air quality monitoring
- **Sun Times**: Sunrise and sunset information
- **Weather Icons**: Visual weather condition indicators
- **Error Handling**: Graceful error messages and loading states

## 🛠️ Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **WeatherAPI**: Real-time weather data provider
- **Uvicorn**: ASGI server for production
- **Requests**: HTTP library for API calls
- **Python-dotenv**: Environment variable management

### Frontend
- **Vanilla JavaScript**: No framework dependencies
- **CSS3**: Modern styling with backdrop filters and gradients
- **Font Awesome**: Icon library
- **Responsive Design**: CSS Grid and Flexbox

## 📁 Project Structure

```
WEATHER_FORECAST/
│
├── backend/                     # Backend (FastAPI)
│   ├── .env                      # Environment variables (not committed)
│   ├── .env.example              # Example env file for sharing
│   └── main.py                   # FastAPI application entry point
│
├── frontend/                     # Frontend (HTML, CSS, JS)
│   ├── .vercel                   # Vercel deployment config folder
│   ├── index.html                # Main HTML file
│   ├── script.js                 # Client-side JavaScript
│   └── style.css                 # Stylesheet
│
├── .gitignore                    # Git ignore rules
├── README.md                     # Project documentation
├── render.yaml                   # Render deployment configuration
├── requirements.txt              # Python dependencies
└── vercel.json                   # Vercel configuration file

```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js (for deployment tools)
- WeatherAPI free account

### 1. Get WeatherAPI Key
1. Visit [WeatherAPI.com](https://www.weatherapi.com/)
2. Sign up for a free account
3. Get your API key from the dashboard

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo "WEATHER_API_KEY=your_api_key_here" > .env

# Run the server
python main.py
```

The backend will be available at `http://localhost:8000`

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Update API_BASE_URL in script.js
# For local development, it's already set to localhost:8000

# Serve the frontend (using Python's built-in server)
python -m http.server 3000

# Or use any other static file server
# npx serve .
# npx live-server
```

The frontend will be available at `http://localhost:3000`

## 🌐 API Endpoints

### Backend API Documentation

Once the backend is running, visit `http://localhost:8000/docs` for interactive API documentation.

#### Available Endpoints:

- `GET /` - Health check
- `GET /weather/current?city={city}` - Current weather for a city
- `GET /weather/forecast?city={city}&days={1-10}` - Weather forecast
- `GET /weather/location` - Location-based weather (IP detection)
- `GET /health` - Service health check

#### Example Response:

```json
{
  "location": {
    "name": "London",
    "region": "City of London, Greater London",
    "country": "United Kingdom",
    "localtime": "2024-01-15 14:30"
  },
  "current": {
    "temp_c": 7.0,
    "temp_f": 44.6,
    "feelslike_c": 5.0,
    "feelslike_f": 41.0,
    "condition": {
      "text": "Partly cloudy",
      "icon": "//cdn.weatherapi.com/weather/64x64/day/116.png"
    },
    "humidity": 81,
    "wind_kph": 13.0,
    "uv": 2.0
  }
}
```

## 🚀 Deployment

### Backend Deployment (Render)

1. **Create a Render Account**: Visit [render.com](https://render.com)

2. **Create Web Service**:
   - Connect your GitHub repository
   - Choose "Web Service"
   - Set build command: `pip install -r requirements.txt`
   - Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

3. **Environment Variables**:
   - Add `WEATHER_API_KEY` in Render dashboard
   - Set `PYTHON_VERSION` to `3.11.0` (optional)

4. **Deploy**: Render will automatically deploy your backend

### Frontend Deployment (Vercel)

1. **Create Vercel Account**: Visit [vercel.com](https://vercel.com)

2. **Deploy Frontend**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Navigate to frontend directory
   cd frontend
   
   # Deploy
   vercel

   vercel --prod
   ```

3. **Update API URL**: In `script.js`, update `API_BASE_URL` with your Render backend URL

4. **Custom Domain** (Optional): Configure custom domain in Vercel dashboard

### Environment Variables

Create `.env` file in backend directory:

```env
WEATHER_API_KEY=your_weather_api_key_here
PORT=8000
```

**Important**: Never commit `.env` files to version control!

## 🔧 Configuration

### Backend Configuration
- **CORS**: Configured to allow all origins (update for production)
- **API Rate Limits**: WeatherAPI free tier allows 1M calls/month
- **Error Handling**: Comprehensive error responses

### Frontend Configuration
- **API URL**: Update `API_BASE_URL` in `script.js` for production
- **Weather Icons**: Uses WeatherAPI's CDN icons
- **Responsive Breakpoints**: 768px (tablet), 480px (mobile)

## 🎨 Customization

### Adding New Weather Conditions
Update the `updateBackground()` function in `script.js`:

```javascript
// Add new condition codes
if ([newConditionCode].includes(conditionCode)) {
    body.classList.add('new-weather-class');
}
```

### Styling Modifications
- **Colors**: Update CSS custom properties in `style.css`
- **Animations**: Add CSS transitions and transforms
- **Layout**: Modify CSS Grid and Flexbox properties

### API Extensions
Add new endpoints in `main.py`:

```python
@app.get("/weather/alerts")
async def get_weather_alerts(city: str):
    # Implement weather alerts functionality
    pass
```

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**: 
   - Ensure backend CORS is properly configured
   - Check API_BASE_URL in frontend

2. **API Key Issues**:
   - Verify WeatherAPI key is valid
   - Check .env file is properly formatted

3. **Location Detection Fails**:
   - Some browsers block location APIs
   - IP-based detection may not work locally

4. **Styling Issues**:
   - Clear browser cache
   - Check CSS file paths

### Development Tips

- **Hot Reload**: Use `uvicorn main:app --reload` for backend development
- **Debug Mode**: Enable browser developer tools
- **API Testing**: Use the FastAPI docs at `/docs`


## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- [WeatherAPI](https://www.weatherapi.com/) for weather data
- [Font Awesome](https://fontawesome.com/) for icons
- [FastAPI](https://fastapi.tiangolo.com/) for the excellent Python framework

---

## 📬 Contact

👤 **Author**: Jayesh Afre  

🔗 [![GitHub](https://img.shields.io/badge/GitHub-jayeshafre-181717?style=flat&logo=github)](https://github.com/jayeshafre)  
🔗 [![LinkedIn](https://img.shields.io/badge/LinkedIn-jayesh--afre-0A66C2?style=flat&logo=linkedin)](https://linkedin.com/in/jayesh-afre)  

**Built with ❤️ for learning and portfolio showcase**
