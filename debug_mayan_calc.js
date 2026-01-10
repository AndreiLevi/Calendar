
const { MayanEngine } = require('./frontend/src/utils/mayanEngine');

// Mock MAYAN_DATA because it's imported in the engine and might not run in node without transpilation if it's ES6 export
// Actually, I can try to read the file, but it's easier to just paste the engine code into a test script or use the existing one if checks out.
// Let's assume the Engine logic I viewed earlier.

// Let's calculate manually for 2026-01-10
const target = new Date('2026-01-10T12:00:00');
const start = new Date('2025-07-26T12:00:00');
const diff = (target - start) / (1000 * 60 * 60 * 24);
console.log(`Days since July 26, 2025: ${diff}`);
const moonIndex = Math.floor(diff / 28);
const dayOfMoon = (diff % 28) + 1;
console.log(`Moon Index: ${moonIndex} (Moon ${moonIndex + 1})`);
console.log(`Day of Moon: ${dayOfMoon}`);

let weekColor = "Unknown";
if (dayOfMoon >= 1 && dayOfMoon <= 7) weekColor = "Red";
else if (dayOfMoon >= 8 && dayOfMoon <= 14) weekColor = "White";
else if (dayOfMoon >= 15 && dayOfMoon <= 21) weekColor = "Blue";
else if (dayOfMoon >= 22 && dayOfMoon <= 28) weekColor = "Yellow";

console.log(`Week Color: ${weekColor}`);
