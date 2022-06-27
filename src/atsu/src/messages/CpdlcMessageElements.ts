//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuStatusCodes } from '../AtsuStatusCodes';
import { InputValidation } from '../InputValidation';
import { FansMode } from '../com/FutureAirNavigationSystem';

export enum CpdlcMessageExpectedResponseType {
    NotRequired = 'NE',
    WilcoUnable = 'WU',
    AffirmNegative = 'AN',
    Roger = 'R',
    No = 'N',
    Yes = 'Y'
}

export enum CpdlcMessageContentType {
    Unknown,
    Level,
    Position,
    Time,
    Direction,
    Distance,
    Speed,
    Frequency,
    Procedure,
    Degree,
    VerticalRate,
    LegType,
    LegTypeDistance,
    LegTypeTime,
    AtcUnit,
    Squawk,
    Altimeter,
    Atis,
    Fuel,
    PersonsOnBoard,
    Freetext
}

export abstract class CpdlcMessageContent {
    public Type: CpdlcMessageContentType = CpdlcMessageContentType.Unknown;

    public IndexStart: number = -1;

    public IndexEnd: number = -1;

    public Monitoring: boolean = false;

    public Value: string = '';

    public constructor(type: CpdlcMessageContentType, ...args: any[]) {
        this.Type = type;

        args.forEach((arg) => {
            if (typeof arg === 'number') {
                if (this.IndexStart === -1) {
                    this.IndexStart = arg as number;
                } else {
                    this.IndexEnd = arg as number;
                }
            } else if (typeof arg === 'boolean') {
                this.Monitoring = arg as boolean;
            } else if (typeof arg === 'string') {
                this.Value = arg as string;
            }
        });
    }

    abstract validateAndReplaceContent(value: string[]): { matched: boolean, remaining: string[] };

    public static createInstance(type: CpdlcMessageContentType): CpdlcMessageContent {
        switch (type) {
        case CpdlcMessageContentType.Level:
            return new CpdlcMessageContentLevel(0);
        case CpdlcMessageContentType.Position:
            return new CpdlcMessageContentPosition(0);
        case CpdlcMessageContentType.Time:
            return new CpdlcMessageContentTime(0);
        case CpdlcMessageContentType.Direction:
            return new CpdlcMessageContentDirection(0);
        case CpdlcMessageContentType.Distance:
            return new CpdlcMessageContentDistance(0);
        case CpdlcMessageContentType.Speed:
            return new CpdlcMessageContentSpeed(0);
        case CpdlcMessageContentType.Frequency:
            return new CpdlcMessageContentFrequency(0);
        case CpdlcMessageContentType.Procedure:
            return new CpdlcMessageContentProcedure(0);
        case CpdlcMessageContentType.Degree:
            return new CpdlcMessageContentDegree(0);
        case CpdlcMessageContentType.VerticalRate:
            return new CpdlcMessageContentVerticalRate(0);
        case CpdlcMessageContentType.LegType:
            return new CpdlcMessageContentLegType(0);
        case CpdlcMessageContentType.LegTypeDistance:
            return new CpdlcMessageContentLegTypeDistance(0);
        case CpdlcMessageContentType.LegTypeTime:
            return new CpdlcMessageContentLegTypeTime(0);
        case CpdlcMessageContentType.AtcUnit:
            return new CpdlcMessageContentAtcUnit(0);
        case CpdlcMessageContentType.Squawk:
            return new CpdlcMessageContentSquawk(0);
        case CpdlcMessageContentType.Altimeter:
            return new CpdlcMessageContentAltimeter(0);
        case CpdlcMessageContentType.Atis:
            return new CpdlcMessageContentAtis(0);
        case CpdlcMessageContentType.Fuel:
            return new CpdlcMessageContentFuel(0);
        case CpdlcMessageContentType.PersonsOnBoard:
            return new CpdlcMessageContentPersonsOnBoard(0);
        case CpdlcMessageContentType.Freetext:
            return new CpdlcMessageContentFreetext(0, 0);
        default:
            return null;
        }
    }

    public deserialize(jsonData: any): void {
        this.Type = jsonData.Type;
        this.IndexStart = jsonData.IndexStart;
        this.IndexEnd = jsonData.IndexEnd;
        this.Value = jsonData.Value;
        this.Monitoring = jsonData.Monitoring;
    }
}

export class CpdlcMessageContentLevel extends CpdlcMessageContent {
    public constructor(...args: any[]) {
        super(CpdlcMessageContentType.Level, ...args);
    }

    public validateAndReplaceContent(value: string[]): { matched: boolean, remaining: string[] } {
        let retval = false;
        if (this.IndexStart < value.length && this.IndexStart > -1) {
            retval = InputValidation.validateScratchpadAltitude(value[this.IndexStart]) === AtsuStatusCodes.Ok;
            if (retval) {
                this.Value = value[this.IndexStart];
                value[this.IndexStart] = '%s';
            }
        }
        if (!retval && this.IndexEnd < value.length && this.IndexEnd > -1) {
            retval = InputValidation.validateScratchpadAltitude(value[this.IndexEnd]) === AtsuStatusCodes.Ok;
            if (retval) {
                this.Value = value[this.IndexEnd];
                value[this.IndexEnd] = '%s';
            }
        }
        return { matched: retval, remaining: value };
    }
}

export class CpdlcMessageContentPosition extends CpdlcMessageContent {
    public constructor(...args: any[]) {
        super(CpdlcMessageContentType.Position, ...args);
    }

    public validateAndReplaceContent(value: string[]): { matched: boolean, remaining: string[] } {
        let retval = false;
        if (this.IndexStart < value.length && this.IndexStart > -1) {
            if (InputValidation.validateScratchpadWaypoint(value[this.IndexStart]) === AtsuStatusCodes.Ok
            && InputValidation.validateScratchpadTime(value[this.IndexStart], true) !== AtsuStatusCodes.Ok
            && InputValidation.validateScratchpadTime(value[this.IndexStart], false) !== AtsuStatusCodes.Ok) {
                this.Value = value[this.IndexStart];
                value[this.IndexStart] = '%s';
                retval = true;
            }
        }
        return { matched: retval, remaining: value };
    }
}

export class CpdlcMessageContentTime extends CpdlcMessageContent {
    public constructor(...args: any[]) {
        super(CpdlcMessageContentType.Time, ...args);
    }

    public validateAndReplaceContent(value: string[]): { matched: boolean, remaining: string[] } {
        let retval = false;
        if (this.IndexStart < value.length && this.IndexStart > -1) {
            if (InputValidation.validateScratchpadTime(value[this.IndexStart], true) === AtsuStatusCodes.Ok) {
                this.Value = value[this.IndexStart];
                value[this.IndexStart] = '%s';
                retval = true;
            } else if (InputValidation.validateScratchpadTime(value[this.IndexStart], false) === AtsuStatusCodes.Ok) {
                this.Value = `${value[this.IndexStart]}Z`;
                value[this.IndexStart] = '%s';
                retval = true;
            }
        }
        return { matched: retval, remaining: value };
    }
}

export class CpdlcMessageContentDirection extends CpdlcMessageContent {
    public constructor(...args: any[]) {
        super(CpdlcMessageContentType.Direction, ...args);
    }

    public validateAndReplaceContent(value: string[]): { matched: boolean, remaining: string[] } {
        let retval = false;
        if (this.IndexStart < value.length && this.IndexStart > -1) {
            if (value[this.IndexStart] === 'LEFT' || value[this.IndexStart] === 'RIGHT') {
                this.Value = value[this.IndexStart];
                value[this.IndexStart] = '%s';
                retval = true;
            }
        }
        return { matched: retval, remaining: value };
    }
}

export class CpdlcMessageContentDistance extends CpdlcMessageContent {
    public constructor(...args: any[]) {
        super(CpdlcMessageContentType.Distance, ...args);
    }

    public validateAndReplaceContent(value: string[]): { matched: boolean, remaining: string[] } {
        let retval = false;
        if (this.IndexStart < value.length && this.IndexStart > -1) {
            if (InputValidation.validateScratchpadDistance(value[this.IndexStart]) === AtsuStatusCodes.Ok) {
                this.Value = value[this.IndexStart];
                value[this.IndexStart] = '%s';
                retval = true;
            }
        }
        return { matched: retval, remaining: value };
    }
}

export class CpdlcMessageContentSpeed extends CpdlcMessageContent {
    public constructor(...args: any[]) {
        super(CpdlcMessageContentType.Speed, ...args);
    }

    public validateAndReplaceContent(value: string[]): { matched: boolean, remaining: string[] } {
        let retval = false;
        if (this.IndexStart < value.length && this.IndexStart > -1) {
            if (InputValidation.validateScratchpadSpeed(value[this.IndexStart]) === AtsuStatusCodes.Ok) {
                this.Value = value[this.IndexStart];
                value[this.IndexStart] = '%s';
                retval = true;
            }
        }
        return { matched: retval, remaining: value };
    }
}

export class CpdlcMessageContentFrequency extends CpdlcMessageContent {
    public constructor(...args: any[]) {
        super(CpdlcMessageContentType.Frequency, ...args);
    }

    public validateAndReplaceContent(value: string[]): { matched: boolean, remaining: string[] } {
        let retval = false;
        if (this.IndexStart < value.length && this.IndexStart > -1) {
            if (InputValidation.validateVhfFrequency(value[this.IndexStart]) === AtsuStatusCodes.Ok) {
                this.Value = value[this.IndexStart];
                value[this.IndexStart] = '%s';
                retval = true;
            }
        }
        return { matched: retval, remaining: value };
    }
}

export class CpdlcMessageContentProcedure extends CpdlcMessageContent {
    public constructor(...args: any[]) {
        super(CpdlcMessageContentType.Procedure, ...args);
    }

