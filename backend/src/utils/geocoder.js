const axios = require('axios');

// In-memory cache to prevent redundant API calls
const geocodeCache = new Map();

// Known Indian pincode prefixes and defaults
const PINCODE_MAP = {
  // New Delhi / NCR
  '110001': { lat: 28.6333, lng: 77.2167, name: 'Connaught Place, New Delhi' },
  '110020': { lat: 28.5355, lng: 77.2612, name: 'Okhla, New Delhi' },
  '110092': { lat: 28.6280, lng: 77.3000, name: 'Laxmi Nagar, Delhi' },
  // Mumbai
  '400001': { lat: 18.9322, lng: 72.8347, name: 'Fort, Mumbai' },
  '400050': { lat: 19.0596, lng: 72.8295, name: 'Bandra, Mumbai' },
  '400076': { lat: 19.1245, lng: 72.9099, name: 'Powai, Mumbai' },
  // Bengaluru
  '560001': { lat: 12.9716, lng: 77.5946, name: 'MG Road, Bengaluru' },
  '560034': { lat: 12.9279, lng: 77.6271, name: 'Koramangala, Bengaluru' },
  '560066': { lat: 12.9698, lng: 77.7500, name: 'Whitefield, Bengaluru' },
  '560100': { lat: 12.8452, lng: 77.6602, name: 'Electronic City, Bengaluru' },
  // Hyderabad
  '500001': { lat: 17.3850, lng: 78.4867, name: 'Abids, Hyderabad' },
  '500081': { lat: 17.4483, lng: 78.3915, name: 'HITEC City, Hyderabad' },
  // Chennai
  '600001': { lat: 13.0827, lng: 80.2707, name: 'George Town, Chennai' },
  '600036': { lat: 12.9915, lng: 80.2337, name: 'IIT Madras, Chennai' },
  // Kolkata
  '700001': { lat: 22.5726, lng: 88.3639, name: 'BBD Bagh, Kolkata' },
  '700091': { lat: 22.5800, lng: 88.4300, name: 'Salt Lake, Kolkata' },
  // Pune
  '411001': { lat: 18.5204, lng: 73.8567, name: 'Pune Station, Pune' },
  '411057': { lat: 18.5913, lng: 73.7389, name: 'Hinjawadi, Pune' },
  // US defaults (San Francisco / New York)
  '94102': { lat: 37.7813, lng: -122.4167, name: 'Downtown San Francisco' },
  '94103': { lat: 37.7726, lng: -122.4099, name: 'SoMa, San Francisco' },
  '94104': { lat: 37.7915, lng: -122.4018, name: 'Financial District, SF' },
  '94105': { lat: 37.7890, lng: -122.3950, name: 'Rincon Hill, SF' },
  '10001': { lat: 40.7484, lng: -73.9967, name: 'New York, NY' }
};

async function geocodePincode(pincode) {
  if (!pincode) return null;
  const cleanPin = String(pincode).trim();

  // 1. Check local cache
  if (geocodeCache.has(cleanPin)) {
    return geocodeCache.get(cleanPin);
  }

  // 2. Check predefined fast table
  if (PINCODE_MAP[cleanPin]) {
    const result = PINCODE_MAP[cleanPin];
    geocodeCache.set(cleanPin, result);
    return result;
  }

  // 3. Query Zippopotam API for India (6-digit format)
  if (/^[1-9][0-9]{5}$/.test(cleanPin)) {
    try {
      const res = await axios.get(`https://api.zippopotam.us/in/${cleanPin}`, { timeout: 3000 });
      if (res.data && res.data.places && res.data.places[0]) {
        const place = res.data.places[0];
        const result = {
          lat: parseFloat(place.latitude),
          lng: parseFloat(place.longitude),
          name: `${place['place name']}, ${place.state}`
        };
        geocodeCache.set(cleanPin, result);
        return result;
      }
    } catch (e) {
      // fallback to next geocoder
    }
  }

  // 4. Query Zippopotam API for US (5-digit format)
  if (/^[0-9]{5}$/.test(cleanPin)) {
    try {
      const res = await axios.get(`https://api.zippopotam.us/us/${cleanPin}`, { timeout: 3000 });
      if (res.data && res.data.places && res.data.places[0]) {
        const place = res.data.places[0];
        const result = {
          lat: parseFloat(place.latitude),
          lng: parseFloat(place.longitude),
          name: `${place['place name']}, ${place['state abbreviation']}`
        };
        geocodeCache.set(cleanPin, result);
        return result;
      }
    } catch (e) {
      // fallback
    }
  }

  // 5. Query OpenStreetMap Nominatim
  try {
    const res = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: { postalcode: cleanPin, format: 'json', limit: 1 },
      headers: { 'User-Agent': 'LastMileDeliveryTracker/1.0' },
      timeout: 3500
    });
    if (res.data && res.data[0]) {
      const item = res.data[0];
      const result = {
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        name: item.display_name
      };
      geocodeCache.set(cleanPin, result);
      return result;
    }
  } catch (e) {
    // fallback
  }

  return null;
}

module.exports = {
  geocodePincode,
  PINCODE_MAP
};
