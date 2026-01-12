/**
 * Tests for SunTimesCard component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SunTimesCard } from './SunTimesCard';

// London coordinates for testing
const TEST_LAT = 51.5074;
const TEST_LNG = -0.1278;

// Fixed date for consistent testing: June 21, 2024 (summer solstice)
const SUMMER_DATE = new Date('2024-06-21T12:00:00Z');

// Fixed date for winter: December 21, 2024 (winter solstice)
const WINTER_DATE = new Date('2024-12-21T12:00:00Z');

describe('SunTimesCard', () => {
  it('should render sun times card with title', () => {
    render(<SunTimesCard lat={TEST_LAT} lng={TEST_LNG} date={SUMMER_DATE} />);

    expect(screen.getByText('Sun Times')).toBeInTheDocument();
  });

  it('should display sunrise label', () => {
    render(<SunTimesCard lat={TEST_LAT} lng={TEST_LNG} date={SUMMER_DATE} />);

    expect(screen.getByText('Sunrise')).toBeInTheDocument();
  });

  it('should display sunset label', () => {
    render(<SunTimesCard lat={TEST_LAT} lng={TEST_LNG} date={SUMMER_DATE} />);

    expect(screen.getByText('Sunset')).toBeInTheDocument();
  });

  it('should display morning golden hour section', () => {
    render(<SunTimesCard lat={TEST_LAT} lng={TEST_LNG} date={SUMMER_DATE} />);

    expect(screen.getByText('Morning Golden Hour')).toBeInTheDocument();
  });

  it('should display evening golden hour section', () => {
    render(<SunTimesCard lat={TEST_LAT} lng={TEST_LNG} date={SUMMER_DATE} />);

    expect(screen.getByText('Evening Golden Hour')).toBeInTheDocument();
  });

  it('should display blue hour morning label', () => {
    render(<SunTimesCard lat={TEST_LAT} lng={TEST_LNG} date={SUMMER_DATE} />);

    expect(screen.getByText('Blue Hour (Morning)')).toBeInTheDocument();
  });

  it('should display blue hour evening label', () => {
    render(<SunTimesCard lat={TEST_LAT} lng={TEST_LNG} date={SUMMER_DATE} />);

    expect(screen.getByText('Blue Hour (Evening)')).toBeInTheDocument();
  });

  it('should show times in HH:mm format', () => {
    const { container } = render(<SunTimesCard lat={TEST_LAT} lng={TEST_LNG} date={SUMMER_DATE} />);

    // Check that we have time-like strings (HH:mm format)
    const timePattern = /\d{2}:\d{2}/;
    const allText = container.textContent || '';
    expect(timePattern.test(allText)).toBe(true);
  });

  it('should render with custom date', () => {
    const customDate = new Date('2024-03-15T12:00:00Z');
    render(<SunTimesCard lat={TEST_LAT} lng={TEST_LNG} date={customDate} />);

    // Should render without errors
    expect(screen.getByText('Sun Times')).toBeInTheDocument();
  });

  it('should handle different coordinates', () => {
    // Edinburgh coordinates
    const edinburghLat = 55.9533;
    const edinburghLng = -3.1883;

    render(<SunTimesCard lat={edinburghLat} lng={edinburghLng} date={SUMMER_DATE} />);

    // Should render without errors
    expect(screen.getByText('Sun Times')).toBeInTheDocument();
    expect(screen.getByText('Sunrise')).toBeInTheDocument();
  });

  it('should handle winter solstice dates', () => {
    render(<SunTimesCard lat={TEST_LAT} lng={TEST_LNG} date={WINTER_DATE} />);

    // Should render all sections even in winter
    expect(screen.getByText('Sun Times')).toBeInTheDocument();
    expect(screen.getByText('Morning Golden Hour')).toBeInTheDocument();
    expect(screen.getByText('Evening Golden Hour')).toBeInTheDocument();
  });

  it('should use current date when date prop is not provided', () => {
    render(<SunTimesCard lat={TEST_LAT} lng={TEST_LNG} />);

    // Should render successfully with default date
    expect(screen.getByText('Sun Times')).toBeInTheDocument();
    expect(screen.getByText('Sunrise')).toBeInTheDocument();
    expect(screen.getByText('Sunset')).toBeInTheDocument();
  });

  it('should display arrow separators for time ranges', () => {
    render(<SunTimesCard lat={TEST_LAT} lng={TEST_LNG} date={SUMMER_DATE} />);

    // Golden hour ranges use arrows
    const arrows = screen.getAllByText('→');
    expect(arrows.length).toBeGreaterThan(0);
  });
});
