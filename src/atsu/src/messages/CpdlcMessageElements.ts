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
    Freetext
}

export abstract class CpdlcMessageContent {
    public Type: CpdlcMessageContentType = CpdlcMessageContentType.Unknown;

    public IndexStart: number = -1;

    public IndexEnd: number = -1;

    public Value: string = '';

    public constructor(type: CpdlcMessageContentType, ...args: number[]) {
        this.Type = type;

        this.IndexStart = args[0];
        if (args.length === 2) {
            this.IndexEnd = args[1];
        }
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
    }
}

export class CpdlcMessageContentLevel extends CpdlcMessageContent {
    public constructor(...args: number[]) {
        if (args.length === 2) {
            super(CpdlcMessageContentType.Level, args[0], args[1]);
        } else {
            super(CpdlcMessageContentType.Level, args[0]);
        }
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
    public constructor(index: number) {
        super(CpdlcMessageContentType.Position, index);
    }

    public validateAndReplaceContent(value: string[]): { matched: boolean, remaining: string[] } {
        let retval = false;
        if (this.IndexStart < value.length && this.IndexStart > -1) {
            if (InputValidation.validateScratchpadWaypoint(value[this.IndexStart]) === AtsuStatusCodes.Ok) {
                this.Value = value[this.IndexStart];
                value[this.IndexStart] = '%s';
                retval = true;
            }
        }
        return { matched: retval, remaining: value };
    }
}

export class CpdlcMessageContentTime extends CpdlcMessageContent {
    public constructor(index: number) {
        super(CpdlcMessageContentType.Time, index);
    }

