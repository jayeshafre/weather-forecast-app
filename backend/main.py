from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import requests
import os
from dotenv import load_dotenv
from typing import Optional
import uvicorn
from datetime import datetime, timedelta
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Weather Forecast API", 
    version="2.0.0",
    description="Professional Weather API with forecasting and historical data",
    docs_url="/docs",
    redoc_url="/redoc"
)

origins=[
    "http://127.0.0.1:5500",
    "http://localhost:3000",
    "http://localhost:5500",
    "https://weather-forecast-app-beta-five.vercel.app",
    "https://weather-forecast-chi-plum.vercel.app",
    "https://*.vercel.app",

]

# Enhanced CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# WeatherAPI configuration
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
WEATHER_API_BASE_URL = "http://api.weatherapi.com/v1"

if not WEATHER_API_KEY:
    logger.warning("WEATHER_API_KEY not found in environment variables")

# Global error handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error occurred"}
    )

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Weather Forecast API v2.0",
        "status": "operational",
        "endpoints": [
            "/weather/current",
            "/weather/forecast", 
            "/weather/history",
            "/weather/location",
            "/weather/coordinates"
        ],
        "docs": "/docs"
    }

@app.get("/weather/current")
async def get_current_weather(city: str = Query(..., description="City name or coordinates")):
    """Get current weather for a specific city"""
    if not WEATHER_API_KEY:
        raise HTTPException(status_code=500, detail="API key not configured")
    
    try:
        url = f"{WEATHER_API_BASE_URL}/current.json"
        params = {
            "key": WEATHER_API_KEY,
            "q": city,
            "aqi": "yes"
        }
        
        logger.info(f"Fetching current weather for: {city}")
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 400:
            raise HTTPException(status_code=404, detail="City not found")
        elif response.status_code == 401:
            raise HTTPException(status_code=500, detail="API authentication failed")
        elif response.status_code == 403:
            raise HTTPException(status_code=500, detail="API quota exceeded")
        
        response.raise_for_status()
        data = response.json()
        
        # Enhanced response formatting
        formatted_data = {
            "location": {
                "name": data["location"]["name"],
                "region": data["location"]["region"],
                "country": data["location"]["country"],
                "lat": data["location"]["lat"],
                "lon": data["location"]["lon"],
                "localtime": data["location"]["localtime"],
                "tz_id": data["location"]["tz_id"]
            },
            "current": {
                "temp_c": data["current"]["temp_c"],
                "temp_f": data["current"]["temp_f"],
                "feelslike_c": data["current"]["feelslike_c"],
                "feelslike_f": data["current"]["feelslike_f"],
                "condition": {
                    "text": data["current"]["condition"]["text"],
                    "icon": data["current"]["condition"]["icon"],
                    "code": data["current"]["condition"]["code"]
                },
                "humidity": data["current"]["humidity"],
                "wind_kph": data["current"]["wind_kph"],
                "wind_mph": data["current"]["wind_mph"],
                "wind_dir": data["current"]["wind_dir"],
                "wind_degree": data["current"]["wind_degree"],
                "pressure_mb": data["current"]["pressure_mb"],
                "pressure_in": data["current"]["pressure_in"],
                "visibility_km": data["current"]["vis_km"],
                "visibility_miles": data["current"]["vis_miles"],
                "uv": data["current"]["uv"],
                "gust_kph": data["current"].get("gust_kph", 0),
                "gust_mph": data["current"].get("gust_mph", 0)
            },
            "air_quality": data.get("current", {}).get("air_quality", {})
        }
        
        return formatted_data
        
    except requests.Timeout:
        raise HTTPException(status_code=504, detail="Weather service timeout")
    except requests.RequestException as e:
        logger.error(f"Request error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch weather data")
    except KeyError as e:
        logger.error(f"Data parsing error: {str(e)}")
        raise HTTPException(status_code=500, detail="Invalid response from weather service")

