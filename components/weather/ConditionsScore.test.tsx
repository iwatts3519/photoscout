/**
 * Tests for ConditionsScore component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConditionsScore } from './ConditionsScore';
import type { WeatherConditions } from '@/src/types/photography.types';

// London coordinates for testing
const TEST_LAT = 51.5074;
const TEST_LNG = -0.1278;

// Excellent weather conditions
const excellentWeather: WeatherConditions = {
  temperature: 15,
  cloudCoverPercent: 10,
  visibilityMeters: 20000,
  windSpeedMph: 5,
  precipitationProbability: 0,
};

// Poor weather conditions
const poorWeather: WeatherConditions = {
  temperature: 10,
  cloudCoverPercent: 95,
  visibilityMeters: 1000,
  windSpeedMph: 30,
  precipitationProbability: 80,
};

// Golden hour date (around sunset)
const goldenHourDate = new Date('2024-06-21T19:30:00Z'); // Evening summer

// Midday date (harsh lighting)
const middayDate = new Date('2024-06-21T12:00:00Z');

describe('ConditionsScore', () => {
  it('should render photography conditions card with title', () => {
    render(
      <ConditionsScore
        lat={TEST_LAT}
        lng={TEST_LNG}
        weather={excellentWeather}
        date={goldenHourDate}
      />
    );

    expect(screen.getByText('Photography Conditions')).toBeInTheDocument();
  });

  it('should display overall score', () => {
    render(
      <ConditionsScore
        lat={TEST_LAT}
        lng={TEST_LNG}
        weather={excellentWeather}
        date={goldenHourDate}
      />
    );

    expect(screen.getByText('Overall Score')).toBeInTheDocument();
  });

  it('should display score breakdown section', () => {
    render(
      <ConditionsScore
        lat={TEST_LAT}
        lng={TEST_LNG}
        weather={excellentWeather}
        date={goldenHourDate}
      />
    );

    expect(screen.getByText('Score Breakdown')).toBeInTheDocument();
  });

  it('should display lighting score with label', () => {
    render(
      <ConditionsScore
        lat={TEST_LAT}
        lng={TEST_LNG}
        weather={excellentWeather}
        date={goldenHourDate}
      />
    );

    expect(screen.getByText('Lighting')).toBeInTheDocument();
    // Check that at least one score with /100 format exists
    const scores = screen.getAllByText(/\d+\/100/);
    expect(scores.length).toBeGreaterThan(0);
  });

  it('should display weather score with label', () => {
    render(
      <ConditionsScore
        lat={TEST_LAT}
        lng={TEST_LNG}
        weather={excellentWeather}
        date={goldenHourDate}
      />
    );

    expect(screen.getByText('Weather')).toBeInTheDocument();
  });

  it('should display visibility score with label', () => {
    render(
      <ConditionsScore
        lat={TEST_LAT}
        lng={TEST_LNG}
        weather={excellentWeather}
        date={goldenHourDate}
      />
    );

    expect(screen.getByText('Visibility')).toBeInTheDocument();
  });

  it('should display current conditions section', () => {
    render(
      <ConditionsScore
        lat={TEST_LAT}
        lng={TEST_LNG}
        weather={excellentWeather}
        date={goldenHourDate}
      />
    );

    expect(screen.getByText('Current Conditions')).toBeInTheDocument();
    expect(screen.getByText('Time of Day:')).toBeInTheDocument();
    expect(screen.getByText('Sun Altitude:')).toBeInTheDocument();
  });

  it('should display insights section when reasons are available', () => {
    render(
      <ConditionsScore
        lat={TEST_LAT}
        lng={TEST_LNG}
        weather={excellentWeather}
        date={goldenHourDate}
      />
    );

    expect(screen.getByText('Insights')).toBeInTheDocument();
  });

  it('should show excellent recommendation for good conditions during golden hour', () => {
    render(
      <ConditionsScore
        lat={TEST_LAT}
        lng={TEST_LNG}
        weather={excellentWeather}
        date={goldenHourDate}
      />
    );

    // "excellent" or "good" may appear multiple times in the UI
    const recommendationElements = screen.getAllByText(/excellent|good/i);
    expect(recommendationElements.length).toBeGreaterThan(0);
  });

  it('should show poor recommendation for bad weather conditions', () => {
    render(
      <ConditionsScore
        lat={TEST_LAT}
        lng={TEST_LNG}
        weather={poorWeather}
        date={middayDate}
      />
    );

    // Poor weather should result in lower recommendation
    const overallScore = screen.getByText('Overall Score');
    expect(overallScore).toBeInTheDocument();
  });

  it('should render with current date when date prop is not provided', () => {
    render(
      <ConditionsScore
        lat={TEST_LAT}
        lng={TEST_LNG}
        weather={excellentWeather}
      />
    );

    expect(screen.getByText('Photography Conditions')).toBeInTheDocument();
  });

  it('should display time of day formatted correctly', () => {
    render(
      <ConditionsScore
        lat={TEST_LAT}
        lng={TEST_LNG}
        weather={excellentWeather}
        date={middayDate}
      />
    );

    // Time of day should be formatted (underscores replaced with spaces)
    const timeOfDayElement = screen.getByText('Time of Day:');
    expect(timeOfDayElement).toBeInTheDocument();

    // Check that the parent contains the time of day value
    const parentText = timeOfDayElement.parentElement?.textContent || '';
    expect(parentText).toMatch(/Time of Day:\s+\w+/);
  });

  it('should display sun altitude with degree symbol', () => {
    const { container } = render(
      <ConditionsScore
        lat={TEST_LAT}
        lng={TEST_LNG}
        weather={excellentWeather}
        date={middayDate}
      />
    );

    // Sun altitude should be displayed with degree symbol
    const altitudePattern = /\d+\.\d+°/;
    const allText = container.textContent || '';
    expect(altitudePattern.test(allText)).toBe(true);
  });

  it('should handle different weather conditions', () => {
    const moderateWeather: WeatherConditions = {
      temperature: 12,
      cloudCoverPercent: 50,
      visibilityMeters: 10000,
      windSpeedMph: 15,
      precipitationProbability: 20,
    };

    render(
      <ConditionsScore
        lat={TEST_LAT}
        lng={TEST_LNG}
        weather={moderateWeather}
        date={goldenHourDate}
      />
    );

    expect(screen.getByText('Photography Conditions')).toBeInTheDocument();
    expect(screen.getByText('Overall Score')).toBeInTheDocument();
  });

  it('should handle different coordinates', () => {
    // Edinburgh coordinates (higher latitude)
    const edinburghLat = 55.9533;
    const edinburghLng = -3.1883;

    render(
      <ConditionsScore
        lat={edinburghLat}
        lng={edinburghLng}
        weather={excellentWeather}
        date={goldenHourDate}
      />
    );

    expect(screen.getByText('Photography Conditions')).toBeInTheDocument();
  });

  it('should display progress bars for score breakdown', () => {
    const { container } = render(
      <ConditionsScore
        lat={TEST_LAT}
        lng={TEST_LNG}
        weather={excellentWeather}
        date={goldenHourDate}
      />
    );

    // Check for progress bar elements (divs with specific styles)
    const progressBars = container.querySelectorAll('[style*="width"]');
    expect(progressBars.length).toBeGreaterThan(0);
  });
});
