from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import requests
import os
from dotenv import load_dotenv
from typing import Optional
import uvicorn
from datetime import datetime, timedelta

# Load environment variables
load_dotenv()

app = FastAPI(title="Weather Forecast API", version="1.0.0")

origins = [
    "http://localhost:3000",                   # for local dev
    "https://weather-forecast-app-beta-five.vercel.app" ,
    "https://weather-forecast-chi-plum.vercel.app" #  Vercel frontend
]

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://weather-forecast-app-beta-five.vercel.app","https://weather-forecast-chi-plum.vercel.app"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WeatherAPI configuration
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
WEATHER_API_BASE_URL = "http://api.weatherapi.com/v1"

if not WEATHER_API_KEY:
    raise ValueError("WEATHER_API_KEY environment variable is required")

@app.get("/")
async def root():
    return {"message": "Weather Forecast API is running"}

@app.get("/weather/current")
async def get_current_weather(city: str = Query(..., description="City name")):
    """Get current weather for a specific city"""
    try:
        url = f"{WEATHER_API_BASE_URL}/current.json"
        params = {
            "key": WEATHER_API_KEY,
            "q": city,
            "aqi": "yes"
        }
        
        response = requests.get(url, params=params)
        
        if response.status_code == 400:
            raise HTTPException(status_code=404, detail="City not found")
        
        response.raise_for_status()
        data = response.json()
        
        # Format response for frontend
        formatted_data = {
            "location": {
                "name": data["location"]["name"],
                "region": data["location"]["region"],
                "country": data["location"]["country"],
                "localtime": data["location"]["localtime"]
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
                "uv": data["current"]["uv"]
            },
            "air_quality": data.get("current", {}).get("air_quality", {})
        }
        
        return formatted_data
        
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch weather data: {str(e)}")

@app.get("/weather/forecast")
async def get_weather_forecast(city: str = Query(..., description="City name"), days: int = Query(5, ge=1, le=10)):
    """Get weather forecast for a specific city"""
    try:
        url = f"{WEATHER_API_BASE_URL}/forecast.json"
        params = {
            "key": WEATHER_API_KEY,
            "q": city,
            "days": days,
            "aqi": "yes",
            "alerts": "no"
        }
        
        response = requests.get(url, params=params)
        
        if response.status_code == 400:
            raise HTTPException(status_code=404, detail="City not found")
        
        response.raise_for_status()
        data = response.json()
        
        # Format response for frontend
        formatted_data = {
            "location": {
                "name": data["location"]["name"],
                "region": data["location"]["region"],
                "country": data["location"]["country"]
            },
            "current": {
                "temp_c": data["current"]["temp_c"],
                "temp_f": data["current"]["temp_f"],
                "condition": {
                    "text": data["current"]["condition"]["text"],
                    "icon": data["current"]["condition"]["icon"]
                }
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
                                "icon": day["day"]["condition"]["icon"]
                            },
                            "maxwind_kph": day["day"]["maxwind_kph"],
                            "totalprecip_mm": day["day"]["totalprecip_mm"],
                            "avghumidity": day["day"]["avghumidity"],
                            "uv": day["day"]["uv"]
                        },
                        "astro": {
                            "sunrise": day["astro"]["sunrise"],
                            "sunset": day["astro"]["sunset"]
                        },
                        "hour": [
                            {
                                "time": hour["time"],
                                "temp_c": hour["temp_c"],
                                "temp_f": hour["temp_f"],
                                "condition": {
                                    "text": hour["condition"]["text"],
                                    "icon": hour["condition"]["icon"]
                                },
                                "wind_kph": hour["wind_kph"],
                                "humidity": hour["humidity"],
                                "feelslike_c": hour["feelslike_c"],
                                "feelslike_f": hour["feelslike_f"]
                            } for hour in day["hour"][::3]  # Every 3 hours
                        ]
                    } for day in data["forecast"]["forecastday"]
                ]
            }
        }
        
        return formatted_data
        
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch forecast data: {str(e)}")

@app.get("/weather/history")
async def get_weather_history(city: str = Query(..., description="City name"), days: int = Query(3, ge=1, le=7)):
    """Get weather history for a specific city (last 3-7 days)"""
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
            
            response = requests.get(url, params=params)
            
            if response.status_code == 400:
                raise HTTPException(status_code=404, detail="City not found")
            
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
                            "icon": day_data["day"]["condition"]["icon"]
                        },
                        "maxwind_kph": day_data["day"]["maxwind_kph"],
                        "totalprecip_mm": day_data["day"]["totalprecip_mm"],
                        "avghumidity": day_data["day"]["avghumidity"],
                        "uv": day_data["day"]["uv"]
                    }
                }
                history_data.append(formatted_day)
        
        return {
            "location": {
                "name": data["location"]["name"],
                "region": data["location"]["region"],
                "country": data["location"]["country"]
            },
            "history": history_data
        }
        
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch history data: {str(e)}")

@app.get("/weather/location")
async def get_weather_by_location(ip: Optional[str] = Query(None, description="IP address for location detection")):
    """Get weather for current location (IP-based)"""
    try:
        # Use IP-based location detection
        location_query = ip if ip else "auto:ip"
        
        url = f"{WEATHER_API_BASE_URL}/current.json"
        params = {
            "key": WEATHER_API_KEY,
            "q": location_query,
            "aqi": "yes"
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        # Format similar to current weather endpoint
        formatted_data = {
            "location": {
                "name": data["location"]["name"],
                "region": data["location"]["region"],
                "country": data["location"]["country"],
                "localtime": data["location"]["localtime"]
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
                "uv": data["current"]["uv"]
            },
            "air_quality": data.get("current", {}).get("air_quality", {})
        }
        
        return formatted_data
        
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch location-based weather: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint for deployment monitoring"""
    return {"status": "healthy", "service": "Weather API"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)