@app.get("/weather/coordinates")
async def get_weather_by_coordinates(
    lat: float = Query(..., description="Latitude", ge=-90, le=90),
    lon: float = Query(..., description="Longitude", ge=-180, le=180)
):
    """Get weather by coordinates (lat, lon)"""
    if not WEATHER_API_KEY:
        raise HTTPException(status_code=500, detail="API key not configured")
    
    try:
        # Format coordinates for WeatherAPI
        location = f"{lat},{lon}"
        
        url = f"{WEATHER_API_BASE_URL}/current.json"
        params = {
            "key": WEATHER_API_KEY,
            "q": location,
            "aqi": "yes"
        }
        
        logger.info(f"Fetching weather for coordinates: {lat}, {lon}")
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 400:
            raise HTTPException(status_code=404, detail="Invalid coordinates")
        
        response.raise_for_status()
        data = response.json()
        
        # Use same formatting as current weather
        formatted_data = {
            "location": {
                "name": data["location"]["name"],
                "region": data["location"]["region"],
                "country": data["location"]["country"],
                "lat": data["location"]["lat"],
                "lon": data["location"]["lon"],
                "localtime": data["location"]["localtime"],
                "tz_id": data["location"]["tz_id"]
            },
            "current": {
                "temp_c": data["current"]["temp_c"],
                "temp_f": data["current"]["temp_f"],
                "feelslike_c": data["current"]["feelslike_c"],
                "feelslike_f": data["current"]["feelslike_f"],
                "condition": {
                    "text": data["current"]["condition"]["text"],
                    "icon": data["current"]["condition"]["icon"],
                    "code": data["current"]["condition"]["code"]
                },
                "humidity": data["current"]["humidity"],
                "wind_kph": data["current"]["wind_kph"],
                "wind_mph": data["current"]["wind_mph"],
                "wind_dir": data["current"]["wind_dir"],
                "wind_degree": data["current"]["wind_degree"],
                "pressure_mb": data["current"]["pressure_mb"],
                "pressure_in": data["current"]["pressure_in"],
                "visibility_km": data["current"]["vis_km"],
                "visibility_miles": data["current"]["vis_miles"],
                "uv": data["current"]["uv"],
                "gust_kph": data["current"].get("gust_kph", 0),
                "gust_mph": data["current"].get("gust_mph", 0)
            },
            "air_quality": data.get("current", {}).get("air_quality", {})
        }
        
        return formatted_data
        
    except requests.Timeout:
        raise HTTPException(status_code=504, detail="Weather service timeout")
    except requests.RequestException as e:
        logger.error(f"Request error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch weather data")

