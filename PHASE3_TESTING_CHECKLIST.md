# Phase 3 Testing Checklist

## Automated Tests ✅

All automated tests passing:
- ✅ 33 tests passing (3 test files)
- ✅ TypeScript compilation successful
- ✅ ESLint no warnings
- ✅ Dev server running at http://localhost:3000

## Manual Testing Checklist

### Desktop Testing

#### Initial Map Load
- [ ] Map renders with OpenStreetMap tiles visible
- [ ] Map centered on UK (approximately Scotland/England border)
- [ ] Sidebar visible on left side (384px width)
- [ ] Sidebar shows "Select a location on the map" message
- [ ] Map controls visible in top-right corner
- [ ] No console errors in browser

#### Location Selection
- [ ] Click anywhere on map
- [ ] Blue marker appears at clicked location
- [ ] Map smoothly flies to selected location with zoom
- [ ] Sidebar updates with latitude/longitude values
- [ ] Blue radius circle appears around marker
- [ ] Radius slider becomes active in sidebar

#### Marker Dragging
- [ ] Marker can be dragged to new position
- [ ] Coordinates update in sidebar during drag
- [ ] Radius circle follows marker position
- [ ] No visual glitches during drag

#### Radius Adjustment
- [ ] Radius slider can be moved (500m to 10km)
- [ ] Radius value displays correctly (e.g., "1.5 km")
- [ ] Radius circle updates smoothly
- [ ] Circle size matches slider value visually

#### Map Controls
- [ ] Zoom in button increases zoom
- [ ] Zoom out button decreases zoom
- [ ] Controls are responsive and smooth
- [ ] Map doesn't jump or glitch during zoom

#### Geolocation (requires HTTPS or localhost)
- [ ] Click "Locate me" button
- [ ] Browser asks for location permission (first time)
- [ ] If granted: marker appears at user location
- [ ] If denied: no crash (check console for error log)
- [ ] Button shows loading state (pulse animation)

### Mobile Testing

#### Layout Responsiveness
- [ ] Open dev tools, switch to mobile view (< 1024px width)
- [ ] Sidebar hidden by default
- [ ] Menu button (hamburger) visible in top-left
- [ ] Map fills entire viewport
- [ ] Controls positioned clearly (top-right)

#### Mobile Sidebar
- [ ] Click menu button
- [ ] Sheet slides in from left
- [ ] Sidebar content displays correctly
- [ ] Can close sheet by clicking outside or X button
- [ ] Re-opening sheet preserves state

#### Touch Interactions
- [ ] Tap map to select location
- [ ] Marker appears correctly
- [ ] Can drag marker with touch
- [ ] Pinch to zoom works
- [ ] Pan with finger drag works
- [ ] Radius slider works with touch

#### Mobile Geolocation
- [ ] "Locate me" button works on mobile
- [ ] Geolocation more accurate on mobile devices
- [ ] Loading state visible

### Edge Cases

#### No Location Selected
- [ ] Open app, don't click map
- [ ] Sidebar shows empty state message
- [ ] Radius slider disabled (grayed out)
- [ ] No radius circle visible
- [ ] Controls still work (zoom, locate)

#### Extreme Zoom Levels
- [ ] Zoom out to minimum (4)
- [ ] Map doesn't break
- [ ] Radius circle still visible (if location selected)
- [ ] Zoom in to maximum (18)
- [ ] Tiles load correctly
- [ ] Marker still visible

#### Rapid Interactions
- [ ] Click multiple locations quickly
- [ ] No visual lag or errors
- [ ] Marker updates smoothly
- [ ] Store state updates correctly

#### Browser Window Resize
- [ ] Resize browser from desktop to mobile width
- [ ] Layout adjusts correctly
- [ ] Map doesn't distort
- [ ] Switch back to desktop width
- [ ] Sidebar reappears
- [ ] Map state preserved

### Browser Compatibility

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)

### Performance

- [ ] Map loads in < 2 seconds
- [ ] No janky animations
- [ ] Radius circle updates smoothly
- [ ] No memory leaks (check DevTools)

### Console Checks

- [ ] No errors in browser console
- [ ] No warnings about deprecated APIs
- [ ] No memory leak warnings
- [ ] MapLibre attribution visible

## Known Issues / Expected Behavior

1. **Location Name Input** - Disabled with message "Saving locations will be available in a future update"
   - This is expected behavior for Phase 3

2. **Geolocation Errors** - Logged to console, not shown in UI
   - TODO: Add toast notifications in future phase

3. **No Photo Markers** - Map only shows selected location marker
   - Photo discovery comes in later phases

4. **No Sun Overlay** - No sun direction indicator yet
   - Phase 4 will add sun calculations

5. **No Weather Data** - No weather display yet
   - Phase 5 will add weather integration

## Screenshots to Capture

1. Desktop view with location selected
2. Desktop view with radius circle visible
3. Mobile view with menu button
4. Mobile view with sidebar sheet open
5. Console showing no errors

## Acceptance Criteria

Phase 3 is complete when:
- ✅ All automated tests pass
- ✅ All "Core Features" manual tests pass
- ✅ Desktop and mobile layouts work correctly
- ✅ No console errors
- ✅ Dev server runs without issues

---

**Tested By:** _________
**Date:** _________
**Browser:** _________
**Result:** PASS / FAIL
