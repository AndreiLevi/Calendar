
import { JYOTISH_DATA } from './jyotishData';

export class JyotishEngine {

    // Approximate Lahiri Ayanamsha for 2000: ~23.85 degrees. Rate: ~50.29 arcsec/year.
    static getAyanamsha(date) {
        const J2000 = new Date('2000-01-01T12:00:00Z');
        const days = (date - J2000) / (1000 * 60 * 60 * 24);
        const years = days / 365.25;
        // 23 deg 51 min roughly in 2000. 
        // Accurate formula (Lahiri): 23.85 + (years * 0.01397)
        return 23.85 + (years * 0.01397);
    }

    // Simplified orbital elements for the Sun (Tropical)
    static getSunLongitude(date) {
        // Julian Days from J2000
        const J2000 = new Date('2000-01-01T12:00:00Z');
        const d = (date - J2000) / (1000 * 60 * 60 * 24);

        // Mean anomaly
        const M = (357.529 + 0.98560028 * d) % 360;
        // Mean longitude
        const L = (280.459 + 0.98564736 * d) % 360;

        // Equation of center
        const C = 1.915 * Math.sin(M * Math.PI / 180) + 0.020 * Math.sin(2 * M * Math.PI / 180);

        const trueLong = (L + C) % 360;
        return trueLong < 0 ? trueLong + 360 : trueLong;
    }

    // Simplified orbital elements for the Moon (Tropical)
    static getMoonLongitude(date) {
        // Julian Days
        const J2000 = new Date('2000-01-01T12:00:00Z');
        const d = (date - J2000) / (1000 * 60 * 60 * 24);

        // Orbital elements
        const L = (218.316 + 13.176396 * d) % 360; // Mean longitude
        const M = (134.963 + 13.064993 * d) % 360; // Mean anomaly
        const F = (93.272 + 13.229350 * d) % 360;  // Argument of latitude

        // Major perturbations
        const long = L
            + 6.289 * Math.sin(M * Math.PI / 180)
            - 1.274 * Math.sin((L - (280.459 + 0.98564736 * d) + 2 * (134.963 + 13.064993 * d) - M) * Math.PI / 180) // Evection - simplified term
            // ... omitting smaller terms for brevity, but needed for ~1 deg accuracy.
            // Let's use a slightly better approximation if possible or accept ~1-2 degree error.
            // Actually, for Nakshatra (13.2 deg), 1 deg error might shift it at boundaries.
            // We will use a clearer set of terms next step.
            ;

        // For the sake of this file, we'll implement a robust enough approximation 
        // using "Standish" or "Meeus" simplified.

        // Let's rely on mean longitude + equation of center + variation + evection.
        const SunL = (280.459 + 0.98564736 * d) % 360;
        const SunM = (357.529 + 0.98560028 * d) % 360;

        const D = (297.850 + 12.190749 * d) % 360; // Mean elongation

        let moonL = L
            + 6.289 * Math.sin(M * Math.PI / 180)
            - 1.274 * Math.sin((M - 2 * D) * Math.PI / 180)
            + 0.658 * Math.sin(2 * D * Math.PI / 180)
            - 0.185 * Math.sin(SunM * Math.PI / 180);

        return moonL < 0 ? moonL + 360 : moonL % 360;
    }