    public validateAndReplaceContent(value: string[]): { matched: boolean, remaining: string[] } {
        let retval = false;
        if (this.IndexStart < value.length && this.IndexStart > -1) {
            if (InputValidation.validateScratchpadTime(value[this.IndexStart]) === AtsuStatusCodes.Ok) {
                this.Value = value[this.IndexStart];
                value[this.IndexStart] = '%s';
                retval = true;
            }
        }
        return { matched: retval, remaining: value };
    }
}

export class CpdlcMessageContentDirection extends CpdlcMessageContent {
    public constructor(index: number) {
        super(CpdlcMessageContentType.Direction, index);
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
    public constructor(index: number) {
        super(CpdlcMessageContentType.Direction, index);
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
    public constructor(index: number) {
        super(CpdlcMessageContentType.Speed, index);
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
    public constructor(index: number) {
        super(CpdlcMessageContentType.Frequency, index);
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
    public constructor(index: number) {
        super(CpdlcMessageContentType.Procedure, index);
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
    public constructor(index: number) {
        super(CpdlcMessageContentType.Degree, index);
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
    public constructor(index: number) {
        super(CpdlcMessageContentType.VerticalRate, index);
    }

    public validateAndReplaceContent(value: string[]): boolean {
        if (this.IndexStart + 3 < value.length && this.IndexStart > -1) {
            if (value[this.IndexStart + 1] !== 'FEET' || value[this.IndexStart + 2] !== 'PER' || value[this.IndexStart + 3] !== 'MINUTE') {
                return false;
            }

            this.Value = `${value[this.IndexStart]} FEET PER MINUTE`;
            value[this.IndexStart] = '%s';
            value[this.IndexStart + 1] = '%s';
            value[this.IndexStart + 2] = '%s';
            value[this.IndexStart + 3] = '%s';

            return true;
        }
        return false;
    }
}

export class CpdlcMessageContentAtcUnit extends CpdlcMessageContent {
    public constructor(indexStart: number) {
        super(CpdlcMessageContentType.AtcUnit, indexStart);
    }

    public validateAndReplaceContent(value: string[]): { matched: boolean, remaining: string[] } {
        let retval = false;
        if (this.IndexStart < value.length && this.IndexStart > -1 && /^[0-9A-Z]{4}$/.test(value[this.IndexStart])) {
            this.Value = value[this.IndexStart];
            value[this.IndexStart] = '%s';
            retval = true;
        }
        return { matched: retval, remaining: value };
    }
}

export class CpdlcMessageContentSquawk extends CpdlcMessageContent {
    public constructor(indexStart: number) {
        super(CpdlcMessageContentType.Squawk, indexStart);
    }

    public validateAndReplaceContent(value: string[]): boolean {
        if (this.IndexStart < value.length && this.IndexStart > -1 && /^[0-9]{4}$/.test(value[this.IndexStart])) {
            const squawk = parseInt(value[this.IndexStart]);
            if (squawk >= 0 && squawk < 7777) {
                this.Value = value[this.IndexStart];
                value[this.IndexStart] = '%s';
                return true;
            }
        }
        return false;
    }
}

export class CpdlcMessageContentFreetext extends CpdlcMessageContent {
    public constructor(indexStart: number, indexEnd: number) {
        super(CpdlcMessageContentType.Freetext, indexStart, indexEnd);
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
    public constructor(index: number) {
        super(CpdlcMessageContentType.LegTypeDistance, index);
    }

    public validateAndReplaceContent(value: string[]): boolean {
        if (this.IndexStart < value.length && this.IndexStart > -1) {
            if (/^[0-9]{1,2}$/.test(value[this.IndexStart])) {
                const distance = parseInt(value[this.IndexStart]);
                if (distance >= 1 && distance < 100) {
                    this.Value = value[this.IndexStart];
                    value[this.IndexStart] = '%s';
                    return true;
                }
            }
        }
        return false;
    }
}

export class CpdlcMessageContentLegTypeTime extends CpdlcMessageContent {
    public constructor(index: number) {
        super(CpdlcMessageContentType.LegTypeTime, index);
    }

    public validateAndReplaceContent(value: string[]): boolean {
        if (this.IndexStart + 1 < value.length && this.IndexStart > -1 && /^[0-9]{1}$/.test(value[this.IndexStart])) {
            if (value[this.IndexStart + 1] === 'MIN' || value[this.IndexStart + 1] === 'MINS' || value[this.IndexStart + 1] === 'MINUTES') {
                const minutes = parseInt(value[this.IndexStart]);
                if (minutes >= 1 && minutes < 10) {
                    this.Value = value[this.IndexStart];
                    value[this.IndexStart] = '%s';
                    return true;
                }
            }
        }
        return false;
    }
}

export class CpdlcMessageContentLegType extends CpdlcMessageContent {
    private legDistance: CpdlcMessageContentLegTypeDistance;

    private legTime: CpdlcMessageContentLegTypeTime;

    public constructor(index: number) {
        super(CpdlcMessageContentType.LegType, index);

        this.legDistance = new CpdlcMessageContentLegTypeDistance(index);
        this.legTime = new CpdlcMessageContentLegTypeTime(index);
    }

    public validateAndReplaceContent(value: string[]): boolean {
        if (this.legTime.validateAndReplaceContent(value) === true) {
            return true;
        }
        return this.legDistance.validateAndReplaceContent(value);
    }
}

export class CpdlcMessageContentAltimeter extends CpdlcMessageContent {
    public constructor(index: number) {
        super(CpdlcMessageContentType.Altimeter, index);
    }

    public validateAndReplaceContent(value: string[]): boolean {
        if (this.IndexStart >= 1 && this.IndexStart < value.length && this.IndexStart > -1) {
            let retval = false;

            if (value[this.IndexStart - 1] === 'ALTIMETER' && /^[0-9]{2}\.[0-9]{2}$/.test(value[this.IndexStart])) {
                retval = true;
            } else if (value[this.IndexStart - 1] === 'QNH' && /^[0-9]{3,4}$/.test(value[this.IndexStart])) {
                retval = true;
            }

            if (retval === true) {
                this.Value = value[this.IndexStart];
                value[this.IndexStart] = '%s';
            }

            return retval;
        }
        return false;
    }
}

export class CpdlcMessageContentAtis extends CpdlcMessageContent {
    public constructor(index: number) {
        super(CpdlcMessageContentType.Atis, index);
    }

    public validateAndReplaceContent(value: string[]): boolean {
        if (this.IndexStart < value.length && this.IndexStart > -1) {
            if (/^[A-Z]{1}$/.test(value[this.IndexStart])) {
                this.Value = value[this.IndexStart];
                value[this.IndexStart] = '%s';
                return true;
            }
        }
        return false;
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
    DM27: [['REQUEST WEATHER DEVIATION UP TO %s %s OF ROUTE'], new CpdlcMessageElement('DM27', [FansMode.FansA, FansMode.FansB],
        [new CpdlcMessageContentDistance(5), new CpdlcMessageContentDirection(6)], CpdlcMessageExpectedResponseType.Yes)],
    DM49: [['WHEN CAN WE EXCEPT %s'], new CpdlcMessageElement('DM49', [FansMode.FansA], [new CpdlcMessageContentSpeed(4)], CpdlcMessageExpectedResponseType.Yes)],
    DM50: [['WHEN CAN WE EXCEPT %s TO %s'], new CpdlcMessageElement('DM50', [FansMode.FansA], [new CpdlcMessageContentSpeed(4), new CpdlcMessageContentSpeed(6)],
        CpdlcMessageExpectedResponseType.Yes)],
    DM51: [['WHEN CAN WE EXPECT BACK ON ROUTE'], new CpdlcMessageElement('DM51', [FansMode.FansA], CpdlcMessageExpectedResponseType.Yes)],
    DM52: [['WHEN CAN WE EXPECT LOWER LEVEL', 'WHEN CAN WE EXPECT LOWER ALTITUDE'], new CpdlcMessageElement('DM52', [FansMode.FansA], CpdlcMessageExpectedResponseType.Yes)],
    DM53: [['WHEN CAN WE EXPECT HIGHER LEVEL', 'WHEN CAN WE EXPECT HIGHER ALTITUDE'], new CpdlcMessageElement('DM53', [FansMode.FansA], CpdlcMessageExpectedResponseType.Yes)],
    DM54: [['WHEN CAN WE EXPECT CRUISE CLIMB TO %s'], new CpdlcMessageElement('DM54', [FansMode.FansA], [new CpdlcMessageContentLevel(7)], CpdlcMessageExpectedResponseType.Yes)],
    DM65: [['DUE TO WEATHER'], new CpdlcMessageElement('DM65', [FansMode.FansA, FansMode.FansB], CpdlcMessageExpectedResponseType.No)],
    DM66: [['DUE TO AIRCRAFT PERFORMANCE'], new CpdlcMessageElement('DM66', [FansMode.FansA, FansMode.FansB], CpdlcMessageExpectedResponseType.No)],
    DM67: [['%s'], new CpdlcMessageElement('DM67', [FansMode.FansA], [new CpdlcMessageContentFreetext(0, -1)], CpdlcMessageExpectedResponseType.No)],
    DM68: [['%s'], new CpdlcMessageElement('DM68', [FansMode.FansA], true, [new CpdlcMessageContentFreetext(0, -1)], CpdlcMessageExpectedResponseType.Yes)],
    DM69: [['REQUEST VMC DESCEND'], new CpdlcMessageElement('DM69', [FansMode.FansA], CpdlcMessageExpectedResponseType.Yes)],
    DM70: [['REQUEST HEADING %s'], new CpdlcMessageElement('DM70', [FansMode.FansA], [new CpdlcMessageContentDegree(2)], CpdlcMessageExpectedResponseType.Yes)],
    DM71: [['REQUEST GROUND TRACK %s'], new CpdlcMessageElement('DM71', [FansMode.FansA], [new CpdlcMessageContentDegree(3)], CpdlcMessageExpectedResponseType.Yes)],
    DM74: [['REQUEST TO MAINTAIN OWN SEPARATION AND VMC'], new CpdlcMessageElement('DM74', [FansMode.FansA], CpdlcMessageExpectedResponseType.Yes)],
    DM75: [['AT PILOTS DISCRETION'], new CpdlcMessageElement('DM75', [FansMode.FansA], CpdlcMessageExpectedResponseType.Yes)],
    DM87: [['WHEN CAN WE EXPECT CLIMB TO %s'], new CpdlcMessageElement('DM87', [FansMode.FansA], [new CpdlcMessageContentLevel(6)], CpdlcMessageExpectedResponseType.Yes)],
    DM88: [['WHEN CAN WE EXPECT DESCEND TO %s'], new CpdlcMessageElement('DM88', [FansMode.FansA], [new CpdlcMessageContentLevel(6)], CpdlcMessageExpectedResponseType.Yes)],
    DM98: [['%s'], new CpdlcMessageElement('DM98', [FansMode.FansB], [new CpdlcMessageContentFreetext(0, -1)], CpdlcMessageExpectedResponseType.No)],
    DM9998: [['REQUEST LOGON'], new CpdlcMessageElement('DM9998', [FansMode.FansA, FansMode.FansB], CpdlcMessageExpectedResponseType.Yes)],
    DM9999: [['LOGOFF'], new CpdlcMessageElement('DM9999', [FansMode.FansA, FansMode.FansB], CpdlcMessageExpectedResponseType.No)],
};

export const CpdlcMessagesUplink: { [identification: string]: [string[], CpdlcMessageElement] } = {
    UM0: [['UNABLE'], new CpdlcMessageElement('UM0', [FansMode.FansA, FansMode.FansB])],
    UM1: [['STANDBY'], new CpdlcMessageElement('UM1', [FansMode.FansA, FansMode.FansB])],
    UM3: [['ROGER'], new CpdlcMessageElement('UM3', [FansMode.FansA, FansMode.FansB])],
    UM4: [['AFFIRM'], new CpdlcMessageElement('UM4', [FansMode.FansA, FansMode.FansB])],
    UM5: [['NEGATIVE'], new CpdlcMessageElement('UM5', [FansMode.FansA, FansMode.FansB])],
    UM19: [['MAINTAIN %s'], new CpdlcMessageElement('UM19', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentLevel(1)],
        CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM20: [['CLIMB TO %s', 'CLIMB TO AND MAINTAIN %s'], new CpdlcMessageElement('UM20', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentLevel(2, 4)],
        CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM23: [['DESCEND TO %s', 'DESCEND TO AND MAINTAIN %s'], new CpdlcMessageElement('UM23', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentLevel(2, 4)],
        CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM29: [['DESCEND TO REACH %s BY %s'], new CpdlcMessageElement('UM29', [FansMode.FansA, FansMode.FansB],
        [new CpdlcMessageContentLevel(3), new CpdlcMessageContentPosition(5)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM74: [['PROCEED DIRECT TO %s'], new CpdlcMessageElement('UM74', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentPosition(3)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM94: [['TURN %s HEADING %s'], new CpdlcMessageElement('UM94', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentDirection(1), new CpdlcMessageContentDegree(3)],
        CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM95: [['TURN %s GROUND TRACK %s'], new CpdlcMessageElement('UM95', [FansMode.FansA], [new CpdlcMessageContentDirection(1), new CpdlcMessageContentDegree(4)],
        CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM96: [['CONTINUE PRESENT HEADING', 'FLY PRESENT HEADING'], new CpdlcMessageElement('UM96', [FansMode.FansA, FansMode.FansB], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM106: [['MAINTAIN %s'], new CpdlcMessageElement('UM106', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentSpeed(1)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM107: [['MAINTAIN PRESENT SPEED'], new CpdlcMessageElement('UM107', [FansMode.FansA, FansMode.FansB], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM108: [['MAINTAIN %s OR GREATER'], new CpdlcMessageElement('UM108', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentSpeed(1)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM109: [['MAINTAIN %s OR LESS'], new CpdlcMessageElement('UM109', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentSpeed(1)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM111: [['INCREASE SPEED TO %s'], new CpdlcMessageElement('UM111', [FansMode.FansA], [new CpdlcMessageContentSpeed(3)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM112: [['INCREASE SPEED TO %s OR GREATER'], new CpdlcMessageElement('UM112', [FansMode.FansA], [new CpdlcMessageContentSpeed(3)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM113: [['REDUCE SPEED TO %s'], new CpdlcMessageElement('UM113', [FansMode.FansA], [new CpdlcMessageContentSpeed(3)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM114: [['REDUCE SPEED TO %s OR LESS'], new CpdlcMessageElement('UM114', [FansMode.FansA], [new CpdlcMessageContentSpeed(3)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM116: [['RESUME NORMAL SPEED'], new CpdlcMessageElement('UM116', [FansMode.FansA, FansMode.FansB], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM117: [['CONTACT %s'], new CpdlcMessageElement('UM117', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentFreetext(1, -1)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM118: [['AT %s CONTACT %s'], new CpdlcMessageElement('UM117', [FansMode.FansA], [new CpdlcMessageContentPosition(1), new CpdlcMessageContentFreetext(3, -1)],
        CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM120: [['MONITOR %s'], new CpdlcMessageElement('UM120', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentFreetext(1, -1)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM121: [['AT %s MONITOR %s'], new CpdlcMessageElement('UM121', [FansMode.FansA], [new CpdlcMessageContentPosition(1), new CpdlcMessageContentFreetext(3, -1)],
        CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM169: [['%s'], new CpdlcMessageElement('UM169', [FansMode.FansA], [new CpdlcMessageContentFreetext(0, -1)], CpdlcMessageExpectedResponseType.Roger)],
    UM183: [['%s'], new CpdlcMessageElement('UM183', [FansMode.FansB], [new CpdlcMessageContentFreetext(0, -1)], CpdlcMessageExpectedResponseType.Roger)],
    UM190: [['FLY HEADING %s'], new CpdlcMessageElement('UM190', [FansMode.FansB], [new CpdlcMessageContentDegree(2)], CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM215: [['TURN %s %s DEGREES'], new CpdlcMessageElement('UM215', [FansMode.FansB], [new CpdlcMessageContentDirection(1), new CpdlcMessageContentDegree(2)],
        CpdlcMessageExpectedResponseType.WilcoUnable)],
    UM222: [['NO SPEED RESTRICTION'], new CpdlcMessageElement('UM222', [FansMode.FansA, FansMode.FansB], CpdlcMessageExpectedResponseType.Roger)],
    UM9995: [['LOGOFF'], new CpdlcMessageElement('UM9995', [FansMode.FansA, FansMode.FansB], CpdlcMessageExpectedResponseType.NotRequired)],
    UM9996: [['UNABLE %s'], new CpdlcMessageElement('UM9996', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentFreetext(1, -1)], CpdlcMessageExpectedResponseType.NotRequired)],
    UM9997: [['LOGON ACCEPTED'], new CpdlcMessageElement('UM9997', [FansMode.FansA, FansMode.FansB], CpdlcMessageExpectedResponseType.NotRequired)],
    UM9998: [['HANDOVER %s'], new CpdlcMessageElement('UM9998', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentAtcUnit(1)], CpdlcMessageExpectedResponseType.NotRequired)],
    UM9999: [['CURRENT ATC %s'], new CpdlcMessageElement('UM9999', [FansMode.FansA, FansMode.FansB], [new CpdlcMessageContentFreetext(2, -1)], CpdlcMessageExpectedResponseType.NotRequired)],
};
