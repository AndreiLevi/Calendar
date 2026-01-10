
import { NumerologyEngine } from './numerologyEngine';
import { MayanEngine } from './mayanEngine';
import { JyotishEngine } from './jyotishEngine';

export class ForecastingEngine {

    static CRITICAL_TITHIS = [4, 9, 14, 30]; // Rikta (Empty) & Amavasya
    static MALEFIC_YOGAS = [
        "Вишкумбха", "Атиганда", "Шула", "Ганда", "Вьягхата", "Ваджра", "Вьятипата", "Паригха", "Вайдхрити"
    ];

    static PERSONAL_DAY_MEANINGS = {
        1: "День начинаний, лидерства и независимости. Сейте семена.",
        2: "День сотрудничества, дипломатии и терпения. Слушайте других.",
        3: "День самовыражения, общения и творчества. Будьте заметны.",
        4: "День труда, организации и наведения порядка. Стройте фундамент.",
        5: "День перемен, свободы и приключений. Будьте гибки.",
        6: "День ответственности, заботы и семьи. Гармонизируйте пространство.",
        7: "День анализа, размышлений и уединения. Ищите истину.",
        8: "День силы, финансов и достижений. Управляйте ресурсами.",
        9: "День завершения, очищения и благотворительности. Отпустите старое."
    };

    static analyzeDay(dateStr, dob) {
        const date = new Date(dateStr);
        date.setHours(6, 0, 0, 0); // Jyotish Anchor

        // --- Numerology ---
        const vibration = NumerologyEngine.calculateDailyVibration(dob, dateStr);
        // Note: calculateDailyVibration usually returns Personal Day number.
        // Let's assume it returns the 1-9 or Master Number cycle.

        // --- Mayan ---
        const mayan = MayanEngine.calculateTzolkin(dateStr);

        // --- Jyotish ---
        const jyotish = JyotishEngine.calculatePanchanga(dateStr);

        let score = 0;
        let notes = [];
        let status = "Neutral";
        let details = {
            numerology: { number: vibration, meaning: this.PERSONAL_DAY_MEANINGS[vibration] || "Мастер-день высокой энергии." },
            mayan: {
                kin: mayan.kin,
                tone: mayan.tone,
                seal: mayan.seal,
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
            notes.push(`⚠️ Титхи ${jyotish.tithi.name}: Энергия пустых рук или завершения.`);
        } else if ([2, 3, 5, 7, 10, 11, 13].includes(tithiId)) {
            score += 1;
        }

        if (this.MALEFIC_YOGAS.includes(jyotish.yoga)) {
            score -= 1;
            notes.push(`🌪️ Йога ${jyotish.yoga}: Возможны препятствия.`);
        }

        // 2. Mayan
        if (mayan.tone === 13) {
            score += 2;
            notes.push("🏁 Майя Тон 13: Космическое завершение и полёт.");
        } else if (mayan.tone === 1) {
            score += 2;
            notes.push("🌱 Майя Тон 1: Магнитная цель, начало нового.");
        } else if (mayan.tone === 7) {
            score += 1; // Resonant - Tuning
        }

        // 3. Numerology
        if ([11, 22, 33].includes(vibration)) {
            score += 1;
            notes.push(`⚡ Нумерология ${vibration}: Мастер-число призывает к великому.`);
        } else if ([13, 14, 16, 19].includes(vibration)) {
            // Karmic Debt usually applies to Core numbers, but if Personal Day matches, can be intense.
            // We'll keep it simple for now.
        }

        // Specific Personal Day notes
        if (vibration === 9) notes.push("🧹 День очищения (9).");
        if (vibration === 1) notes.push("🚀 День старта (1).");


        // --- Final Status ---
        if (score <= -2) {
            status = "Critical"; // Red
        } else if (score < 0) {
            status = "Caution"; // Amber
        } else if (score >= 3) {
            status = "Excellent"; // Green
        } else if (score > 0) {
            status = "Good"; // Blue
        }

        const dateObj = new Date(dateStr);
        const dayMonth = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });

        return {
            date: dateStr,
            dayLabel: dayMonth,
            status,
            score,
            notes,
            summary: this.getSummaryText(status, notes),
            details
        };
    }

    static getSummaryText(status, notes) {
        if (notes.length === 0) return "День с ровной, нейтральной энергией. Благоприятен для текущих задач.";
        // Return top 2 notes
        return notes.slice(0, 2).join(" ");
    }

    static getMonthlyForecast(startDateStr, dob) {
        let forecast = [];
        const start = new Date(startDateStr);
        for (let i = 0; i < 30; i++) {
            const current = new Date(start);
            current.setDate(start.getDate() + i);
            const iso = current.toISOString().split('T')[0];
            forecast.push(this.analyzeDay(iso, dob));
        }
        return forecast;
    }
}
