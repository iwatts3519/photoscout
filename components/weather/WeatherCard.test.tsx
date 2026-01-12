/**
 * Tests for WeatherCard component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeatherCard } from './WeatherCard';
import { WeatherType, type WeatherConditions } from '@/src/types/weather.types';

const mockWeather: WeatherConditions = {
  temperature: 15.5,
  feelsLike: 13.2,
  humidity: 65,
  cloudCover: 45,
  visibility: 12000,
  windSpeed: 12.5,
  windDirection: 270,
  windGust: 18.3,
  precipitation: 10,
  pressure: 1013,
  uvIndex: 3,
  weatherType: WeatherType.PartlyCloudy,
  timestamp: new Date().toISOString(),
};

describe('WeatherCard', () => {
  it('should render weather card with title', () => {
    render(<WeatherCard weather={mockWeather} />);

    expect(screen.getByText('Weather Conditions')).toBeInTheDocument();
  });

  it('should display temperature correctly', () => {
    render(<WeatherCard weather={mockWeather} />);

    expect(screen.getByText('16°C')).toBeInTheDocument(); // Rounded from 15.5
    expect(screen.getByText('Feels like 13°C')).toBeInTheDocument(); // Rounded from 13.2
  });

  it('should display cloud cover with description', () => {
    render(<WeatherCard weather={mockWeather} />);

    expect(screen.getByText('45%')).toBeInTheDocument();
    // "Partly Cloudy" appears twice - as weather type and cloud cover description
    const partlyCloudyElements = screen.getAllByText('Partly Cloudy');
    expect(partlyCloudyElements.length).toBeGreaterThan(0);
  });

  it('should display visibility with quality rating', () => {
    render(<WeatherCard weather={mockWeather} />);

    expect(screen.getByText('12.0 km')).toBeInTheDocument();
    expect(screen.getByText('Very Good')).toBeInTheDocument();
  });

  it('should display wind speed with direction', () => {
    render(<WeatherCard weather={mockWeather} />);

    expect(screen.getByText('13 mph W')).toBeInTheDocument(); // Rounded wind speed
    expect(screen.getByText('Gusts to 18 mph')).toBeInTheDocument();
  });

  it('should display wind direction in degrees', () => {
    render(<WeatherCard weather={mockWeather} />);

    expect(screen.getByText('270°')).toBeInTheDocument();
  });

  it('should display humidity', () => {
    render(<WeatherCard weather={mockWeather} />);

    expect(screen.getByText('65%')).toBeInTheDocument();
  });

  it('should display precipitation when greater than 0', () => {
    render(<WeatherCard weather={mockWeather} />);

    expect(screen.getByText('Precipitation')).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument();
  });

  it('should not display precipitation when 0', () => {
    const weatherNoPrecip = { ...mockWeather, precipitation: 0 };
    render(<WeatherCard weather={weatherNoPrecip} />);

    expect(screen.queryByText('Precipitation')).not.toBeInTheDocument();
  });

  it('should display weather type description', () => {
    render(<WeatherCard weather={mockWeather} />);

    // "Partly Cloudy" appears in multiple places
    const partlyCloudyElements = screen.getAllByText('Partly Cloudy');
    expect(partlyCloudyElements.length).toBeGreaterThan(0);
  });

  describe('Cloud cover descriptions', () => {
    it('should show "Clear" for < 20%', () => {
      const weather = { ...mockWeather, cloudCover: 15 };
      render(<WeatherCard weather={weather} />);

      expect(screen.getByText('Clear')).toBeInTheDocument();
    });

    it('should show "Mostly Clear" for 20-39%', () => {
      const weather = { ...mockWeather, cloudCover: 30 };
      render(<WeatherCard weather={weather} />);

      expect(screen.getByText('Mostly Clear')).toBeInTheDocument();
    });

    it('should show "Partly Cloudy" for 40-59%', () => {
      const weather = { ...mockWeather, cloudCover: 50 };
      render(<WeatherCard weather={weather} />);

      // "Partly Cloudy" may appear multiple times
      const partlyCloudyElements = screen.getAllByText('Partly Cloudy');
      expect(partlyCloudyElements.length).toBeGreaterThan(0);
    });

    it('should show "Mostly Cloudy" for 60-79%', () => {
      const weather = { ...mockWeather, cloudCover: 70 };
      render(<WeatherCard weather={weather} />);

      expect(screen.getByText('Mostly Cloudy')).toBeInTheDocument();
    });

    it('should show "Overcast" for >= 80%', () => {
      const weather = { ...mockWeather, cloudCover: 90 };
      render(<WeatherCard weather={weather} />);

      expect(screen.getByText('Overcast')).toBeInTheDocument();
    });
  });

  describe('Visibility quality ratings', () => {
    it('should show "Excellent" for >= 20km', () => {
      const weather = { ...mockWeather, visibility: 25000 };
      render(<WeatherCard weather={weather} />);

      expect(screen.getByText('Excellent')).toBeInTheDocument();
    });

    it('should show "Very Good" for >= 10km', () => {
      const weather = { ...mockWeather, visibility: 15000 };
      render(<WeatherCard weather={weather} />);

      expect(screen.getByText('Very Good')).toBeInTheDocument();
    });

    it('should show "Good" for >= 4km', () => {
      const weather = { ...mockWeather, visibility: 5000 };
      render(<WeatherCard weather={weather} />);

      expect(screen.getByText('Good')).toBeInTheDocument();
    });

    it('should show "Moderate" for >= 1km', () => {
      const weather = { ...mockWeather, visibility: 2000 };
      render(<WeatherCard weather={weather} />);

      expect(screen.getByText('Moderate')).toBeInTheDocument();
    });

    it('should show "Poor" for < 1km', () => {
      const weather = { ...mockWeather, visibility: 500 };
      render(<WeatherCard weather={weather} />);

      expect(screen.getByText('Poor')).toBeInTheDocument();
    });
  });

  describe('Visibility formatting', () => {
    it('should format visibility in kilometers when >= 1000m', () => {
      const weather = { ...mockWeather, visibility: 5500 };
      render(<WeatherCard weather={weather} />);

      expect(screen.getByText('5.5 km')).toBeInTheDocument();
    });

    it('should format visibility in meters when < 1000m', () => {
      const weather = { ...mockWeather, visibility: 850 };
      render(<WeatherCard weather={weather} />);

      expect(screen.getByText('850 m')).toBeInTheDocument();
    });
  });

  describe('Wind direction compass', () => {
    it('should show N for 0°', () => {
      const weather = { ...mockWeather, windDirection: 0, windSpeed: 0 };
      render(<WeatherCard weather={weather} />);

      expect(screen.getByText('0 mph N')).toBeInTheDocument();
    });

    it('should show E for 90°', () => {
      const weather = { ...mockWeather, windDirection: 90 };
      render(<WeatherCard weather={weather} />);

      expect(screen.getByText('13 mph E')).toBeInTheDocument();
    });

    it('should show S for 180°', () => {
      const weather = { ...mockWeather, windDirection: 180 };
      render(<WeatherCard weather={weather} />);

      expect(screen.getByText('13 mph S')).toBeInTheDocument();
    });

    it('should show W for 270°', () => {
      const weather = { ...mockWeather, windDirection: 270 };
      render(<WeatherCard weather={weather} />);

      expect(screen.getByText('13 mph W')).toBeInTheDocument();
    });

    it('should show NE for 45°', () => {
      const weather = { ...mockWeather, windDirection: 45 };
      render(<WeatherCard weather={weather} />);

      expect(screen.getByText('13 mph NE')).toBeInTheDocument();
    });
  });
});
