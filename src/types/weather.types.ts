/**
 * Weather data types for Open-Meteo API integration
 */

/**
 * Weather conditions for photography
 */
export interface WeatherConditions {
  temperature: number; // Celsius
  feelsLike: number; // Celsius
  cloudCover: number; // Percentage 0-100
  visibility: number; // Meters
  windSpeed: number; // mph
  windGust: number; // mph
  windDirection: number; // Degrees
  precipitation: number; // mm per hour
  humidity: number; // Percentage 0-100
  pressure: number; // hPa
  uvIndex: number; // 0-11+
  weatherType: WeatherType;
  timestamp: string; // ISO 8601 date string
}

/**
 * Weather types mapped from WMO codes
 * Open-Meteo uses WMO weather interpretation codes (0-99)
 */
export enum WeatherType {
  ClearNight = 0,
  Sunny = 1,
  PartlyCloudy = 2,
  PartlyCloudyNight = 3,
  Mist = 5,
  Fog = 6,
  Cloudy = 7,
  Overcast = 8,
  LightRainShower = 10,
  LightRainShowerNight = 11,
  Drizzle = 12,
  LightRain = 15,
  HeavyRain = 18,
  Sleet = 20,
  Hail = 21,
  Snow = 26,
  Thunder = 29,
  ThunderShower = 30,
}

/**
 * Human-readable weather type descriptions
 */
export const WeatherTypeDescription: Record<WeatherType, string> = {
  [WeatherType.ClearNight]: 'Clear Night',
  [WeatherType.Sunny]: 'Sunny',
  [WeatherType.PartlyCloudy]: 'Partly Cloudy',
  [WeatherType.PartlyCloudyNight]: 'Partly Cloudy (Night)',
  [WeatherType.Mist]: 'Mist',
  [WeatherType.Fog]: 'Fog',
  [WeatherType.Cloudy]: 'Cloudy',
  [WeatherType.Overcast]: 'Overcast',
  [WeatherType.LightRainShower]: 'Light Rain Shower',
  [WeatherType.LightRainShowerNight]: 'Light Rain Shower (Night)',
  [WeatherType.Drizzle]: 'Drizzle',
  [WeatherType.LightRain]: 'Light Rain',
  [WeatherType.HeavyRain]: 'Heavy Rain',
  [WeatherType.Sleet]: 'Sleet',
  [WeatherType.Hail]: 'Hail',
  [WeatherType.Snow]: 'Snow',
  [WeatherType.Thunder]: 'Thunder',
  [WeatherType.ThunderShower]: 'Thunder Shower',
};

/**
 * Weather forecast for multiple time periods
 */
export interface WeatherForecast {
  current: WeatherConditions;
  hourly: WeatherConditions[]; // Next 24 hours
  location: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  fetchedAt: string; // ISO 8601 date string
}

/**
 * Daily weather summary for multi-day forecasts
 */
export interface DailyForecast {
  date: string; // ISO 8601 date (YYYY-MM-DD)
  temperatureMin: number; // Celsius
  temperatureMax: number; // Celsius
  temperatureAvg: number; // Celsius (calculated)
  cloudCoverAvg: number; // Percentage 0-100
  precipitationProbabilityMax: number; // Percentage 0-100
  precipitationSum: number; // mm
  weatherType: WeatherType; // Dominant weather type
  windSpeedMax: number; // mph
  windGustMax: number; // mph
  sunrise: string; // ISO 8601 time string
  sunset: string; // ISO 8601 time string
  uvIndexMax: number; // 0-11+
  visibilityAvg: number; // Meters (estimated from hourly if available)
}

/**
 * Multi-day weather forecast (7 days)
 */
export interface MultiDayForecast {
  daily: DailyForecast[];
  location: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  fetchedAt: string; // ISO 8601 date string
}

/**
 * WMO Weather Code descriptions
 * Used by Open-Meteo API
 */
export const WMOWeatherCodes: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};
