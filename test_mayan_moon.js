
const { MayanEngine } = require('../frontend/src/utils/mayanEngine.js');

function test(dateStr, expectedMoonName, expectedDay) {
    const result = MayanEngine.calculateTzolkin(dateStr);
    const moon = result.moon;
    console.log(`Date: ${dateStr}`);
    console.log(`  Expected: ${expectedMoonName} Moon ${expectedDay}`);
    console.log(`  Actual:   ${moon.name} Moon ${moon.day} (${moon.fullDate})`);

    if (moon.name === expectedMoonName && moon.day === expectedDay) {
        console.log("  ✅ PASS");
    } else {
        if (expectedMoonName === "Day Out of Time" && moon.name === "Day Out of Time") {
            console.log("  ✅ PASS");
        } else if (expectedMoonName === "Hunab Ku" && moon.name === "Hunab Ku") {
            console.log("  ✅ PASS");
        } else {
            console.log("  ❌ FAIL");
        }
    }
    console.log('---');
}

// Test Cases
console.log("Running Mayan Engine 13 Moon Tests...\n");

// 1. New Year (July 26) - Should be Magnetic Moon 1
test('2026-07-26', 'Magnetic', 1);

// 2. Day Out of Time (July 25)
test('2026-07-25', 'Day Out of Time', 0);

// 3. Middle of year (Jan 10 2026) - Kin 32
// July 26 to Jan 10.
// Jul 26... Aug 23 (Magnetic)
// Aug 23... Sep 20 (Lunar)
// Let's rely on calculation. 
// Jan 10 is typically Resonant Moon 1. Let's check.
// July 26 -> Jan 10. 
// July: 6 days. Aug: 31. Sep: 30. Oct: 31. Nov: 30. Dec: 31. Jan: 10.
// Total: 6+31+30+31+30+31+10 = 169 days.
// 169 / 28 = 6.035. So 6 full moons passed. Currently in 7th Moon (Resonant).
// 6 * 28 = 168.
// 169 - 168 = 1. So Resonant Moon 1.
test('2026-01-10', 'Resonant', 1);

// 4. Leap Day (Feb 29 2024)
test('2024-02-29', 'Hunab Ku', 0);

// 5. Day after Leap Day (March 1 2024)
// Should continue count as if Feb 29 didn't exist.
// July 26 2023 start.
// Jul: 6. Aug: 31. Sep: 30. Oct: 31. Nov: 30. Dec: 31. Jan: 31. Feb: 28 (ignoring 29). Mar: 1.
// Total: 6+31+30+31+30+31+31+28+1 = 219.
// 219 / 28 = 7.82. 7 full moons passed. In 8th Moon (Galactic).
// 7 * 28 = 196.
// 219 - 196 = 23. Galactic Moon 23.
test('2024-03-01', 'Galactic', 23);
