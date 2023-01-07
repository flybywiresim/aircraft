export class Clock {
    constructor(
        public year: number,
        public month: number,
        public dayOfMonth: number,
        public hour: number,
        public minute: number,
        public second: number,
        public secondsOfDay: number,
    ) {
        this.year = 0;
        this.month = 0;
        this.dayOfMonth = 0;
        this.hour = 0;
        this.minute = 0;
        this.second = 0;
        this.secondsOfDay = 0;
    }
}
