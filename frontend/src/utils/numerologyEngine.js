
export class NumerologyEngine {
    /**
     * Reduces a number to a single digit or master number (11, 22, 33).
     * @param {number} n 
     * @param {boolean} reduceToMaster 
     * @returns {number}
     */
    static reduceDigits(n, reduceToMaster = true) {
        while (n > 9) {
            if (reduceToMaster && [11, 22, 33].includes(n)) {
                return n;
            }
            n = String(n).split('').reduce((sum, digit) => sum + parseInt(digit), 0);
        }
        return n;
    }

    /**
     * Calculates the Life Path Number.
     * @param {string} dob - Date of birth in YYYY-MM-DD format
     * @returns {number}
     */
    static calculateLifePath(dob) {
        if (!dob) return 0;
        const [year, month, day] = dob.split('-').map(Number);

        // Pythagorean method: Reduce Month, Day, Year separately first
        const rMonth = this.reduceDigits(month);
        const rDay = this.reduceDigits(day);
        const rYear = this.reduceDigits(year);

        return this.reduceDigits(rMonth + rDay + rYear);
    }

    /**
     * Calculates the Personal Year Number.
     * @param {string} dob - Date of birth in YYYY-MM-DD
     * @param {number} targetYear - The year to calculate for
     * @returns {number}
     */
    static calculatePersonalYear(dob, targetYear = new Date().getFullYear()) {
        if (!dob) return 0;
        const [_, month, day] = dob.split('-').map(Number);

        const rMonth = this.reduceDigits(month);
        const rDay = this.reduceDigits(day);
        const rYear = this.reduceDigits(targetYear);

        return this.reduceDigits(rMonth + rDay + rYear);
    }

    /**
     * Calculates the Personal Daily Vibration.
     * @param {string} dob - Date of birth
     * @param {string} targetDate - Date in YYYY-MM-DD (defaults to today)
     * @returns {number}
     */
    static calculateDailyVibration(dob, targetDate) {
        if (!dob) return 0;
        const dateObj = targetDate ? new Date(targetDate) : new Date();
        const personalYear = this.calculatePersonalYear(dob, dateObj.getFullYear());

        // Month + Day + Personal Year
        const month = dateObj.getMonth() + 1;
        const day = dateObj.getDate();

        return this.reduceDigits(month + day + personalYear);
    }

    /**
     * Calculates the Universal Day Number.
     * @param {string} targetDate - Date in YYYY-MM-DD
     * @returns {number}
     */
    static calculateUniversalDay(targetDate) {
        const dateObj = targetDate ? new Date(targetDate) : new Date();
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth() + 1;
        const day = dateObj.getDate();

        // Universal Day = Sum of all digits of the current date
        return this.reduceDigits(year + month + day);
    }

    /**
     * Calculates the Personal Month Number.
     * @param {string} dob - Date of birth
     * @param {number} targetYear 
     * @param {number} targetMonth 
     * @returns {number}
     */
    static calculatePersonalMonth(dob, targetYear, targetMonth) {
        if (!dob) return 0;
        const personalYear = this.calculatePersonalYear(dob, targetYear);
        return this.reduceDigits(personalYear + targetMonth);
    }

    /**
     * Calculates the Personal Week Number.
     * Logic: Personal Month + Calendar Week Number (approximate).
     * @param {string} dob 
     * @param {number} targetYear 
     * @param {number} targetMonth 
     * @param {number} weekNumber - 1-52 (or 1-5 for month)
     * @returns {number}
     */
    static calculatePersonalWeek(dob, targetYear, targetMonth, weekNumber) {
        if (!dob) return 0;
        const personalMonth = this.calculatePersonalMonth(dob, targetYear, targetMonth);
        return this.reduceDigits(personalMonth + weekNumber);
    }
}