    public validateAndReplaceContent(value: string[]): { matched: boolean, remaining: string[] } {
        let retval = false;
        if (this.IndexStart < value.length && this.IndexStart > -1) {
            if (InputValidation.validateScratchpadProcedure(value[this.IndexStart]) === AtsuStatusCodes.Ok) {
                this.Value = value[this.IndexStart];
                value[this.IndexStart] = '%s';
                retval = true;
            }
        }
        return { matched: retval, remaining: value };
    }
}

export class CpdlcMessageContentDegree extends CpdlcMessageContent {
    public constructor(...args: any[]) {
        super(CpdlcMessageContentType.Degree, ...args);
    }

    public validateAndReplaceContent(value: string[]): { matched: boolean, remaining: string[] } {
        let retval = false;
        if (this.IndexStart < value.length && this.IndexStart > -1) {
            if (InputValidation.validateScratchpadDegree(value[this.IndexStart]) === AtsuStatusCodes.Ok) {
                this.Value = value[this.IndexStart];
                value[this.IndexStart] = '%s';
                retval = true;
            }
        }
        return { matched: retval, remaining: value };
    }
}

export class CpdlcMessageContentVerticalRate extends CpdlcMessageContent {
    public constructor(...args: any[]) {
        super(CpdlcMessageContentType.VerticalRate, ...args);
    }

    public validateAndReplaceContent(value: string[]): { matched: boolean, remaining: string[] } {
        let retval = false;
        if (this.IndexStart + 3 < value.length && this.IndexStart > -1) {
            if (value[this.IndexStart + 1] === 'FEET' && value[this.IndexStart + 2] === 'PER' && value[this.IndexStart + 3] === 'MINUTE') {
                this.Value = `${value[this.IndexStart]} FEET PER MINUTE`;
                value[this.IndexStart] = '%s';
                value.slice(this.IndexStart + 1, 3);
                retval = true;
            }
        }
        return { matched: retval, remaining: value };
    }
}

export class CpdlcMessageContentAtcUnit extends CpdlcMessageContent {
    public constructor(...args: any[]) {
        super(CpdlcMessageContentType.AtcUnit, ...args);
    }

    public validateAndReplaceContent(value: string[]): { matched: boolean, remaining: string[] } {
        let retval = false;
        if (this.IndexStart < value.length && this.IndexStart > -1) {
            if (this.IndexStart + 1 < value.length && value[this.IndexStart + 1] === 'CTR') {
                this.Value = `${value[this.IndexStart]} ${value[this.IndexStart + 1]}`;
                value.splice(this.IndexStart + 1, 1);
            } else {
                this.Value = value[this.IndexStart];
            }
            value[this.IndexStart] = '%s';
            retval = true;
        }
        return { matched: retval, remaining: value };
    }
}

export class CpdlcMessageContentSquawk extends CpdlcMessageContent {
    public constructor(...args: any[]) {
        super(CpdlcMessageContentType.Squawk, ...args);
    }

    public validateAndReplaceContent(value: string[]): { matched: boolean, remaining: string[] } {
        let retval = false;
        if (this.IndexStart < value.length && this.IndexStart > -1 && /^[0-9]{4}$/.test(value[this.IndexStart])) {
            const squawk = parseInt(value[this.IndexStart]);
            if (squawk >= 0 && squawk < 7777) {
                this.Value = value[this.IndexStart];
                value[this.IndexStart] = '%s';
                retval = true;
            }
        }
        return { matched: retval, remaining: value };
    }
}

export class CpdlcMessageContentFreetext extends CpdlcMessageContent {
    public constructor(...args: any[]) {
        super(CpdlcMessageContentType.Freetext, ...args);
    }

    public validateAndReplaceContent(value: string[]): { matched: boolean, remaining: string[] } {
        let retval = false;
        if (this.IndexStart < value.length && this.IndexStart > -1) {
            this.Value = value.slice(this.IndexStart, this.IndexEnd === -1 ? value.length : this.IndexEnd + 1).join(' ');
            value = value.slice(0, this.IndexStart);
            value.push('%s');
            retval = true;
        }
        return { matched: retval, remaining: value };
    }
}

export class CpdlcMessageContentLegTypeDistance extends CpdlcMessageContent {
    public constructor(...args: any[]) {
        super(CpdlcMessageContentType.LegTypeDistance, ...args);
    }

    public validateAndReplaceContent(value: string[]): { matched: boolean, remaining: string[] } {
        let retval = false;
        if (this.IndexStart < value.length && this.IndexStart > -1) {
            if (/^[0-9]{1,2}$/.test(value[this.IndexStart])) {
                const distance = parseInt(value[this.IndexStart]);
                if (distance >= 1 && distance < 100) {
                    this.Value = value[this.IndexStart];
                    value[this.IndexStart] = '%s';
                    retval = true;
                }
            }
        }
        return { matched: retval, remaining: value };
    }
}

export class CpdlcMessageContentLegTypeTime extends CpdlcMessageContent {
    public constructor(...args: any[]) {
        super(CpdlcMessageContentType.LegTypeTime, ...args);
    }

    public validateAndReplaceContent(value: string[]): { matched: boolean, remaining: string[] } {
        let retval = false;
        if (this.IndexStart + 1 < value.length && this.IndexStart > -1 && /^[0-9]{1}$/.test(value[this.IndexStart])) {
            if (value[this.IndexStart + 1] === 'MIN' || value[this.IndexStart + 1] === 'MINS' || value[this.IndexStart + 1] === 'MINUTES') {
                const minutes = parseInt(value[this.IndexStart]);
                if (minutes >= 1 && minutes < 10) {
                    this.Value = value[this.IndexStart];
                    value[this.IndexStart] = '%s';
                    retval = true;
                }
            }
        }
        return { matched: retval, remaining: value };
    }
}

export class CpdlcMessageContentLegType extends CpdlcMessageContent {
    private legDistance: CpdlcMessageContentLegTypeDistance;

    private legTime: CpdlcMessageContentLegTypeTime;

    public constructor(...args: any[]) {
        super(CpdlcMessageContentType.LegType, ...args);
        this.legDistance = new CpdlcMessageContentLegTypeDistance(...args);
        this.legTime = new CpdlcMessageContentLegTypeTime(...args);
    }

    public validateAndReplaceContent(value: string[]): { matched: boolean, remaining: string[] } {
        const legTimeRetval = this.legTime.validateAndReplaceContent(value);
        if (legTimeRetval.matched === true) {
            return legTimeRetval;
        }
        return this.legDistance.validateAndReplaceContent(value);
    }
}

export class CpdlcMessageContentAltimeter extends CpdlcMessageContent {
    public constructor(...args: any[]) {
        super(CpdlcMessageContentType.Altimeter, ...args);
    }

    public validateAndReplaceContent(value: string[]): { matched: boolean, remaining: string[] } {
        let retval = false;
        if (this.IndexStart >= 1 && this.IndexStart < value.length && this.IndexStart > -1) {
            if (value[this.IndexStart - 1] === 'ALTIMETER' && /^[0-9]{2}\.[0-9]{2}$/.test(value[this.IndexStart])) {
                retval = true;
            } else if (value[this.IndexStart - 1] === 'QNH' && /^[0-9]{3,4}$/.test(value[this.IndexStart])) {
                retval = true;
            }

            if (retval === true) {
                this.Value = value[this.IndexStart];
                value[this.IndexStart] = '%s';
            }
        }
        return { matched: retval, remaining: value };
    }
}

export class CpdlcMessageContentAtis extends CpdlcMessageContent {
    public constructor(...args: any[]) {
        super(CpdlcMessageContentType.Atis, ...args);
    }

    public validateAndReplaceContent(value: string[]): { matched: boolean, remaining: string[] } {
        let retval = false;
        if (this.IndexStart < value.length && this.IndexStart > -1) {
            if (/^[A-Z]{1}$/.test(value[this.IndexStart])) {
                this.Value = value[this.IndexStart];
                value[this.IndexStart] = '%s';
                retval = true;
            }
        }
        return { matched: retval, remaining: value };
    }
}

export class CpdlcMessageContentFuel extends CpdlcMessageContent {
    public constructor(...args: any[]) {
        super(CpdlcMessageContentType.Fuel, ...args);
    }

    public validateAndReplaceContent(value: string[]): { matched: boolean, remaining: string[] } {
        let retval = false;
        if (this.IndexStart < value.length && this.IndexStart > -1) {
            if (/^[0-9]{1,6}$/.test(value[this.IndexStart])) {
                this.Value = value[this.IndexStart];
                value[this.IndexStart] = '%s';
                retval = true;
            }
        }
        return { matched: retval, remaining: value };
    }
}

export class CpdlcMessageContentPersonsOnBoard extends CpdlcMessageContent {
    public constructor(...args: any[]) {
        super(CpdlcMessageContentType.PersonsOnBoard, ...args);
    }

    public validateAndReplaceContent(value: string[]): { matched: boolean, remaining: string[] } {
        let retval = false;
        if (this.IndexStart < value.length && this.IndexStart > -1) {
            if (/^[0-9]{1,3}$/.test(value[this.IndexStart])) {
                this.Value = value[this.IndexStart];
                value[this.IndexStart] = '%s';
                retval = true;
            }
        }
        return { matched: retval, remaining: value };
    }
}

export class CpdlcMessageElement {
    public TypeId: string = '';

    public FansModes: FansMode[] = [];

    public Urgent: boolean = false;

    public Content: CpdlcMessageContent[] = [];

    public ExpectedResponse: CpdlcMessageExpectedResponseType = CpdlcMessageExpectedResponseType.No;

    public constructor(typeId: string, ...args: any[]) {
        this.TypeId = typeId;
        args.forEach((arg) => {
            if (arg instanceof Array && arg[0] instanceof CpdlcMessageContent) this.Content = arg as CpdlcMessageContent[];
            else if (typeof arg === 'boolean') this.Urgent = arg as boolean;
            else if (arg instanceof Array) this.FansModes = arg as FansMode[];
            else if (typeof arg === 'string') this.ExpectedResponse = arg as CpdlcMessageExpectedResponseType;
            else console.log(`Unknown arg: ${arg}, type: ${typeof arg}`);
        });
    }

