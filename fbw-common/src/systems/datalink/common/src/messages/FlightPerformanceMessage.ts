import { AtsuMessage, AtsuMessageSerializationFormat, AtsuMessageType } from './AtsuMessage';

export class FlightPerformanceMessage extends AtsuMessage {
    public CruiseLevel: number = 0;

    public PlannedCostIndex: number = 0;

    public CostIndexMinus6000Feet: number = 0;

    public CostIndexMinus4000Feet: number = 0;

    public CostIndexMinus2000Feet: number = 0;

    public CostIndexZfwMinus1000: number = 0;

    public CostIndexZfwPlus1000: number = 0;

    public TropopauseAltitude: number = 0;

    constructor() {
        super();
        this.Type = AtsuMessageType.OperationsPerformance;
        this.Station = 'AOC';
    }

    public serialize(_format: AtsuMessageSerializationFormat): string {
        return `FL:${this.CruiseLevel}\n`
            + `CI:${this.PlannedCostIndex}\n`
            + `CI-6000FT:${this.CostIndexMinus6000Feet}\n`
            + `CI-4000FT:${this.CostIndexMinus6000Feet}\n`
            + `CI-2000FT:${this.CostIndexMinus6000Feet}\n`
            + `CI_ZFW-1000:${this.CostIndexZfwMinus1000}\n`
            + `CI_ZFW+1000:${this.CostIndexZfwMinus1000}\n`
            + `TROPO:${this.TropopauseAltitude}`;
    }
}
