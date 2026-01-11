
import { NumerologyEngine } from './numerologyEngine';
import { MayanEngine } from './mayanEngine';
import { JyotishEngine } from './jyotishEngine';

export class ForecastingEngine {

    static CRITICAL_TITHIS = [4, 9, 14, 30]; // Rikta (Empty) & Amavasya

    // Malefic Yogas by Name (Localized)
    static MALEFIC_YOGAS = {
        ru: ["Вишкумбха", "Атиганда", "Шула", "Ганда", "Вьягхата", "Ваджра", "Вьятипата", "Паригха", "Вайдхрити"],
        en: ["Vishkumbha", "Atiganda", "Shula", "Ganda", "Vyaghata", "Vajra", "Vyatipata", "Parigha", "Vaidhriti"],
        he: ["וישקומבה", "אטיגנדה", "שולה", "גנדה", "ויאגהטה", "ווג'רה", "ויאטיפטה", "פריגה", "ויידהריטי"]
    };

    static TRANSLATIONS = {
        meanings: {
            1: { ru: "День начинаний, лидерства и независимости. Сейте семена.", en: "Day of beginnings, leadership and independence. Plant seeds.", he: "יום של התחלות, מנהיגות ועצמאות. תזרעו זרעים." },
            2: { ru: "День сотрудничества, дипломатии и терпения. Слушайте других.", en: "Day of cooperation, diplomacy and patience. Listen to others.", he: "יום של שיתוף פעולה, דיפלומטיה וסבלנות. הקשיבו לאחרים." },
            3: { ru: "День самовыражения, общения и творчества. Будьте заметны.", en: "Day of self-expression, communication and creativity. Be visible.", he: "יום של ביטוי עצמי, תקשורת ויצירתיות. היו בולטים." },
            4: { ru: "День труда, организации и наведения порядка. Стройте фундамент.", en: "Day of work, organization and order. Build a foundation.", he: "יום של עבודה, ארגון וסדר. בנו יסודות." },
            5: { ru: "День перемен, свободы и приключений. Будьте гибки.", en: "Day of change, freedom and adventure. Be flexible.", he: "יום של שינוי, חופש והרפתקאות. היו גמישים." },
            6: { ru: "День ответственности, заботы и семьи. Гармонизируйте пространство.", en: "Day of responsibility, care and family. Harmonize your space.", he: "יום של אחריות, דאגה ומשפחה. הרמוניה במרחב." },
            7: { ru: "День анализа, размышлений и уединения. Ищите истину.", en: "Day of analysis, reflection and solitude. Seek the truth.", he: "יום של ניתוח, הרהור והתבודדות. חפשו את האמת." },
            8: { ru: "День силы, финансов и достижений. Управляйте ресурсами.", en: "Day of power, finance and achievement. Manage resources.", he: "יום של כוח, כספים והישגים. נהלו משאבים." },
            9: { ru: "День завершения, очищения и благотворительности. Отпустите старое.", en: "Day of completion, cleansing and charity. Let go of the old.", he: "יום של סיום, טיהור וצדקה. שחררו את הישן." }
        },
        notes: {
            tithiCritical: { ru: "⚠️ Титхи {name}: Энергия пустых рук или завершения.", en: "⚠️ Tithi {name}: Energy of empty hands or completion.", he: "⚠️ טיטהי {name}: אנרגיה של ידיים ריקות או סיום." },
            yogaMalefic: { ru: "🌪️ Йога {name}: Возможны препятствия.", en: "🌪️ Yoga {name}: Obstacles possible.", he: "🌪️ יוגה {name}: ייתכנו מכשולים." },
            mayan13: { ru: "🏁 Майя Тон 13: Космическое завершение и полёт.", en: "🏁 Mayan Tone 13: Cosmic completion and flight.", he: "🏁 טון מאיה 13: סיום קוסמי ותעופה." },
            mayan1: { ru: "🌱 Майя Тон 1: Магнитная цель, начало нового.", en: "🌱 Mayan Tone 1: Magnetic purpose, new beginning.", he: "🌱 טון מאיה 1: מטרה מגנטית, התחלה חדשה." },
            masterNum: { ru: "⚡ Нумерология {number}: Мастер-число призывает к великому.", en: "⚡ Numerology {number}: Master number calls for greatness.", he: "⚡ נומרולוגיה {number}: מספר מאסטר קורא לגדולה." },
            cleanse9: { ru: "🧹 День очищения (9).", en: "🧹 Cleansing Day (9).", he: "🧹 יום טיהור (9)." },
            start1: { ru: "🚀 День старта (1).", en: "🚀 Start Day (1).", he: "🚀 יום זינוק (1)." },
            masterDay: { ru: "Мастер-день высокой энергии.", en: "Master day of high energy.", he: "יום מאסטר באנרגיה גבוהה." }
        },
        summary: {
            neutral: { ru: "День с ровной, нейтральной энергией. Благоприятен для текущих задач.", en: "Day with steady, neutral energy. Good for current tasks.", he: "יום עם אנרגיה יציבה ונייטרלית. טוב למשימות שוטפות." }
        },
        status: {
            Critical: "Critical",
            Caution: "Caution",
            Excellent: "Excellent",
            Good: "Good",
            Neutral: "Neutral" // Can be localized if needed, but usually code keys
        }
    };