    public deepCopy(): CpdlcMessageElement {
        const instance = new CpdlcMessageElement(this.TypeId, this.FansModes, this.Urgent, this.ExpectedResponse);

        this.Content.forEach((entry) => {
            instance.Content.push(CpdlcMessageContent.createInstance(entry.Type));
            instance.Content[instance.Content.length - 1].IndexStart = entry.IndexStart;
            instance.Content[instance.Content.length - 1].IndexEnd = entry.IndexEnd;
            instance.Content[instance.Content.length - 1].Value = entry.Value;
            instance.Content[instance.Content.length - 1].Monitoring = entry.Monitoring;
        });

        return instance;
    }

    public deserialize(jsonData: any): void {
        this.TypeId = jsonData.TypeId;
        this.FansModes = jsonData.FansModes;
        this.Urgent = jsonData.Urgent;

        jsonData.Content.forEach((entry) => {
            this.Content.push(CpdlcMessageContent.createInstance(entry.Type));
            this.Content[this.Content.length - 1].deserialize(entry);
        });

        this.ExpectedResponse = jsonData.ExpectedResponse;
    }
}

export const CpdlcMessagesDownlink: { [identification: string]: [string[], CpdlcMessageElement] } = {
    DM0: [['WILCO'], new CpdlcMessageElement('DM0', [FansMode.FansA, FansMode.FansB])],
    DM1: [['UNABLE'], new CpdlcMessageElement('DM1', [FansMode.FansA, FansMode.FansB])],
    DM2: [['STANDBY'], new CpdlcMessageElement('DM2', [FansMode.FansA, FansMode.FansB])],
    DM3: [['ROGER'], new CpdlcMessageElement('DM3', [FansMode.FansA, FansMode.FansB])],
    DM4: [['AFFIRM'], new CpdlcMessageElement('DM4', [FansMode.FansA, FansMode.FansB])],
    DM5: [['NEGATIVE'], new CpdlcMessageElement('DM5', [FansMode.FansA, FansMode.FansB])],
    DM6: [['REQUEST %s'], new CpdlcMessageElement('DM6', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentLevel(1)], CpdlcMessageExpectedResponseType.Yes)],
    DM7: [['REQUEST BLOCK %s TO %s'], new CpdlcMessageElement('DM7', [FansMode.FansA], [new CpdlcMessageContentLevel(2), new CpdlcMessageContentLevel(4)],
        CpdlcMessageExpectedResponseType.Yes)],
    DM8: [['REQUEST CRUISE CLIMB TO %s'], new CpdlcMessageElement('DM8', [FansMode.FansA], [new CpdlcMessageContentLevel(4)], CpdlcMessageExpectedResponseType.Yes)],
    DM9: [['REQUEST CLIMB TO %s'], new CpdlcMessageElement('DM9', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentLevel(3)], CpdlcMessageExpectedResponseType.Yes)],
    DM10: [['REQUEST DESCEND TO %s'], new CpdlcMessageElement('DM10', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentLevel(3)], CpdlcMessageExpectedResponseType.Yes)],
    DM11: [['AT %s REQUEST CLIMB TO %s'], new CpdlcMessageElement('DM11', [FansMode.FansA], [new CpdlcMessageContentPosition(1), new CpdlcMessageContentLevel(5)],
        CpdlcMessageExpectedResponseType.Yes)],
    DM12: [['AT %s REQUEST DESCEND TO %s'], new CpdlcMessageElement('DM12', [FansMode.FansA], [new CpdlcMessageContentPosition(1), new CpdlcMessageContentLevel(5)],
        CpdlcMessageExpectedResponseType.Yes)],
    DM13: [['AT %s REQUEST CLIMB TO %s'], new CpdlcMessageElement('DM13', [FansMode.FansA], [new CpdlcMessageContentTime(1), new CpdlcMessageContentLevel(5)],
        CpdlcMessageExpectedResponseType.Yes)],
    DM14: [['AT %s REQUEST DESCEND TO %s'], new CpdlcMessageElement('DM14', [FansMode.FansA], [new CpdlcMessageContentTime(1), new CpdlcMessageContentLevel(5)],
        CpdlcMessageExpectedResponseType.Yes)],
    DM15: [['REQUEST OFFSET %s %s OF ROUTE'], new CpdlcMessageElement('DM15', [FansMode.FansA], [new CpdlcMessageContentDistance(2), new CpdlcMessageContentDirection(3)],
        CpdlcMessageExpectedResponseType.Yes)],
    DM16: [['AT %s REQUEST OFFSET %s %s OF ROUTE'], new CpdlcMessageElement('DM16', [FansMode.FansA],
        [new CpdlcMessageContentPosition(1), new CpdlcMessageContentDistance(4), new CpdlcMessageContentDirection(5)], CpdlcMessageExpectedResponseType.Yes)],
    DM17: [['AT %s REQUEST OFFSET %s %s OF ROUTE'], new CpdlcMessageElement('DM17', [FansMode.FansA],
        [new CpdlcMessageContentTime(1), new CpdlcMessageContentDistance(4), new CpdlcMessageContentDirection(5)], CpdlcMessageExpectedResponseType.Yes)],
    DM18: [['REQUEST %s'], new CpdlcMessageElement('DM18', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentSpeed(1)], CpdlcMessageExpectedResponseType.Yes)],
    DM19: [['REQUEST %s TO %s'], new CpdlcMessageElement('DM19', [FansMode.FansA], [new CpdlcMessageContentSpeed(1), new CpdlcMessageContentSpeed(3)], CpdlcMessageExpectedResponseType.Yes)],
    DM20: [['REQUEST VOICE CONTACT'], new CpdlcMessageElement('DM20', [FansMode.FansA], CpdlcMessageExpectedResponseType.Yes)],
    DM21: [['REQUEST VOICE CONTACT %s'], new CpdlcMessageElement('DM21', [FansMode.FansA], [new CpdlcMessageContentFrequency(3)], CpdlcMessageExpectedResponseType.Yes)],
    DM22: [['REQUEST DIRECT TO %s'], new CpdlcMessageElement('DM22', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentPosition(3)], CpdlcMessageExpectedResponseType.Yes)],
    DM23: [['REQUEST %s'], new CpdlcMessageElement('DM23', [FansMode.FansA], [new CpdlcMessageContentProcedure(1)], CpdlcMessageExpectedResponseType.Yes)],
    DM25: [['REQUEST %s CLEARANCE'], new CpdlcMessageElement('DM25', [FansMode.FansA], [new CpdlcMessageContentFreetext(1, 2)], CpdlcMessageExpectedResponseType.Yes)],
    DM26: [['REQUEST WEATHER DEVIATION TO %s VIA %s'], new CpdlcMessageElement('DM26', [FansMode.FansA],
        [new CpdlcMessageContentPosition(4), new CpdlcMessageContentFreetext(6, -1)], CpdlcMessageExpectedResponseType.Yes)],
    DM27: [['REQUEST WEATHER DEVIATION UP TO %s %s OF ROUTE'], new CpdlcMessageElement('DM27', [FansMode.FansA, FansMode.FansB],
        [new CpdlcMessageContentDistance(5), new CpdlcMessageContentDirection(6)], CpdlcMessageExpectedResponseType.Yes)],
    DM28: [['LEAVING %s'], new CpdlcMessageElement('DM28', [FansMode.FansA], [new CpdlcMessageContentLevel(1)], CpdlcMessageExpectedResponseType.No)],
    DM29: [['CLIMBING TO %s'], new CpdlcMessageElement('DM29', [FansMode.FansA], [new CpdlcMessageContentLevel(2)], CpdlcMessageExpectedResponseType.No)],
    DM30: [['DESCENDING TO %s'], new CpdlcMessageElement('DM30', [FansMode.FansA], [new CpdlcMessageContentLevel(2)], CpdlcMessageExpectedResponseType.No)],
    DM31: [['PASSING %s'], new CpdlcMessageElement('DM31', [FansMode.FansA], [new CpdlcMessageContentPosition(1)], CpdlcMessageExpectedResponseType.No)],
    DM32: [['PRESENT LEVEL %s'], new CpdlcMessageElement('DM32', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentLevel(2)],
        CpdlcMessageExpectedResponseType.No)],
    DM33: [['PRESENT POSITION %s'], new CpdlcMessageElement('DM33', [FansMode.FansA], [new CpdlcMessageContentPosition(2)], CpdlcMessageExpectedResponseType.No)],
    DM34: [['PRESENT SPEED %s'], new CpdlcMessageElement('DM34', [FansMode.FansA], [new CpdlcMessageContentSpeed(2)], CpdlcMessageExpectedResponseType.No)],
    DM35: [['PRESENT HEADING %s'], new CpdlcMessageElement('DM35', [FansMode.FansA], [new CpdlcMessageContentDegree(2)], CpdlcMessageExpectedResponseType.No)],
    DM36: [['PRESENT GROUND TRACK %s'], new CpdlcMessageElement('DM36', [FansMode.FansA], [new CpdlcMessageContentDegree(3)], CpdlcMessageExpectedResponseType.No)],
    DM37: [['MAINTAINING %s', 'LEVEL %s'], new CpdlcMessageElement('DM37', [FansMode.FansA], [new CpdlcMessageContentLevel(1)], CpdlcMessageExpectedResponseType.No)],
    DM38: [['ASSIGNED LEVEL %s'], new CpdlcMessageElement('DM38', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentLevel(2)],
        CpdlcMessageExpectedResponseType.No)],
    DM39: [['ASSIGNED SPEED %s'], new CpdlcMessageElement('DM39', [FansMode.FansA], [new CpdlcMessageContentSpeed(2)], CpdlcMessageExpectedResponseType.No)],
    DM40: [['ASSIGNED ROUTE %s'], new CpdlcMessageElement('DM40', [FansMode.FansA], [new CpdlcMessageContentFreetext(2, -1)], CpdlcMessageExpectedResponseType.No)],
    DM41: [['BACK ON ROUTE'], new CpdlcMessageElement('DM41', [FansMode.FansA], CpdlcMessageExpectedResponseType.No)],
    DM42: [['NEXT WAYPOINT %s'], new CpdlcMessageElement('DM42', [FansMode.FansA], [new CpdlcMessageContentPosition(2)], CpdlcMessageExpectedResponseType.No)],
    DM43: [['NEXT WAYPOINT ETA %s'], new CpdlcMessageElement('DM43', [FansMode.FansA], [new CpdlcMessageContentTime(3)], CpdlcMessageExpectedResponseType.No)],
    DM44: [['ENSUING WAYPOINT %s'], new CpdlcMessageElement('DM44', [FansMode.FansA], [new CpdlcMessageContentPosition(2)], CpdlcMessageExpectedResponseType.No)],
    DM45: [['REPORTED WAYPOINT %s'], new CpdlcMessageElement('DM45', [FansMode.FansA], [new CpdlcMessageContentPosition(2)], CpdlcMessageExpectedResponseType.No)],
    DM46: [['REPORTED WAYPOINT %s'], new CpdlcMessageElement('DM46', [FansMode.FansA], [new CpdlcMessageContentTime(2)], CpdlcMessageExpectedResponseType.No)],
    DM47: [['SQUAWKING %s'], new CpdlcMessageElement('DM47', [FansMode.FansA], [new CpdlcMessageContentSquawk(1)], CpdlcMessageExpectedResponseType.No)],
    DM48: [['POSITION REPORT'], new CpdlcMessageElement('DM48', [FansMode.FansA], CpdlcMessageExpectedResponseType.Roger)],
    DM49: [['WHEN CAN WE EXPECT %s'], new CpdlcMessageElement('DM49', [FansMode.FansA], [new CpdlcMessageContentSpeed(4)], CpdlcMessageExpectedResponseType.Yes)],
    DM50: [['WHEN CAN WE EXPECT %s TO %s'], new CpdlcMessageElement('DM50', [FansMode.FansA], [new CpdlcMessageContentSpeed(4), new CpdlcMessageContentSpeed(6)],
        CpdlcMessageExpectedResponseType.Yes)],
    DM51: [['WHEN CAN WE EXPECT BACK ON ROUTE'], new CpdlcMessageElement('DM51', [FansMode.FansA], CpdlcMessageExpectedResponseType.Yes)],
    DM52: [['WHEN CAN WE EXPECT LOWER LEVEL'], new CpdlcMessageElement('DM52', [FansMode.FansA], CpdlcMessageExpectedResponseType.Yes)],
    DM53: [['WHEN CAN WE EXPECT HIGHER LEVEL'], new CpdlcMessageElement('DM53', [FansMode.FansA], CpdlcMessageExpectedResponseType.Yes)],
    DM54: [['WHEN CAN WE EXPECT CRUISE CLIMB TO %s'], new CpdlcMessageElement('DM54', [FansMode.FansA], [new CpdlcMessageContentLevel(7)], CpdlcMessageExpectedResponseType.Yes)],
    DM55: [['PAN PAN PAN'], new CpdlcMessageElement('DM55', [FansMode.FansA, FansMode.FansB], CpdlcMessageExpectedResponseType.Yes, true)],
    DM56: [['MAYDAY MAYDAY MAYDAY'], new CpdlcMessageElement('DM56', [FansMode.FansA, FansMode.FansB], CpdlcMessageExpectedResponseType.Yes, true)],
    DM57: [['%s FUEL REMAINING AND %s PERSONS ON BOARD'], new CpdlcMessageElement('DM57', [FansMode.FansA, FansMode.FansB],
        [new CpdlcMessageContentFuel(0), new CpdlcMessageContentPersonsOnBoard(4)], CpdlcMessageExpectedResponseType.Yes, true)],
    DM58: [['CANCEL EMERGENCY'], new CpdlcMessageElement('DM58', [FansMode.FansA, FansMode.FansB], CpdlcMessageExpectedResponseType.Yes, true)],
    DM59: [['DIVERTING TO %s VIA %s'], new CpdlcMessageElement('DM59', [FansMode.FansA, FansMode.FansB],
        [new CpdlcMessageContentPosition(2), new CpdlcMessageContentFreetext(4, -1)], CpdlcMessageExpectedResponseType.Yes, true)],
    DM60: [['OFFSETTING %s %s OF ROUTE'], new CpdlcMessageElement('DM60', [FansMode.FansA, FansMode.FansB],
        [new CpdlcMessageContentDistance(1), new CpdlcMessageContentDirection(2)], CpdlcMessageExpectedResponseType.Yes, true)],
    DM61: [['DESCENDING TO %s'], new CpdlcMessageElement('DM61', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentLevel(2)], CpdlcMessageExpectedResponseType.Yes, true)],
    DM62: [['ERROR %s'], new CpdlcMessageElement('DM62', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentFreetext(1, -1)], CpdlcMessageExpectedResponseType.Yes, true)],
    DM63: [['NOT CURRENT DATA AUTHORITY'], new CpdlcMessageElement('DM63', [FansMode.FansA, FansMode.FansB], CpdlcMessageExpectedResponseType.No)],
    DM65: [['DUE TO WEATHER'], new CpdlcMessageElement('DM65', [FansMode.FansA, FansMode.FansB], CpdlcMessageExpectedResponseType.No)],
    DM66: [['DUE TO AIRCRAFT PERFORMANCE'], new CpdlcMessageElement('DM66', [FansMode.FansA, FansMode.FansB], CpdlcMessageExpectedResponseType.No)],
    DM67: [['%s'], new CpdlcMessageElement('DM67', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentFreetext(0, -1)], CpdlcMessageExpectedResponseType.No)],
    DM68: [['%s'], new CpdlcMessageElement('DM68', [FansMode.FansA], true, [new CpdlcMessageContentFreetext(0, -1)], CpdlcMessageExpectedResponseType.Yes)],
    DM69: [['REQUEST VMC DESCEND'], new CpdlcMessageElement('DM69', [FansMode.FansA], CpdlcMessageExpectedResponseType.Yes)],
    DM70: [['REQUEST HEADING %s'], new CpdlcMessageElement('DM70', [FansMode.FansA], [new CpdlcMessageContentDegree(2)], CpdlcMessageExpectedResponseType.Yes)],
    DM71: [['REQUEST GROUND TRACK %s'], new CpdlcMessageElement('DM71', [FansMode.FansA], [new CpdlcMessageContentDegree(3)], CpdlcMessageExpectedResponseType.Yes)],
    DM72: [['REACHING %s'], new CpdlcMessageElement('DM72', [FansMode.FansA], [new CpdlcMessageContentLevel(1)], CpdlcMessageExpectedResponseType.Yes)],
    DM74: [['REQUEST TO MAINTAIN OWN SEPARATION AND VMC'], new CpdlcMessageElement('DM74', [FansMode.FansA], CpdlcMessageExpectedResponseType.Yes)],
    DM75: [['AT PILOTS DISCRETION'], new CpdlcMessageElement('DM75', [FansMode.FansA], CpdlcMessageExpectedResponseType.Yes)],
    DM76: [['REACHING BLOCK %s TO %s'], new CpdlcMessageElement('DM76', [FansMode.FansA], [new CpdlcMessageContentLevel(2), new CpdlcMessageContentLevel(4)],
        CpdlcMessageExpectedResponseType.No)],
    DM78: [['AT %s %s TO %s', 'AT %s %s FROM %s'], new CpdlcMessageElement('DM78', [FansMode.FansA],
        [new CpdlcMessageContentTime(1), new CpdlcMessageContentDistance(2), new CpdlcMessageContentPosition(4)], CpdlcMessageExpectedResponseType.No)],
    DM79: [['ATIS %s'], new CpdlcMessageElement('DM79', [FansMode.FansA], [new CpdlcMessageContentAtis(1)], CpdlcMessageExpectedResponseType.No)],
    DM80: [['DEVIATING UP TO %s %s OF ROUTE'], new CpdlcMessageElement('DM80', [FansMode.FansA],
        [new CpdlcMessageContentDistance(3), new CpdlcMessageContentDirection(4)], CpdlcMessageExpectedResponseType.Yes, true)],
    DM81: [['WE CAN ACCEPT %s AT %s'], new CpdlcMessageElement('DM81', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentLevel(3), new CpdlcMessageContentTime(5)],
        CpdlcMessageExpectedResponseType.No)],
    DM82: [['WE CANNOT ACCEPT %s'], new CpdlcMessageElement('DM82', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentLevel(3)], CpdlcMessageExpectedResponseType.No)],
    DM83: [['WE CAN ACCEPT %s AT %s'], new CpdlcMessageElement('DM83', [FansMode.FansA], [new CpdlcMessageContentSpeed(3), new CpdlcMessageContentTime(5)],
        CpdlcMessageExpectedResponseType.No)],
    DM84: [['WE CANNOT ACCEPT %s'], new CpdlcMessageElement('DM84', [FansMode.FansA], [new CpdlcMessageContentSpeed(3)], CpdlcMessageExpectedResponseType.No)],
    DM85: [['WE CAN ACCEPT %s %s AT %s'], new CpdlcMessageElement('DM85', [FansMode.FansA],
        [new CpdlcMessageContentDistance(3), new CpdlcMessageContentDirection(4), new CpdlcMessageContentTime(6)], CpdlcMessageExpectedResponseType.No)],
    DM86: [['WE CANNOT ACCEPT %s %s'], new CpdlcMessageElement('DM86', [FansMode.FansA], [new CpdlcMessageContentDistance(3), new CpdlcMessageContentDirection(4)],
        CpdlcMessageExpectedResponseType.No)],
    DM87: [['WHEN CAN WE EXPECT CLIMB TO %s'], new CpdlcMessageElement('DM87', [FansMode.FansA], [new CpdlcMessageContentLevel(6)], CpdlcMessageExpectedResponseType.Yes)],
    DM88: [['WHEN CAN WE EXPECT DESCEND TO %s'], new CpdlcMessageElement('DM88', [FansMode.FansA], [new CpdlcMessageContentLevel(6)], CpdlcMessageExpectedResponseType.Yes)],
    DM89: [['MONITORING %s %s'], new CpdlcMessageElement('DM89', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentAtcUnit(1), new CpdlcMessageContentFrequency(2)],
        CpdlcMessageExpectedResponseType.No)],
    DM98: [['%s'], new CpdlcMessageElement('DM98', [FansMode.FansB], [new CpdlcMessageContentFreetext(0, -1)], CpdlcMessageExpectedResponseType.No)],
    DM99: [['CURRENT DATA AUTHORITY'], new CpdlcMessageElement('DM99', [FansMode.FansA, FansMode.FansB], CpdlcMessageExpectedResponseType.No, true)],
    DM100: [['LOGICAL ACKNOWLEDGEMENT'], new CpdlcMessageElement('DM100', [FansMode.FansB], CpdlcMessageExpectedResponseType.No)],
    DM104: [['ETA %s %s'], new CpdlcMessageElement('DM104', [FansMode.FansA], [new CpdlcMessageContentPosition(1), new CpdlcMessageContentTime(2)], CpdlcMessageExpectedResponseType.No)],
    DM106: [['PREFERRED LEVEL %s'], new CpdlcMessageElement('DM106', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentLevel(2)], CpdlcMessageExpectedResponseType.No)],
    DM107: [['NOT AUTHORIZED NEXT DATA AUTHORITY'], new CpdlcMessageElement('DM107', [FansMode.FansB], CpdlcMessageExpectedResponseType.No)],
    DM109: [['TOP OF DESCENT %s'], new CpdlcMessageElement('DM109', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentTime(3)], CpdlcMessageExpectedResponseType.No)],
    DM113: [['SPEED %s'], new CpdlcMessageElement('DM113', [FansMode.FansA], [new CpdlcMessageContentSpeed(1)], CpdlcMessageExpectedResponseType.No)],
    DM9998: [['REQUEST LOGON'], new CpdlcMessageElement('DM9998', [FansMode.FansA, FansMode.FansB], CpdlcMessageExpectedResponseType.Yes)],
    DM9999: [['LOGOFF'], new CpdlcMessageElement('DM9999', [FansMode.FansA, FansMode.FansB], CpdlcMessageExpectedResponseType.No)],
};

