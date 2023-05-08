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
        return '';
    }
}