    static analyzeDay(dateStr, dob, language = 'ru') {
        const date = new Date(dateStr);
        date.setHours(6, 0, 0, 0); // Jyotish Anchor

        // --- Numerology ---
        const vibration = NumerologyEngine.calculateDailyVibration(dob, dateStr);

        // --- Mayan ---
        const mayan = MayanEngine.calculateTzolkin(dateStr, language);

        // --- Jyotish ---
        const jyotish = JyotishEngine.calculatePanchanga(dateStr, language);

        let score = 0;
        let notes = [];
        let status = "Neutral";

        const t = this.TRANSLATIONS;
        const noteTpl = (key, params = {}) => {
            let str = t.notes[key][language];
            for (let p in params) str = str.replace(`{${p}}`, params[p]);
            return str;
        };

        const meaning = t.meanings[vibration] ? t.meanings[vibration][language] : t.notes.masterDay[language];

        let details = {
            numerology: { number: vibration, meaning: meaning },
            mayan: {
                kin: mayan.kin,
                tone: mayan.tone,
                seal: mayan.seal, // Index
                summary: mayan.fullTitle,
                color: mayan.color,
                moon: mayan.moon
            },
            jyotish: { tithi: jyotish.tithi.name, yoga: jyotish.yoga, nakshatra: jyotish.nakshatra.name }
        };

        // --- Logic Scoring ---

        // 1. Jyotish
        const tithiId = jyotish.tithi.id > 15 && jyotish.tithi.id !== 30 ? jyotish.tithi.id - 15 : (jyotish.tithi.id === 30 ? 30 : jyotish.tithi.id);

        if (this.CRITICAL_TITHIS.includes(tithiId)) {
            score -= 2;
            notes.push(noteTpl('tithiCritical', { name: jyotish.tithi.name }));
        } else if ([2, 3, 5, 7, 10, 11, 13].includes(tithiId)) {
            score += 1;
        }

        const maleficList = this.MALEFIC_YOGAS[language] || this.MALEFIC_YOGAS.ru;
        if (maleficList.includes(jyotish.yoga)) {
            score -= 1;
            notes.push(noteTpl('yogaMalefic', { name: jyotish.yoga }));
        }

        // 2. Mayan
        if (mayan.tone === 13) {
            score += 2;
            notes.push(noteTpl('mayan13'));
        } else if (mayan.tone === 1) {
            score += 2;
            notes.push(noteTpl('mayan1'));
        } else if (mayan.tone === 7) {
            score += 1; // Resonant - Tuning
        }

        // 3. Numerology
        if ([11, 22, 33].includes(vibration)) {
            score += 1;
            notes.push(noteTpl('masterNum', { number: vibration }));
        }

        // Specific Personal Day notes
        if (vibration === 9) notes.push(noteTpl('cleanse9'));
        if (vibration === 1) notes.push(noteTpl('start1'));


        // --- Final Status ---
        if (score <= -2) {
            status = "Critical";
        } else if (score < 0) {
            status = "Caution";
        } else if (score >= 3) {
            status = "Excellent";
        } else if (score > 0) {
            status = "Good";
        }

        const dateObj = new Date(dateStr);
        const dayMonth = dateObj.toLocaleDateString(language === 'ru' ? 'ru-RU' : (language === 'he' ? 'he-IL' : 'en-US'), { day: 'numeric', month: 'long' });

        return {
            date: dateStr,
            dayLabel: dayMonth,
            status,
            score,
            notes,
            summary: this.getSummaryText(status, notes, language),
            details
        };
    }

    static getSummaryText(status, notes, language = 'ru') {
        if (notes.length === 0) return this.TRANSLATIONS.summary.neutral[language];
        // Return top 2 notes
        return notes.slice(0, 2).join(" ");
    }

    static getMonthlyForecast(startDateStr, dob, language = 'ru') {
        let forecast = [];
        const start = new Date(startDateStr);
        for (let i = 0; i < 30; i++) {
            const current = new Date(start);
            current.setDate(start.getDate() + i);
            const iso = current.toISOString().split('T')[0];
            forecast.push(this.analyzeDay(iso, dob, language));
        }
        return forecast;
    }
}