@app.get("/weather/forecast")
async def get_weather_forecast(
    city: Optional[str] = Query(None, description="City name"), 
    lat: Optional[float] = Query(None, description="Latitude"),
    lon: Optional[float] = Query(None, description="Longitude"),
    days: int = Query(5, ge=1, le=10)
):
    """Get weather forecast for a specific city or coordinates"""
    if not WEATHER_API_KEY:
        raise HTTPException(status_code=500, detail="API key not configured")
    
    # Determine location parameter
    if lat is not None and lon is not None:
        location = f"{lat},{lon}"
    elif city:
        location = city
    else:
        raise HTTPException(status_code=400, detail="Either city or coordinates must be provided")
    
    try:
        url = f"{WEATHER_API_BASE_URL}/forecast.json"
        params = {
            "key": WEATHER_API_KEY,
            "q": location,
            "days": days,
            "aqi": "yes",
            "alerts": "no"
        }
        
        logger.info(f"Fetching forecast for: {location}")
        response = requests.get(url, params=params, timeout=15)
        
        if response.status_code == 400:
            raise HTTPException(status_code=404, detail="Location not found")
        
        response.raise_for_status()
        data = response.json()
        
        # Enhanced forecast formatting
        formatted_data = {
            "location": {
                "name": data["location"]["name"],
                "region": data["location"]["region"],
                "country": data["location"]["country"],
                "lat": data["location"]["lat"],
                "lon": data["location"]["lon"],
                "localtime": data["location"]["localtime"]
            },
            "current": {
                "temp_c": data["current"]["temp_c"],
                "temp_f": data["current"]["temp_f"],
                "condition": {
                    "text": data["current"]["condition"]["text"],
                    "icon": data["current"]["condition"]["icon"],
                    "code": data["current"]["condition"]["code"]
                },
                "humidity": data["current"]["humidity"],
                "wind_kph": data["current"]["wind_kph"],
                "uv": data["current"]["uv"]
            },
            "forecast": {
                "forecastday": [
                    {
                        "date": day["date"],
                        "day": {
                            "maxtemp_c": day["day"]["maxtemp_c"],
                            "maxtemp_f": day["day"]["maxtemp_f"],
                            "mintemp_c": day["day"]["mintemp_c"],
                            "mintemp_f": day["day"]["mintemp_f"],
                            "avgtemp_c": day["day"]["avgtemp_c"],
                            "avgtemp_f": day["day"]["avgtemp_f"],
                            "condition": {
                                "text": day["day"]["condition"]["text"],
                                "icon": day["day"]["condition"]["icon"],
                                "code": day["day"]["condition"]["code"]
                            },
                            "maxwind_kph": day["day"]["maxwind_kph"],
                            "totalprecip_mm": day["day"]["totalprecip_mm"],
                            "avghumidity": day["day"]["avghumidity"],
                            "daily_will_it_rain": day["day"]["daily_will_it_rain"],
                            "daily_chance_of_rain": day["day"]["daily_chance_of_rain"],
                            "uv": day["day"]["uv"]
                        },
                        "astro": {
                            "sunrise": day["astro"]["sunrise"],
                            "sunset": day["astro"]["sunset"],
                            "moonrise": day["astro"]["moonrise"],
                            "moonset": day["astro"]["moonset"],
                            "moon_phase": day["astro"]["moon_phase"]
                        },
                        "hour": [
                            {
                                "time": hour["time"],
                                "temp_c": hour["temp_c"],
                                "temp_f": hour["temp_f"],
                                "condition": {
                                    "text": hour["condition"]["text"],
                                    "icon": hour["condition"]["icon"],
                                    "code": hour["condition"]["code"]
                                },
                                "wind_kph": hour["wind_kph"],
                                "humidity": hour["humidity"],
                                "feelslike_c": hour["feelslike_c"],
                                "feelslike_f": hour["feelslike_f"],
                                "will_it_rain": hour["will_it_rain"],
                                "chance_of_rain": hour["chance_of_rain"]
                            } for hour in day["hour"][::3]  # Every 3 hours
                        ]
                    } for day in data["forecast"]["forecastday"]
                ]
            }
        }
        
        return formatted_data
        
    except requests.Timeout:
        raise HTTPException(status_code=504, detail="Weather service timeout")
    except requests.RequestException as e:
        logger.error(f"Request error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch forecast data")

@app.get("/weather/history")
async def get_weather_history(
    city: str = Query(..., description="City name"), 
    days: int = Query(3, ge=1, le=7)
):
    """Get weather history for a specific city (last 1-7 days)"""
    if not WEATHER_API_KEY:
        raise HTTPException(status_code=500, detail="API key not configured")
    
    try:
        history_data = []
        
        for i in range(days):
            # Calculate date for each day in the past
            date = (datetime.now() - timedelta(days=i+1)).strftime('%Y-%m-%d')
            
            url = f"{WEATHER_API_BASE_URL}/history.json"
            params = {
                "key": WEATHER_API_KEY,
                "q": city,
                "dt": date
            }
            
            logger.info(f"Fetching history for {city} on {date}")
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 400:
                continue  # Skip this date if not available
            
            response.raise_for_status()
            data = response.json()
            
            # Format historical data
            if data.get("forecast", {}).get("forecastday"):
                day_data = data["forecast"]["forecastday"][0]
                formatted_day = {
                    "date": day_data["date"],
                    "day": {
                        "maxtemp_c": day_data["day"]["maxtemp_c"],
                        "maxtemp_f": day_data["day"]["maxtemp_f"],
                        "mintemp_c": day_data["day"]["mintemp_c"],
                        "mintemp_f": day_data["day"]["mintemp_f"],
                        "avgtemp_c": day_data["day"]["avgtemp_c"],
                        "avgtemp_f": day_data["day"]["avgtemp_f"],
                        "condition": {
                            "text": day_data["day"]["condition"]["text"],
                            "icon": day_data["day"]["condition"]["icon"],
                            "code": day_data["day"]["condition"]["code"]
                        },
                        "maxwind_kph": day_data["day"]["maxwind_kph"],
                        "totalprecip_mm": day_data["day"]["totalprecip_mm"],
                        "avghumidity": day_data["day"]["avghumidity"],
                        "uv": day_data["day"]["uv"]
                    }
                }
                history_data.append(formatted_day)
        
        if not history_data:
            raise HTTPException(status_code=404, detail="No historical data available")
        
        return {
            "location": {
                "name": data["location"]["name"],
                "region": data["location"]["region"],
                "country": data["location"]["country"]
            },
            "history": history_data
        }
        
    except requests.Timeout:
        raise HTTPException(status_code=504, detail="Weather service timeout")
    except requests.RequestException as e:
        logger.error(f"Request error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch history data")

