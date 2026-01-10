
// Simplified Jyotish Logic for Testing

function getAyanamsha(date) {
    const J2000 = new Date('2000-01-01T12:00:00Z');
    const days = (date - J2000) / (1000 * 60 * 60 * 24);
    const years = days / 365.25;
    return 23.85 + (years * 0.01397);
}

function getMoonLongitude(date) {
    const J2000 = new Date('2000-01-01T12:00:00Z');
    const d = (date - J2000) / (1000 * 60 * 60 * 24);

    const L = (218.316 + 13.176396 * d) % 360;
    const M = (134.963 + 13.064993 * d) % 360;
    const F = (93.272 + 13.229350 * d) % 360;

    const SunL = (280.459 + 0.98564736 * d) % 360;
    const SunM = (357.529 + 0.98560028 * d) % 360;
    const D = (297.850 + 12.190749 * d) % 360;

    let moonL = L
        + 6.289 * Math.sin(M * Math.PI / 180)
        - 1.274 * Math.sin((M - 2 * D) * Math.PI / 180)
        + 0.658 * Math.sin(2 * D * Math.PI / 180)
        - 0.185 * Math.sin(SunM * Math.PI / 180);

    return moonL < 0 ? moonL + 360 : moonL % 360;
}

const dateStr = '2026-01-10T06:00:00Z'; // UTC 6 AM
const date = new Date(dateStr);

const ayanamsha = getAyanamsha(date);
const moonTrop = getMoonLongitude(date);
const sidereal = (moonTrop - ayanamsha + 360) % 360;
const nakshatraIndex = Math.floor(sidereal / 13.333333) + 1;

console.log('Date (UTC):', date.toISOString());
console.log('Ayanamsha:', ayanamsha.toFixed(4));
console.log('Moon Tropical:', moonTrop.toFixed(4));
console.log('Moon Sidereal:', sidereal.toFixed(4));
console.log('Nakshatra Index:', nakshatraIndex);

// Nakshatra Names Mapping (Simple)
const names = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni",
    "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha",
    "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha",
    "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada",
    "Uttara Bhadrapada", "Revati"
];

console.log('Nakshatra Name:', names[nakshatraIndex - 1]);