export const CpdlcMessagesUplink: { [identification: string]: [string[], CpdlcMessageElement] } = {
    UM0: [['UNABLE'], new CpdlcMessageElement('UM0', [FansMode.FansA, FansMode.FansB])],
    UM1: [['STANDBY'], new CpdlcMessageElement('UM1', [FansMode.FansA, FansMode.FansB])],
    UM3: [['ROGER'], new CpdlcMessageElement('UM3', [FansMode.FansA, FansMode.FansB])],
    UM4: [['AFFIRM'], new CpdlcMessageElement('UM4', [FansMode.FansA, FansMode.FansB])],
    UM5: [['NEGATIVE'], new CpdlcMessageElement('UM5', [FansMode.FansA, FansMode.FansB])],
    UM6: [['EXPECT %s'], new CpdlcMessageElement('UM6', [FansMode.FansA], [new CpdlcMessageContentLevel(1)], CpdlcMessageExpectedResponseType.Roger)],
    UM7: [['EXPECT CLIMB AT %s'], new CpdlcMessageElement('UM7', [FansMode.FansA], [new CpdlcMessageContentTime(3)], CpdlcMessageExpectedResponseType.Roger)],
    UM8: [['EXPECT CLIMB AT %s'], new CpdlcMessageElement('UM8', [FansMode.FansA], [new CpdlcMessageContentPosition(3)], CpdlcMessageExpectedResponseType.Roger)],
    UM9: [['EXPECT DESCENT AT %s'], new CpdlcMessageElement('UM9', [FansMode.FansA], [new CpdlcMessageContentTime(3)], CpdlcMessageExpectedResponseType.Roger)],
    UM10: [['EXPECT DESCENT AT %s'], new CpdlcMessageElement('UM10', [FansMode.FansA], [new CpdlcMessageContentPosition(3)], CpdlcMessageExpectedResponseType.Roger)],
    UM11: [['EXPECT CRUISE CLIMB AT %s'], new CpdlcMessageElement('UM11', [FansMode.FansA], [new CpdlcMessageContentTime(4)], CpdlcMessageExpectedResponseType.Roger)],
    UM12: [['EXPECT CRUISE CLIMB AT %s'], new CpdlcMessageElement('UM12', [FansMode.FansA], [new CpdlcMessageContentPosition(4)], CpdlcMessageExpectedResponseType.Roger)],
    UM19: [['MAINTAIN %s'], new CpdlcMessageElement('UM19', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentLevel(1)],
        CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM20: [['CLIMB TO %s', 'CLIMB TO AND MAINTAIN %s'], new CpdlcMessageElement('UM20', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentLevel(2, 4)],
        CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM21: [['AT %s CLIMB TO %s', 'AT %s CLIMB TO AND MAINTAIN %s'], new CpdlcMessageElement('UM21', [FansMode.FansA],
        [new CpdlcMessageContentTime(1, true), new CpdlcMessageContentLevel(4, 6)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM22: [['AT %s CLIMB TO %s', 'AT %s CLIMB TO AND MAINTAIN %s'], new CpdlcMessageElement('UM22', [FansMode.FansA],
        [new CpdlcMessageContentPosition(1, true), new CpdlcMessageContentLevel(4, 6)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM23: [['DESCEND TO %s', 'DESCEND TO AND MAINTAIN %s'], new CpdlcMessageElement('UM23', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentLevel(2, 4)],
        CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM24: [['AT %s DESCEND TO %s', 'AT %s DESCEND TO AND MAINTAIN %s'], new CpdlcMessageElement('UM24', [FansMode.FansA],
        [new CpdlcMessageContentTime(1, true), new CpdlcMessageContentLevel(4, 6)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM25: [['AT %s DESCEND TO %s', 'AT %s DESCEND TO AND MAINTAIN %s'], new CpdlcMessageElement('UM25', [FansMode.FansA],
        [new CpdlcMessageContentPosition(1, true), new CpdlcMessageContentLevel(4, 6)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM26: [['CLIMB TO REACH %s BY %s'], new CpdlcMessageElement('UM26', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentLevel(3), new CpdlcMessageContentTime(5)],
        CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM27: [['CLIMB TO REACH %s BY %s'], new CpdlcMessageElement('UM27', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentLevel(3), new CpdlcMessageContentPosition(5)],
        CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM28: [['DESCEND TO REACH %s BY %s'], new CpdlcMessageElement('UM28', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentLevel(3), new CpdlcMessageContentTime(5)],
        CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM29: [['DESCEND TO REACH %s BY %s'], new CpdlcMessageElement('UM29', [FansMode.FansA, FansMode.FansB],
        [new CpdlcMessageContentLevel(3), new CpdlcMessageContentPosition(5)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM30: [['MAINTAIN BLOCK %s TO %s'], new CpdlcMessageElement('UM30', [FansMode.FansA, FansMode.FansB],
        [new CpdlcMessageContentLevel(2), new CpdlcMessageContentLevel(4)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM31: [['CLIMB TO MAINTAIN BLOCK %s TO %s'], new CpdlcMessageElement('UM31', [FansMode.FansA, FansMode.FansB],
        [new CpdlcMessageContentLevel(4), new CpdlcMessageContentLevel(6)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM32: [['DESCEND TO MAINTAIN BLOCK %s TO %s'], new CpdlcMessageElement('UM32', [FansMode.FansA, FansMode.FansB],
        [new CpdlcMessageContentLevel(4), new CpdlcMessageContentLevel(6)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM34: [['CRUISE CLIMB TO %s'], new CpdlcMessageElement('UM34', [FansMode.FansA], [new CpdlcMessageContentLevel(3)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM35: [['WHEN ABOVE %s COMMENCE CRUISE CLIMB', 'CRUISE CLIMB ABOVE %s'], new CpdlcMessageElement('UM35', [FansMode.FansA],
        [new CpdlcMessageContentLevel(2, 3)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM36: [['EXPEDITE CLIMB TO %s'], new CpdlcMessageElement('UM36', [FansMode.FansA], [new CpdlcMessageContentLevel(3)], CpdlcMessageExpectedResponseType.WilcoUnable, true)],
    UM37: [['EXPEDITE DESCENT TO %s'], new CpdlcMessageElement('UM37', [FansMode.FansA], [new CpdlcMessageContentLevel(3)], CpdlcMessageExpectedResponseType.WilcoUnable, true)],
    UM38: [['IMMEDIATELY CLIMB TO %s'], new CpdlcMessageElement('UM38', [FansMode.FansA], [new CpdlcMessageContentLevel(3)], CpdlcMessageExpectedResponseType.WilcoUnable, true)],
    UM39: [['IMMEDIATELY DESCEND TO %s'], new CpdlcMessageElement('UM39', [FansMode.FansA], [new CpdlcMessageContentLevel(3)], CpdlcMessageExpectedResponseType.WilcoUnable, true)],
    UM46: [['CROSS %s AT %s'], new CpdlcMessageElement('UM46', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentPosition(1), new CpdlcMessageContentLevel(3)],
        CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM47: [['CROSS %s AT OR ABOVE %s'], new CpdlcMessageElement('UM47', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentPosition(1), new CpdlcMessageContentLevel(5)],
        CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM48: [['CROSS %s AT OR BELOW %s'], new CpdlcMessageElement('UM48', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentPosition(1), new CpdlcMessageContentLevel(5)],
        CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM49: [['CROSS %s AT AND MAINTAIN %s'], new CpdlcMessageElement('UM49', [FansMode.FansA], [new CpdlcMessageContentPosition(1), new CpdlcMessageContentLevel(5)],
        CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM50: [['CROSS %s BETWEEN %s AND %s'], new CpdlcMessageElement('UM50', [FansMode.FansA],
        [new CpdlcMessageContentPosition(1), new CpdlcMessageContentLevel(3), new CpdlcMessageContentLevel(5)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM51: [['CROSS %s AT %s'], new CpdlcMessageElement('UM51', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentPosition(1), new CpdlcMessageContentTime(3)],
        CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM52: [['CROSS %s AT OR BEFORE %s'], new CpdlcMessageElement('UM52', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentPosition(1), new CpdlcMessageContentTime(5)],
        CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM53: [['CROSS %s AT OR AFTER %s'], new CpdlcMessageElement('UM53', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentPosition(1), new CpdlcMessageContentTime(5)],
        CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM54: [['CROSS %s BETWEEN %s AND %s'], new CpdlcMessageElement('UM54', [FansMode.FansA, FansMode.FansB],
        [new CpdlcMessageContentPosition(1), new CpdlcMessageContentTime(3), new CpdlcMessageContentTime(5)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM55: [['CROSS %s AT %s'], new CpdlcMessageElement('UM55', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentPosition(1), new CpdlcMessageContentSpeed(3)],
        CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM56: [['CROSS %s AT OR LESS THAN %s'], new CpdlcMessageElement('UM56', [FansMode.FansA],
        [new CpdlcMessageContentPosition(1), new CpdlcMessageContentSpeed(6)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM57: [['CROSS %s AT OR GREATER THAN %s'], new CpdlcMessageElement('UM57', [FansMode.FansA],
        [new CpdlcMessageContentPosition(1), new CpdlcMessageContentSpeed(6)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM58: [['CROSS %s AT %s AT %s'], new CpdlcMessageElement('UM58', [FansMode.FansA],
        [new CpdlcMessageContentPosition(1), new CpdlcMessageContentTime(3), new CpdlcMessageContentLevel(5)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM59: [['CROSS %s AT OR BEFORE %s AT %s'], new CpdlcMessageElement('UM59', [FansMode.FansA],
        [new CpdlcMessageContentPosition(1), new CpdlcMessageContentTime(5), new CpdlcMessageContentLevel(7)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM60: [['CROSS %s AT OR AFTER %s AT %s'], new CpdlcMessageElement('UM60', [FansMode.FansA],
        [new CpdlcMessageContentPosition(1), new CpdlcMessageContentTime(5), new CpdlcMessageContentLevel(7)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM61: [['CROSS %s AT AND MAINTAIN %s AT %s'], new CpdlcMessageElement('UM61', [FansMode.FansA, FansMode.FansB],
        [new CpdlcMessageContentPosition(1), new CpdlcMessageContentLevel(5), new CpdlcMessageContentSpeed(7)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM62: [['AT %s CROSS %s AT AND MAINTAIN %s'], new CpdlcMessageElement('UM62', [FansMode.FansA],
        [new CpdlcMessageContentTime(1), new CpdlcMessageContentPosition(3), new CpdlcMessageContentLevel(7)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM63: [['AT %s CROSS %s AT AND MAINTAIN %s AT %s'], new CpdlcMessageElement('UM63', [FansMode.FansA],
        [new CpdlcMessageContentTime(1), new CpdlcMessageContentPosition(3), new CpdlcMessageContentLevel(7), new CpdlcMessageContentSpeed(9)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM64: [['OFFSET %s %s OF ROUTE'], new CpdlcMessageElement('UM64', [FansMode.FansA, FansMode.FansB],
        [new CpdlcMessageContentDistance(1), new CpdlcMessageContentDirection(2)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM65: [['AT %s OFFSET %s %s OF ROUTE'], new CpdlcMessageElement('UM65', [FansMode.FansA],
        [new CpdlcMessageContentPosition(1, true), new CpdlcMessageContentDistance(3), new CpdlcMessageContentDirection(4)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM66: [['AT %s OFFSET %s %s OF ROUTE'], new CpdlcMessageElement('UM66', [FansMode.FansA],
        [new CpdlcMessageContentTime(1, true), new CpdlcMessageContentDistance(3), new CpdlcMessageContentDirection(4)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM67: [['PROCEED BACK ON ROUTE'], new CpdlcMessageElement('UM67', [FansMode.FansA], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM68: [['REJOIN ROUTE BY %s'], new CpdlcMessageElement('UM68', [FansMode.FansA], [new CpdlcMessageContentPosition(3)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM69: [['REJOIN ROUTE BY %s'], new CpdlcMessageElement('UM69', [FansMode.FansA], [new CpdlcMessageContentTime(3)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM70: [['EXPECT BACK ON ROUTE BY %s'], new CpdlcMessageElement('UM70', [FansMode.FansA], [new CpdlcMessageContentPosition(5)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM71: [['EXPECT BACK ON ROUTE BY %s'], new CpdlcMessageElement('UM71', [FansMode.FansA], [new CpdlcMessageContentTime(5)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM72: [['RESUME OWN NAVIGATION'], new CpdlcMessageElement('UM72', [FansMode.FansA, FansMode.FansB], CpdlcMessageExpectedResponseType.WilcoUnable)],
    // UM73 for clearance skipped -> needs to be handled in DCL manager
    UM74: [['PROCEED DIRECT TO %s'], new CpdlcMessageElement('UM74', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentPosition(3)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM75: [['WHEN ABLE PROCEED DIRECT TO %s'], new CpdlcMessageElement('UM75', [FansMode.FansA], [new CpdlcMessageContentPosition(5)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM76: [['AT %s PROCEED DIRECT TO %s'], new CpdlcMessageElement('UM76', [FansMode.FansA], [new CpdlcMessageContentTime(1, true), new CpdlcMessageContentPosition(5)],
        CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM77: [['AT %s PROCEED DIRECT TO %s'], new CpdlcMessageElement('UM77', [FansMode.FansA], [new CpdlcMessageContentPosition(1, true), new CpdlcMessageContentPosition(5)],
        CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM78: [['AT %s PROCEED DIRECT TO %s'], new CpdlcMessageElement('UM78', [FansMode.FansA], [new CpdlcMessageContentLevel(1, true), new CpdlcMessageContentPosition(5)],
        CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM79: [['CLEARED TO %s VIA %s'], new CpdlcMessageElement('UM79', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentPosition(2), new CpdlcMessageContentFreetext(4, -1)],
        CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM80: [['CLEARED %s'], new CpdlcMessageElement('UM80', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentFreetext(1, -1)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM81: [['CLEARED %s'], new CpdlcMessageElement('UM81', [FansMode.FansA], [new CpdlcMessageContentProcedure(1)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM82: [['CLEARED TO DEVIATE UP TO %s %s OF ROUTE'], new CpdlcMessageElement('UM82', [FansMode.FansA, FansMode.FansB],
        [new CpdlcMessageContentDirection(5), new CpdlcMessageContentDistance(6)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM83: [['AT %s CLEARED %s'], new CpdlcMessageElement('UM83', [FansMode.FansA],
        [new CpdlcMessageContentPosition(1, true), new CpdlcMessageContentFreetext(3, -1)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM84: [['AT %s CLEARED %s'], new CpdlcMessageElement('UM84', [FansMode.FansA],
        [new CpdlcMessageContentPosition(1, true), new CpdlcMessageContentProcedure(3)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM85: [['EXPECT %s'], new CpdlcMessageElement('UM85', [FansMode.FansA], [new CpdlcMessageContentFreetext(1, -1)], CpdlcMessageExpectedResponseType.Roger)],
    UM86: [['AT %s EXPECT %s'], new CpdlcMessageElement('UM86', [FansMode.FansA],
        [new CpdlcMessageContentPosition(1), new CpdlcMessageContentFreetext(3, -1)], CpdlcMessageExpectedResponseType.Roger)],
    UM87: [['EXPECT DIRECT TO %s'], new CpdlcMessageElement('UM87', [FansMode.FansA], [new CpdlcMessageContentPosition(3)], CpdlcMessageExpectedResponseType.Roger)],
    UM88: [['AT %s EXPECT DIRECT TO %s'], new CpdlcMessageElement('UM88', [FansMode.FansA],
        [new CpdlcMessageContentPosition(1), new CpdlcMessageContentPosition(5)], CpdlcMessageExpectedResponseType.Roger)],
    UM89: [['AT %s EXPECT DIRECT TO %s'], new CpdlcMessageElement('UM89', [FansMode.FansA],
        [new CpdlcMessageContentTime(1), new CpdlcMessageContentPosition(5)], CpdlcMessageExpectedResponseType.Roger)],
    UM90: [['AT %s EXPECT DIRECT TO %s'], new CpdlcMessageElement('UM90', [FansMode.FansA],
        [new CpdlcMessageContentLevel(1), new CpdlcMessageContentPosition(5)], CpdlcMessageExpectedResponseType.Roger)],
    UM91: [['HOLD AT %s MAINTAIN %s INBOUND TRACK %s %s TURNS %s', 'HOLD AT %s MAINTAIN %s INBOUND TRACK %s %s TURN LEG TIME %s'], new CpdlcMessageElement('UM91', [FansMode.FansA],
        [new CpdlcMessageContentPosition(2), new CpdlcMessageContentLevel(4), new CpdlcMessageContentDegree(7), new CpdlcMessageContentDirection(8), new CpdlcMessageContentLegType(12)],
        CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM92: [['HOLD AT %s AS PUBLISHED MAINTAIN %s'], new CpdlcMessageElement('UM92', [FansMode.FansA, FansMode.FansB],
        [new CpdlcMessageContentPosition(2), new CpdlcMessageContentLevel(6)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM93: [['EXPECT FURTHER CLEARANCE AT %s'], new CpdlcMessageElement('UM93', [FansMode.FansA], [new CpdlcMessageContentTime(4)], CpdlcMessageExpectedResponseType.Roger)],
    UM94: [['TURN %s HEADING %s'], new CpdlcMessageElement('UM94', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentDirection(1), new CpdlcMessageContentDegree(3)],
        CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM95: [['TURN %s GROUND TRACK %s'], new CpdlcMessageElement('UM95', [FansMode.FansA], [new CpdlcMessageContentDirection(1), new CpdlcMessageContentDegree(4)],
        CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM96: [['CONTINUE PRESENT HEADING', 'FLY PRESENT HEADING'], new CpdlcMessageElement('UM96', [FansMode.FansA, FansMode.FansB], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM97: [['AT %s FLY HEADING %s'], new CpdlcMessageElement('UM97', [FansMode.FansA], [new CpdlcMessageContentPosition(1, true), new CpdlcMessageContentDegree(4)],
        CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM98: [['IMMEDIATELY TURN %s HEADING %s'], new CpdlcMessageElement('UM98', [FansMode.FansA], [new CpdlcMessageContentDirection(2), new CpdlcMessageContentDegree(4)],
        CpdlcMessageExpectedResponseType.WilcoUnable, true)],
    UM99: [['EXPECT %s'], new CpdlcMessageElement('UM99', [FansMode.FansA], [new CpdlcMessageContentProcedure(1)], CpdlcMessageExpectedResponseType.Roger)],
    UM100: [['AT %s EXPECT %s'], new CpdlcMessageElement('UM100', [FansMode.FansA], [new CpdlcMessageContentTime(1), new CpdlcMessageContentSpeed(3)], CpdlcMessageExpectedResponseType.Roger)],
    UM101: [['AT %s EXPECT %s'], new CpdlcMessageElement('UM101', [FansMode.FansA], [new CpdlcMessageContentPosition(1), new CpdlcMessageContentSpeed(3)],
        CpdlcMessageExpectedResponseType.Roger)],
    UM102: [['AT %s EXPECT %s'], new CpdlcMessageElement('UM102', [FansMode.FansA], [new CpdlcMessageContentLevel(1), new CpdlcMessageContentSpeed(3)],
        CpdlcMessageExpectedResponseType.Roger)],
    UM103: [['AT %s EXPECT %s TO %s'], new CpdlcMessageElement('UM103', [FansMode.FansA], [new CpdlcMessageContentTime(1), new CpdlcMessageContentSpeed(3), new CpdlcMessageContentSpeed(5)],
        CpdlcMessageExpectedResponseType.Roger)],
    UM104: [['AT %s EXPECT %s TO %s'], new CpdlcMessageElement('UM104', [FansMode.FansA],
        [new CpdlcMessageContentPosition(1), new CpdlcMessageContentSpeed(3), new CpdlcMessageContentSpeed(5)], CpdlcMessageExpectedResponseType.Roger)],
    UM105: [['AT %s EXPECT %s TO %s'], new CpdlcMessageElement('UM105', [FansMode.FansA], [new CpdlcMessageContentLevel(1), new CpdlcMessageContentSpeed(3), new CpdlcMessageContentSpeed(5)],
        CpdlcMessageExpectedResponseType.Roger)],
    UM106: [['MAINTAIN %s'], new CpdlcMessageElement('UM106', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentSpeed(1)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM107: [['MAINTAIN PRESENT SPEED'], new CpdlcMessageElement('UM107', [FansMode.FansA, FansMode.FansB], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM108: [['MAINTAIN %s OR GREATER'], new CpdlcMessageElement('UM108', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentSpeed(1)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM109: [['MAINTAIN %s OR LESS'], new CpdlcMessageElement('UM109', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentSpeed(1)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM110: [['MAINTAIN %s TO %s'], new CpdlcMessageElement('UM110', [FansMode.FansA], [new CpdlcMessageContentSpeed(1), new CpdlcMessageContentSpeed(3)],
        CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM111: [['INCREASE SPEED TO %s'], new CpdlcMessageElement('UM111', [FansMode.FansA], [new CpdlcMessageContentSpeed(3)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM112: [['INCREASE SPEED TO %s OR GREATER'], new CpdlcMessageElement('UM112', [FansMode.FansA], [new CpdlcMessageContentSpeed(3)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM113: [['REDUCE SPEED TO %s'], new CpdlcMessageElement('UM113', [FansMode.FansA], [new CpdlcMessageContentSpeed(3)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM114: [['REDUCE SPEED TO %s OR LESS'], new CpdlcMessageElement('UM114', [FansMode.FansA], [new CpdlcMessageContentSpeed(3)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM115: [['DO NOT EXCEED %s'], new CpdlcMessageElement('UM115', [FansMode.FansA], [new CpdlcMessageContentSpeed(3)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM116: [['RESUME NORMAL SPEED'], new CpdlcMessageElement('UM116', [FansMode.FansA, FansMode.FansB], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM117: [['CONTACT %s %s'], new CpdlcMessageElement('UM117', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentAtcUnit(1), new CpdlcMessageContentFrequency(2)],
        CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM118: [['AT %s CONTACT %s %s'], new CpdlcMessageElement('UM118', [FansMode.FansA],
        [new CpdlcMessageContentPosition(1, true), new CpdlcMessageContentAtcUnit(3), new CpdlcMessageContentFrequency(4)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM119: [['AT %s CONTACT %s %s'], new CpdlcMessageElement('UM119', [FansMode.FansA],
        [new CpdlcMessageContentTime(1, true), new CpdlcMessageContentAtcUnit(3), new CpdlcMessageContentFrequency(4)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM120: [['MONITOR %s %s'], new CpdlcMessageElement('UM120', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentAtcUnit(1), new CpdlcMessageContentFrequency(2)],
        CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM121: [['AT %s MONITOR %s %s'], new CpdlcMessageElement('UM121', [FansMode.FansA],
        [new CpdlcMessageContentPosition(1, true), new CpdlcMessageContentAtcUnit(3), new CpdlcMessageContentFrequency(4)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM122: [['AT %s MONITOR %s %s'], new CpdlcMessageElement('UM122', [FansMode.FansA],
        [new CpdlcMessageContentTime(1, true), new CpdlcMessageContentAtcUnit(3), new CpdlcMessageContentFrequency(4)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM123: [['SQUAWK %s'], new CpdlcMessageElement('UM123', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentSquawk(1)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM124: [['STOP SQUAWK'], new CpdlcMessageElement('UM124', [FansMode.FansA], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM125: [['SQUAWK MODE CHARLIE', 'SQUAWK ALTITUDE'], new CpdlcMessageElement('UM125', [FansMode.FansA], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM126: [['STOP SQUAWK MODE CHARLIE', 'STOP SQUAWK ALTITUDE'], new CpdlcMessageElement('UM126', [FansMode.FansA], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM127: [['REPORT BACK ON ROUTE'], new CpdlcMessageElement('UM127', [FansMode.FansA], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM128: [['REPORT LEAVING %s'], new CpdlcMessageElement('UM128', [FansMode.FansA], [new CpdlcMessageContentLevel(2, true)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM129: [['REPORT MAINTAINING %s', 'REPORT LEVEL %s'], new CpdlcMessageElement('UM129', [FansMode.FansA], [new CpdlcMessageContentLevel(2, true)],
        CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM130: [['REPORT PASSING %s'], new CpdlcMessageElement('UM130', [FansMode.FansA], [new CpdlcMessageContentPosition(2, true)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM131: [['REPORT REMAINING FUEL AND PERSONS ON BOARD', 'REPORT REMAINING FUEL AND SOULS ON BOARD'], new CpdlcMessageElement('UM131', [FansMode.FansA],
        CpdlcMessageExpectedResponseType.Yes, true)],
    UM132: [['REPORT POSITION', 'CONFIRM POSITION'], new CpdlcMessageElement('UM132', [FansMode.FansA], CpdlcMessageExpectedResponseType.Yes)],
    UM133: [['REPORT PRESENT LEVEL'], new CpdlcMessageElement('UM133', [FansMode.FansA], CpdlcMessageExpectedResponseType.Yes)],
    UM134: [['REPORT SPEED', 'CONFIRM SPEED'], new CpdlcMessageElement('UM134', [FansMode.FansA], CpdlcMessageExpectedResponseType.Yes)],
    UM135: [['CONFIRM ASSIGNED LEVEL'], new CpdlcMessageElement('UM135', [FansMode.FansA, FansMode.FansB], CpdlcMessageExpectedResponseType.Yes)],
    UM136: [['CONFIRM ASSIGNED SPEED'], new CpdlcMessageElement('UM136', [FansMode.FansA], CpdlcMessageExpectedResponseType.Yes)],
    UM137: [['CONFIRM ASSIGNED ROUTE'], new CpdlcMessageElement('UM137', [FansMode.FansA], CpdlcMessageExpectedResponseType.Yes)],
    UM138: [['CONFIRM TIME OVER REPORTED WAYPOINT'], new CpdlcMessageElement('UM138', [FansMode.FansA], CpdlcMessageExpectedResponseType.Yes)],
    UM139: [['CONFIRM REPORTED WAYPOINT'], new CpdlcMessageElement('UM139', [FansMode.FansA], CpdlcMessageExpectedResponseType.Yes)],
    UM140: [['CONFIRM NEXT WAYPOINT'], new CpdlcMessageElement('UM140', [FansMode.FansA], CpdlcMessageExpectedResponseType.Yes)],
    UM141: [['CONFIRM NEXT WAYPOINT ETA'], new CpdlcMessageElement('UM141', [FansMode.FansA], CpdlcMessageExpectedResponseType.Yes)],
    UM142: [['CONFIRM ENSUING WAYPOINT'], new CpdlcMessageElement('UM142', [FansMode.FansA], CpdlcMessageExpectedResponseType.Yes)],
    UM143: [['CONFIRM REQUEST'], new CpdlcMessageElement('UM143', [FansMode.FansA], CpdlcMessageExpectedResponseType.Yes)],
    UM144: [['CONFIRM SQUAWK'], new CpdlcMessageElement('UM144', [FansMode.FansA], CpdlcMessageExpectedResponseType.Yes)],
    UM145: [['REPORT HEADING', 'CONFIRM HEADING'], new CpdlcMessageElement('UM145', [FansMode.FansA], CpdlcMessageExpectedResponseType.Yes)],
    UM146: [['REPORT GROUND TRACK', 'CONFIRM GROUND TRACK'], new CpdlcMessageElement('UM146', [FansMode.FansA], CpdlcMessageExpectedResponseType.Yes)],
    UM147: [['REQUEST POSITION REPORT'], new CpdlcMessageElement('UM147', [FansMode.FansA], CpdlcMessageExpectedResponseType.Yes)],
    UM148: [['WHEN CAN YOU ACCEPT %s'], new CpdlcMessageElement('UM148', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentLevel(4)], CpdlcMessageExpectedResponseType.Yes)],
    UM149: [['CAN YOU ACCEPT %s AT %s'], new CpdlcMessageElement('UM149', [FansMode.FansA], [new CpdlcMessageContentLevel(3), new CpdlcMessageContentPosition(5)],
        CpdlcMessageExpectedResponseType.AffirmNegative)],
    UM150: [['CAN YOU ACCEPT %s AT %s'], new CpdlcMessageElement('UM150', [FansMode.FansA], [new CpdlcMessageContentLevel(3), new CpdlcMessageContentTime(5)],
        CpdlcMessageExpectedResponseType.AffirmNegative)],
    UM151: [['WHEN CAN YOU ACCEPT %s'], new CpdlcMessageElement('UM151', [FansMode.FansA], [new CpdlcMessageContentSpeed(4)], CpdlcMessageExpectedResponseType.Yes)],
    UM152: [['WHEN CAN YOU ACCEPT %s %s OFFSET'], new CpdlcMessageElement('UM152', [FansMode.FansA], [new CpdlcMessageContentDistance(4), new CpdlcMessageContentDirection(5)],
        CpdlcMessageExpectedResponseType.Yes)],
    UM153: [['ALTIMETER %s', 'QNH %s'], new CpdlcMessageElement('UM153', [FansMode.FansA], [new CpdlcMessageContentAltimeter(1)], CpdlcMessageExpectedResponseType.Roger)],
    UM154: [['RADAR SERVICE TERMINATED', 'RADAR SERVICES TERMINATED'], new CpdlcMessageElement('UM154', [FansMode.FansA], CpdlcMessageExpectedResponseType.Roger)],
    UM155: [['RADAR CONTACT %s'], new CpdlcMessageElement('UM155', [FansMode.FansA], [new CpdlcMessageContentPosition(2)], CpdlcMessageExpectedResponseType.Roger)],
    UM156: [['RADAR CONTACT LOST'], new CpdlcMessageElement('UM156', [FansMode.FansA], CpdlcMessageExpectedResponseType.Roger)],
    UM157: [['CHECK STUCK MICROPHONE %s'], new CpdlcMessageElement('UM157', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentFrequency(3)],
        CpdlcMessageExpectedResponseType.Roger, true)],
    UM158: [['ATIS %s'], new CpdlcMessageElement('UM158', [FansMode.FansA], [new CpdlcMessageContentAtis(1)], CpdlcMessageExpectedResponseType.Roger)],
    UM159: [['ERROR %s'], new CpdlcMessageElement('UM159', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentFreetext(1, -1)], CpdlcMessageExpectedResponseType.NotRequired)],
    UM160: [['NEXT DATA AUTHORITY %s'], new CpdlcMessageElement('UM160', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentAtcUnit(3)], CpdlcMessageExpectedResponseType.NotRequired)],
    UM161: [['END SERVICE'], new CpdlcMessageElement('UM161', [FansMode.FansA], CpdlcMessageExpectedResponseType.NotRequired)],
    UM162: [['MESSAGE NOT SUPPORTED BY THIS ATS UNIT', 'SERVICE UNAVAILABLE'], new CpdlcMessageElement('UM162', [FansMode.FansA, FansMode.FansB],
        CpdlcMessageExpectedResponseType.NotRequired)],
    UM168: [['DISREGARD'], new CpdlcMessageElement('UM168', [FansMode.FansA], CpdlcMessageExpectedResponseType.Roger)],
    UM169: [['%s'], new CpdlcMessageElement('UM169', [FansMode.FansA], [new CpdlcMessageContentFreetext(0, -1)], CpdlcMessageExpectedResponseType.Roger)],
    UM171: [['CLIMB AT %s MINIMUM'], new CpdlcMessageElement('UM171', [FansMode.FansA, FansMode.FansB],
        [new CpdlcMessageContentVerticalRate(2)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM172: [['CLIMB AT %s MAXIMUM'], new CpdlcMessageElement('UM172', [FansMode.FansA, FansMode.FansB],
        [new CpdlcMessageContentVerticalRate(2)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM173: [['DESCEND AT %s MINIMUM'], new CpdlcMessageElement('UM173', [FansMode.FansA, FansMode.FansB],
        [new CpdlcMessageContentVerticalRate(2)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM174: [['DESCEND AT %s MAXIMUM'], new CpdlcMessageElement('UM174', [FansMode.FansA, FansMode.FansB],
        [new CpdlcMessageContentVerticalRate(2)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM175: [['REPORT REACHING %s'], new CpdlcMessageElement('UM175', [FansMode.FansA], [new CpdlcMessageContentLevel(2, true)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM176: [['MAINTAIN OWN SEPARATION AND VMC'], new CpdlcMessageElement('UM176', [FansMode.FansA], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM177: [['AT PILOTS DISCRETION'], new CpdlcMessageElement('UM177', [FansMode.FansA], CpdlcMessageExpectedResponseType.No)],
    UM179: [['SQUAWK IDENT'], new CpdlcMessageElement('UM179', [FansMode.FansA, FansMode.FansB], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM180: [['REPORT REACHING BLOCK %s TO %s'], new CpdlcMessageElement('UM180', [FansMode.FansA], [new CpdlcMessageContentLevel(3, true), new CpdlcMessageContentLevel(5, true)],
        CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM181: [['REPORT DISTANCE TO %s', 'REPORT DISTANCE FROM %s'], new CpdlcMessageElement('UM181', [FansMode.FansA], [new CpdlcMessageContentPosition(3)],
        CpdlcMessageExpectedResponseType.Yes)],
    UM182: [['CONFIRM ATIS CODE'], new CpdlcMessageElement('UM182', [FansMode.FansA], CpdlcMessageExpectedResponseType.Yes)],
    UM183: [['%s'], new CpdlcMessageElement('UM183', [FansMode.FansB], [new CpdlcMessageContentFreetext(0, -1)], CpdlcMessageExpectedResponseType.Roger)],
    UM184: [['AT TIME %s REPORT DISTANCE TO %s', 'AT TIME %s REPORT DISTANCE FROM %s'], new CpdlcMessageElement('UM184', [FansMode.FansA],
        [new CpdlcMessageContentTime(2, true), new CpdlcMessageContentPosition(6)], CpdlcMessageExpectedResponseType.Yes)],
    UM190: [['FLY HEADING %s'], new CpdlcMessageElement('UM190', [FansMode.FansB], [new CpdlcMessageContentDegree(2)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM213: [['%s ALTIMETER %s', '%s QNH %s'], new CpdlcMessageElement('UM213', [FansMode.FansA, FansMode.FansB],
        [new CpdlcMessageContentPosition(0), new CpdlcMessageContentAltimeter(2)], CpdlcMessageExpectedResponseType.Roger)],
    UM215: [['TURN %s %s DEGREES'], new CpdlcMessageElement('UM215', [FansMode.FansB], [new CpdlcMessageContentDirection(1), new CpdlcMessageContentDegree(2)],
        CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM222: [['NO SPEED RESTRICTION'], new CpdlcMessageElement('UM222', [FansMode.FansA, FansMode.FansB], CpdlcMessageExpectedResponseType.Roger)],
    UM227: [['LOGICAL ACKNOWLEDGEMENT'], new CpdlcMessageElement('UM227', [FansMode.FansB], CpdlcMessageExpectedResponseType.Roger)],
    UM228: [['REPORT ETA %s'], new CpdlcMessageElement('UM228', [FansMode.FansA], [new CpdlcMessageContentPosition(2)], CpdlcMessageExpectedResponseType.Yes)],
    UM231: [['STATE PREFERRED LEVEL'], new CpdlcMessageElement('UM231', [FansMode.FansA, FansMode.FansB], CpdlcMessageExpectedResponseType.Yes)],
    UM232: [['STATE TOP OF DESCENT'], new CpdlcMessageElement('UM232', [FansMode.FansA, FansMode.FansB], CpdlcMessageExpectedResponseType.Yes)],
    UM242: [['TRANSMIT ADS-B IDENT'], new CpdlcMessageElement('UM242', [FansMode.FansA], CpdlcMessageExpectedResponseType.Roger)],
    UM244: [['IDENTIFICATION TERMINATED'], new CpdlcMessageElement('UM244', [FansMode.FansA], CpdlcMessageExpectedResponseType.Roger)],
    UM9995: [['LOGOFF'], new CpdlcMessageElement('UM9995', [FansMode.FansA, FansMode.FansB], CpdlcMessageExpectedResponseType.NotRequired)],
    UM9996: [['UNABLE %s'], new CpdlcMessageElement('UM9996', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentFreetext(1, -1)], CpdlcMessageExpectedResponseType.NotRequired)],
    UM9997: [['LOGON ACCEPTED'], new CpdlcMessageElement('UM9997', [FansMode.FansA, FansMode.FansB], CpdlcMessageExpectedResponseType.NotRequired)],
    UM9998: [['HANDOVER %s'], new CpdlcMessageElement('UM9998', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentAtcUnit(1)], CpdlcMessageExpectedResponseType.NotRequired)],
    UM9999: [['CURRENT ATC %s'], new CpdlcMessageElement('UM9999', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentFreetext(2, -1)], CpdlcMessageExpectedResponseType.NotRequired)],
};
