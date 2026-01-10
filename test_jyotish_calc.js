
import { JyotishEngine } from './frontend/src/utils/jyotishEngine.js';

const dateStr = '2026-01-10';
const date = new Date(dateStr);
date.setHours(12, 0, 0, 0); // Noon

console.log(`Calculating for: ${date.toISOString()}`);

const ayanamsha = JyotishEngine.getAyanamsha(date);
const moonTrop = JyotishEngine.getMoonLongitude(date);
const sidereal = (moonTrop - ayanamsha + 360) % 360;
const nakshatraIndex = Math.floor(sidereal / 13.333333) + 1;
const nakshatraData = JyotishEngine.getNakshatraData(nakshatraIndex);

console.log('Ayanamsha:', ayanamsha);
console.log('Moon Tropical:', moonTrop);
console.log('Moon Sidereal:', sidereal);
console.log('Nakshatra Index:', nakshatraIndex);
console.log('Nakshatra Name:', nakshatraData.name);
