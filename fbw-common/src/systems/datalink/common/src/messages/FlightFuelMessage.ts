import { AtsuMessage, AtsuMessageSerializationFormat, AtsuMessageType } from './AtsuMessage';

export class FlightFuelMessage extends AtsuMessage {
    public PlannedRamp: number = 0;

    public PlannedTakeoff: number = 0;

    public PlannedLanding: number = 0;

    public Taxi: number = 0;

    public Contingency: number = 0;

    public Enroute: number = 0;

    public Alternate: number = 0;

    public Extra: number = 0;

    public MinimumTakeoff: number = 0;

    constructor() {
        super();
        this.Type = AtsuMessageType.OperationsFuel;
        this.Station = 'AOC';
    }

    public serialize(_format: AtsuMessageSerializationFormat): string {
        return `PLAN-RAMP:${this.PlannedRamp}\n`
            + `PLAN-TO:${this.PlannedTakeoff}\n`
            + `PLAN-LAND:${this.PlannedLanding}\n`
            + `TAXI:${this.Taxi}\n`
            + `CONT:${this.Contingency}\n`
            + `ENROUTE:${this.Enroute}\n`
            + `ALTN:${this.Alternate}\n`
            + `EXTRA:${this.Extra}\n`
            + `MIN-TO:${this.MinimumTakeoff}`;
    }
}
