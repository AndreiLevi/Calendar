import { MAYAN_DATA } from './mayanData';

export class MayanEngine {

    static calculateTzolkin(dateString) {
        if (!dateString) return null;

        const targetDate = new Date(dateString);
        targetDate.setHours(12, 0, 0, 0);

        // Anchor: Jan 10, 2026 = Kin 32
        const anchorDate = new Date('2026-01-10T12:00:00');
        const anchorKin = 32;

        const oneDay = 24 * 60 * 60 * 1000;
        const rawDiffDays = Math.round((targetDate - anchorDate) / oneDay);

        const leapDays = this.countLeapDays(targetDate, anchorDate);

        const sign = Math.sign(rawDiffDays);
        const effectiveDays = rawDiffDays - (sign * leapDays);

        let kin = (anchorKin + effectiveDays) % 260;
        while (kin <= 0) kin += 260;

        const sealIndex = (kin - 1) % 20;
        const toneIndex = (kin - 1) % 13;

        const sealData = MAYAN_DATA.seals[sealIndex];
        const toneData = MAYAN_DATA.tones[toneIndex];
        const colors = ["Красный", "Белый", "Синий", "Желтый"];
        const color = colors[sealIndex % 4];

        // Day Out of Time / Leap Day Logic
        if (this.isLeapDay(targetDate)) {
            return {
                kin: "0.0",
                seal: 0,
                sealName: "Хунаб Ку",
                tone: 0,
                toneName: "День Вне Времени",
                color: "Зеленый",
                fullTitle: "День Вне Времени (Хунаб Ку)",
                fullMayanTitle: "0.0.Hunab Ku"
            };
        }

        const moonData = this.calculate13MoonDate(targetDate);
        const yearData = this.calculateYearBearer(targetDate, kin, moonData);

        return {
            kin: kin,
            seal: sealIndex + 1,
            sealName: sealData.name,
            mayanSealName: sealData.mayanName,
            tone: toneIndex + 1,
            toneName: toneData.name,
            mayanToneName: toneData.mayanName,
            color: color,
            fullTitle: `${toneData.name} ${sealData.name}`,
            fullMayanTitle: `${toneData.mayanName} ${sealData.mayanName}`,
            action: sealData.action,
            power: sealData.power,
            essence: sealData.essence,
            toneAction: toneData.action,
            tonePower: toneData.power,
            toneEssence: toneData.essence,
            toneQuestion: toneData.question,
            moon: moonData,
            year: yearData
        };
    }

    static calculate13MoonDate(date) {
        if (this.isLeapDay(date)) {
            return {
                number: 0,
                name: "Хунаб Ку",
                totem: "Нет",
                day: 0,
                fullDate: "0.0.Хунаб Ку"
            };
        }

        let year = date.getFullYear();
        const startOfMoonYear = new Date(year, 6, 26);
        startOfMoonYear.setHours(12, 0, 0, 0);

        if (date < startOfMoonYear) {
            year--;
            startOfMoonYear.setFullYear(year);
        }

        const oneDay = 24 * 60 * 60 * 1000;
        let dayDiff = Math.round((date - startOfMoonYear) / oneDay);
        const leapDays = this.countLeapDays(date, startOfMoonYear);
        dayDiff -= leapDays;

        if (dayDiff === 364) {
            return {
                number: 0,
                name: "День Вне Времени",
                totem: "Галактический",
                day: 0,
                fullDate: "День Вне Времени",
                question: "Я есмь Праздник Жизни"
            };
        }

        const moonIndex = Math.floor(dayDiff / 28);
        const dayOfMoon = (dayDiff % 28) + 1;

        return {
            number: moonIndex + 1,
            name: MAYAN_DATA.moons[moonIndex].name,
            question: MAYAN_DATA.moons[moonIndex].question,
            totem: MAYAN_DATA.totems[moonIndex],
            day: dayOfMoon,
            fullDate: `${MAYAN_DATA.moons[moonIndex].name} ${dayOfMoon}`
        };
    }

    static calculateYearBearer(date, currentKin, moonData) {
        if (moonData.number === 0) return null; // Day Out of Time or Leap Day

        const totalDays = ((moonData.number - 1) * 28) + moonData.day;
        const offset = totalDays - 1;

        let yearKin = currentKin - offset;
        while (yearKin <= 0) yearKin += 260; // handle wrap around

        // Get details for Year Kin
        const sealIndex = (yearKin - 1) % 20;
        const toneIndex = (yearKin - 1) % 13;
        const sealData = MAYAN_DATA.seals[sealIndex];
        const toneData = MAYAN_DATA.tones[toneIndex];

        // Helper specifically for "Yellow Resonant Seed" -> "Желтого Резонансного Семени"
        // This is complex grammar. 
        // We will return standard nominative "Желтое Резонансное Семя" or approximate.
        return {
            kin: yearKin,
            name: `Год ${toneData.name} ${sealData.name}`,
            seal: sealData.name,
            tone: toneData.name,
            color: ["Красного", "Белого", "Синего", "Желтого"][sealIndex % 4]
        };
    }

    static countLeapDays(d1, d2) {
        const start = new Date(Math.min(d1, d2));
        const end = new Date(Math.max(d1, d2));
        let count = 0;
        for (let year = start.getFullYear(); year <= end.getFullYear(); year++) {
            if (this.isLeapYear(year)) {
                const leapDay = new Date(year, 1, 29);
                if (leapDay > start && leapDay < end) {
                    count++;
                }
            }
        }
        return count;
    }

    static isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    }

    static isLeapDay(date) {
        return date.getMonth() === 1 && date.getDate() === 29;
    }
}