    static calculatePanchanga(dateString) {
        if (!dateString) return null;

        // Approximate calculation for Sunrise
        // Ideally Panchanga is calculated at Sunrise. 
        // We will use 06:00 local time as a proxy for Sunrise to capture the "day's" energy.
        const date = new Date(dateString);
        date.setHours(6, 0, 0, 0);

        const ayanamsha = this.getAyanamsha(date);
        const sunTrop = this.getSunLongitude(date);
        const moonTrop = this.getMoonLongitude(date);

        // Sidereal Positions
        let sunSid = (sunTrop - ayanamsha) % 360;
        if (sunSid < 0) sunSid += 360;
        let moonSid = (moonTrop - ayanamsha) % 360;
        if (moonSid < 0) moonSid += 360;

        // 1. Tithi
        // Angle between Moon and Sun
        let angle = moonSid - sunSid;
        if (angle < 0) angle += 360;

        const tithiIndex = Math.floor(angle / 12) + 1; // 1-30

        // 2. Nakshatra
        const nakshatraIndex = Math.floor(moonSid / 13.333333) + 1; // 1-27

        // 3. Yoga
        // Sum of longitudes
        let sumLong = (moonSid + sunSid) % 360;
        const yogaIndex = Math.floor(sumLong / 13.333333) + 1; // 1-27

        // 4. Vara (Day of Week)
        // 0=Sun, 1=Mon... in JS Date.getDay().
        const dow = date.getDay(); // 0 is Sunday

        // 5. Karana
        // Half Tithi. 
        // Tithi Index 1 (0-12 deg) has 2 Karanas.
        // 1st Karana: 0-6 deg. 2nd: 6-12 deg.
        // Total Karana Index = Math.floor(angle / 6) + 1.
        const karanaVal = Math.floor(angle / 6) + 1;
        // Logic to map to names is complex cyclic.

        return {
            tithi: this.getTithiData(tithiIndex),
            nakshatra: this.getNakshatraData(nakshatraIndex),
            yoga: this.getYogaData(yogaIndex),
            vara: this.getVaraData(dow),
            karana: this.getKaranaData(karanaVal)
        };
    }

    static getTithiData(index) {
        // Map 1-15 (Shukla) -> 1-15
        // Map 16-30 (Krishna) -> 1-15 but labeled Krishna
        const id = index > 15 ? index - 15 : index;
        const paksha = index > 15 ? "Кришна Пакша (Убывающая)" : "Шукла Пакша (Растущая)";
        const data = JYOTISH_DATA.tithis.find(t => t.id === id) || JYOTISH_DATA.tithis[0];
        // Handle Amavasya (30) / Purnima (15) specific overrides in local data usually logic based
        // In our data: 15 is Purnima, 30 is Amavasya.
        // If index is 30, use id 30.
        let correctId = id;
        if (index === 30) correctId = 30;

        const finalData = JYOTISH_DATA.tithis.find(t => t.id === correctId) || JYOTISH_DATA.tithis[0];

        return {
            ...finalData,
            paksha: paksha,
            fullTitle: `${finalData.name}, ${paksha}`
        };
    }

    // ... implementations for others
    static getNakshatraData(index) {
        return JYOTISH_DATA.nakshatras.find(n => n.id === index) || {};
    }

    static getYogaData(index) {
        return JYOTISH_DATA.yogas[index - 1]; // Array is 0-indexed
    }

    static getVaraData(index) {
        // JS: 0=Sun, 1=Mon. Jyotish: 0=Sun, 1=Mon. Matches.
        return JYOTISH_DATA.varas.find(v => v.id === index);
    }
    static getKaranaData(index) {
        // Logic for Karana cycle:
        // Karana 1: Kimstughna (1st half of Tithi 1)
        // Karana 2-57: Cycle of 7 (Bava..Vishti) * 8
        // Karana 58-60: Shakuni, Chatushpada, Naga.

        // Simplification for MVP: Just return index or fixed list mapping.
        // Let's implement full cycle.

        let name = "";
        if (index === 1) name = "Кимстугхна";
        else if (index >= 58) {
            if (index === 58) name = "Шакуни";
            if (index === 59) name = "Чатушпада";
            if (index === 60) name = "Нага";
        } else {
            const cycle = (index - 2) % 7;
            const movingKaranas = ["Бава", "Балава", "Каулава", "Тнайтила", "Гара", "Ваниджа", "Вишти (Бхадра)"];
            name = movingKaranas[cycle];
        }
        return name;
    }
}