@app.get("/weather/location")
async def get_weather_by_location(ip: Optional[str] = Query(None, description="IP address for location detection")):
    """Get weather for current location (IP-based)"""
    if not WEATHER_API_KEY:
        raise HTTPException(status_code=500, detail="API key not configured")
    
    try:
        # Use IP-based location detection
        location_query = ip if ip else "auto:ip"
        
        url = f"{WEATHER_API_BASE_URL}/current.json"
        params = {
            "key": WEATHER_API_KEY,
            "q": location_query,
            "aqi": "yes"
        }
        
        logger.info("Fetching weather by IP location")
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 400:
            raise HTTPException(status_code=404, detail="Unable to detect location")
        
        response.raise_for_status()
        data = response.json()
        
        # Use same formatting as current weather endpoint
        formatted_data = {
            "location": {
                "name": data["location"]["name"],
                "region": data["location"]["region"],
                "country": data["location"]["country"],
                "lat": data["location"]["lat"],
                "lon": data["location"]["lon"],
                "localtime": data["location"]["localtime"],
                "tz_id": data["location"]["tz_id"]
            },
            "current": {
                "temp_c": data["current"]["temp_c"],
                "temp_f": data["current"]["temp_f"],
                "feelslike_c": data["current"]["feelslike_c"],
                "feelslike_f": data["current"]["feelslike_f"],
                "condition": {
                    "text": data["current"]["condition"]["text"],
                    "icon": data["current"]["condition"]["icon"],
                    "code": data["current"]["condition"]["code"]
                },
                "humidity": data["current"]["humidity"],
                "wind_kph": data["current"]["wind_kph"],
                "wind_mph": data["current"]["wind_mph"],
                "wind_dir": data["current"]["wind_dir"],
                "wind_degree": data["current"]["wind_degree"],
                "pressure_mb": data["current"]["pressure_mb"],
                "visibility_km": data["current"]["vis_km"],
                "uv": data["current"]["uv"]
            },
            "air_quality": data.get("current", {}).get("air_quality", {})
        }
        
        return formatted_data
        
    except requests.Timeout:
        raise HTTPException(status_code=504, detail="Weather service timeout")
    except requests.RequestException as e:
        logger.error(f"Request error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch location-based weather")

@app.get("/health")
async def health_check():
    """Health check endpoint for deployment monitoring"""
    return {
        "status": "healthy", 
        "service": "Weather API v2.0",
        "timestamp": datetime.now().isoformat(),
        "api_key_configured": bool(WEATHER_API_KEY)
    }

# Additional endpoint for API status
@app.get("/status")
async def api_status():
    """Detailed API status information"""
    return {
        "api_name": "Weather Forecast API",
        "version": "2.0.0",
        "status": "operational",
        "features": [
            "Current weather by city/coordinates",
            "Weather forecasting (1-10 days)",
            "Historical weather data (1-7 days)",
            "IP-based location detection",
            "Air quality information",
            "Astronomical data (sunrise/sunset)"
        ],
        "endpoints": 7,
        "last_updated": "2025-01-20"
    }


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=port,
        log_level="info",
        access_log=True
    )