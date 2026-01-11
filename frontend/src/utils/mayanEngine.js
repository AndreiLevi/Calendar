import { MAYAN_DATA } from './mayanData';

export class MayanEngine {

    static calculateTzolkin(dateString, language = 'ru') {
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

        // Colors are simple enough to map inline or move to data, but for now:
        const colors = {
            ru: ["Красный", "Белый", "Синий", "Желтый"],
            en: ["Red", "White", "Blue", "Yellow"],
            he: ["אדום", "לבן", "כחול", "צהוב"]
        };
        const color = colors[language][sealIndex % 4];

        // Day Out of Time / Leap Day Logic
        if (this.isLeapDay(targetDate)) {
            const hunabKu = {
                ru: "Хунаб Ку", en: "Hunab Ku", he: "הונאב קו"
            };
            const dayOutOfTime = {
                ru: "День Вне Времени", en: "Day Out of Time", he: "יום מחוץ לזמן"
            };
            const green = {
                ru: "Зеленый", en: "Green", he: "ירוק"
            };

            return {
                kin: "0.0",
                seal: 0,
                sealName: hunabKu[language],
                tone: 0,
                toneName: dayOutOfTime[language],
                color: green[language],
                fullTitle: `${dayOutOfTime[language]} (${hunabKu[language]})`,
                fullMayanTitle: "0.0.Hunab Ku"
            };
        }

        const moonData = this.calculate13MoonDate(targetDate, language);
        const yearData = this.calculateYearBearer(targetDate, kin, moonData, language);

        const sealName = sealData.name[language] || sealData.name['ru'];
        const toneName = toneData.name[language] || toneData.name['ru'];

        return {
            kin: kin,
            seal: sealIndex + 1,
            sealName: sealName,
            mayanSealName: sealData.mayanName,
            tone: toneIndex + 1,
            toneName: toneName,
            mayanToneName: toneData.mayanName,
            color: color,
            fullTitle: `${toneName} ${sealName}`,
            fullMayanTitle: `${toneData.mayanName} ${sealData.mayanName}`,
            action: sealData.action[language],
            power: sealData.power[language],
            essence: sealData.essence[language],
            toneAction: toneData.action[language],
            tonePower: toneData.power[language],
            toneEssence: toneData.essence[language],
            toneQuestion: toneData.question[language],
            moon: moonData,
            year: yearData
        };
    }

    static calculate13MoonDate(date, language = 'ru') {
        const hunabKu = { ru: "Хунаб Ку", en: "Hunab Ku", he: "הונאב קו" };
        const dayOutOfTime = { ru: "День Вне Времени", en: "Day Out of Time", he: "יום מחוץ לזמן" };
        const galactic = { ru: "Галактический", en: "Galactic", he: "גלקטי" };
        const questionDOT = { ru: "Я есмь Праздник Жизни", en: "I am the Festival of Life", he: "אני חג החיים" };
        const none = { ru: "Нет", en: "None", he: "אין" };

        if (this.isLeapDay(date)) {
            return {
                number: 0,
                name: hunabKu[language],
                totem: none[language],
                day: 0,
                fullDate: `0.0.${hunabKu[language]}`
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
                name: dayOutOfTime[language],
                totem: galactic[language],
                day: 0,
                fullDate: dayOutOfTime[language],
                question: questionDOT[language]
            };
        }

        const moonIndex = Math.floor(dayDiff / 28);
        const dayOfMoon = (dayDiff % 28) + 1;

        // Safety check for array bounds
        if (moonIndex < 0 || moonIndex >= MAYAN_DATA.moons.length) {
            return {
                number: 0,
                name: "?",
                totem: "?",
                day: dayOfMoon,
                fullDate: `? ${dayOfMoon}`
            };
        }

        const moonObj = MAYAN_DATA.moons[moonIndex];
        const totem = MAYAN_DATA.totems[language][moonIndex];

        return {
            number: moonIndex + 1,
            name: moonObj.name[language],
            question: moonObj.question[language],
            totem: totem,
            day: dayOfMoon,
            fullDate: `${moonObj.name[language]} ${dayOfMoon}`
        };
    }

    static calculateYearBearer(date, currentKin, moonData, language = 'ru') {
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

        const wordYear = { ru: "Год", en: "Year", he: "שנה" };
        const toneName = toneData.name[language];
        const sealName = sealData.name[language];

        const colorName = ["Красный", "Белый", "Синий", "Желтый"][sealIndex % 4];
        // We can just reuse colors logic or keep simple. 
        // Returning Russian adjective forms was ambitious. Standard is safer.
        const colors = {
            ru: ["Красный", "Белый", "Синий", "Желтый"],
            en: ["Red", "White", "Blue", "Yellow"],
            he: ["אדום", "לבן", "כחול", "צהוב"]
        };

        return {
            kin: yearKin,
            name: `${wordYear[language]} ${toneName} ${sealName}`,
            seal: sealName,
            tone: toneName,
            color: colors[language][sealIndex % 4]
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

