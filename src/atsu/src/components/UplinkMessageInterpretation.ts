import { coordinateToString, timestampToString } from '../Common';
import { InputValidation } from '../InputValidation';
import { CpdlcMessagesDownlink } from '../messages/CpdlcMessageElements';
import { Atsu } from '../ATSU';
import { CpdlcMessage } from '../messages/CpdlcMessage';

export class UplinkMessageInterpretation {
    private static NonAutomaticClosingMessage: string[] = [
        'UM127', 'UM128', 'UM129', 'UM130', 'UM131', 'UM132', 'UM133', 'UM134', 'UM135', 'UM136',
        'UM137', 'UM138', 'UM139', 'UM140', 'UM141', 'UM142', 'UM143', 'UM144', 'UM145', 'UM146',
        'UM147', 'UM148', 'UM151', 'UM152', 'UM180', 'UM181', 'UM182', 'UM228', 'UM231', 'UM232',
    ];

    private static RequestMessages: string[] = [
        'DM15', 'DM16', 'DM17', 'DM18', 'DM19', 'DM20', 'DM21', 'DM22', 'DM23', 'DM24', 'DM25', 'DM26', 'DM27',
        'DM51', 'DM52', 'DM53', 'DM54',
        'DM69', 'DM70', 'DM71', 'DM72', 'DM73', 'DM74',
    ];

    private static SemanticAnswerTable = {
        UM128: { positiveOrNegative: false, modifiable: false, messages: ['DM28'] },
        UM129: { positiveOrNegative: false, modifiable: false, messages: ['DM37'] },
        UM130: { positiveOrNegative: false, modifiable: false, messages: ['DM31'] },
        UM131: { positiveOrNegative: false, modifiable: true, messages: ['DM57'] },
        UM132: { positiveOrNegative: false, modifiable: true, messages: ['DM33'] },
        UM133: { positiveOrNegative: false, modifiable: true, messages: ['DM32'] },
        UM134: { positiveOrNegative: false, modifiable: true, messages: ['DM34'] },
        UM135: { positiveOrNegative: false, modifiable: true, messages: ['DM38'] },
        UM136: { positiveOrNegative: false, modifiable: true, messages: ['DM39'] },
        UM137: { positiveOrNegative: false, modifiable: true, messages: ['DM40'] },
        UM138: { positiveOrNegative: false, modifiable: true, messages: ['DM46'] },
        UM139: { positiveOrNegative: false, modifiable: true, messages: ['DM45'] },
        UM140: { positiveOrNegative: false, modifiable: true, messages: ['DM42'] },
        UM141: { positiveOrNegative: false, modifiable: true, messages: ['DM43'] },
        UM142: { positiveOrNegative: false, modifiable: true, messages: ['DM44'] },
        UM144: { positiveOrNegative: false, modifiable: true, messages: ['DM47'] },
        UM145: { positiveOrNegative: false, modifiable: true, messages: ['DM35'] },
        UM146: { positiveOrNegative: false, modifiable: true, messages: ['DM36'] },
        UM147: { positiveOrNegative: false, modifiable: true, messages: ['DM48'] },
        UM148: { positiveOrNegative: true, modifiable: true, messages: ['DM81', 'DM82'] },
        UM151: { positiveOrNegative: false, modifiable: true, messages: ['DM83'] },
        UM152: { positiveOrNegative: true, modifiable: true, messages: ['DM85', 'DM86'] },
        UM175: { positiveOrNegative: false, modifiable: false, messages: ['DM72'] },
        UM180: { positiveOrNegative: false, modifiable: false, messages: ['DM76'] },
        UM181: { positiveOrNegative: false, modifiable: true, messages: ['DM67'] },
        UM182: { positiveOrNegative: false, modifiable: true, messages: ['DM79'] },
        UM184: { positiveOrNegative: false, modifiable: true, messages: ['DM67'] },
        UM228: { positiveOrNegative: false, modifiable: true, messages: ['DM104'] },
        UM231: { positiveOrNegative: false, modifiable: true, messages: ['DM106'] },
        UM232: { positiveOrNegative: false, modifiable: true, messages: ['DM109'] },
    };

    public static MessageRemainsOnDcdu(message: CpdlcMessage): boolean {
        return UplinkMessageInterpretation.NonAutomaticClosingMessage.findIndex((elem) => message.Content[0].TypeId === elem) !== -1;
    }

    public static SemanticAnswerRequired(message: CpdlcMessage): boolean {
        return message.Content[0].TypeId === 'UM143' || message.Content[0].TypeId in UplinkMessageInterpretation.SemanticAnswerTable;
    }

    private static getDigitsFromBco16(code: number): number[] {
        let codeCopy = code;
        const digits: number[] = [];
        while (codeCopy > 0) {
            digits.push(codeCopy % 16);
            codeCopy = Math.floor(codeCopy / 16);
        }
        if (digits.length < 4) {
            const digitsToAdd = 4 - digits.length;
            for (let i = 0; i < digitsToAdd; i++) {
                digits.push(0);
            }
        }
        digits.reverse();
        return digits;
    }

    private static FillPresentData(atsu: Atsu, message: CpdlcMessage): boolean {
        switch (message.Content[0]?.TypeId) {
        case 'UM132':
            message.Response.Content[0].Content[0].Value = coordinateToString({ lat: atsu.currentFlightState().lat, lon: atsu.currentFlightState().lon }, false);
            return true;
        case 'UM133':
            message.Response.Content[0].Content[0].Value = InputValidation.formatScratchpadAltitude(Math.round(atsu.currentFlightState().altitude / 100).toString());
            return true;
        case 'UM134':
            message.Response.Content[0].Content[0].Value = InputValidation.formatScratchpadSpeed(atsu.currentFlightState().indicatedAirspeed.toString());
            return true;
        case 'UM144':
            const squawk = UplinkMessageInterpretation.getDigitsFromBco16(SimVar.GetSimVarValue('TRANSPONDER CODE:1', 'Bco16'));
            message.Response.Content[0].Content[0].Value = `${squawk[0]}${squawk[1]}${squawk[2]}${squawk[3]}`;
            return true;
        case 'UM145':
            message.Response.Content[0].Content[0].Value = atsu.currentFlightState().heading.toString();
            return true;
        case 'UM146':
            message.Response.Content[0].Content[0].Value = atsu.currentFlightState().track.toString();
            return true;
        case 'UM228':
            message.Response.Content[0].Content[0].Value = `${timestampToString(atsu.destinationWaypoint().utc)}Z`;
            return true;
        default:
            return false;
        }
    }

    private static FillAssignedData(atsu: Atsu, message: CpdlcMessage): boolean {
        switch (message.Content[0]?.TypeId) {
        case 'UM135':
            message.Response.Content[0].Content[0].Value = InputValidation.formatScratchpadAltitude(Math.round(atsu.targetFlightState().altitude / 100).toString());
            return true;
        case 'UM136':
            message.Response.Content[0].Content[0].Value = InputValidation.formatScratchpadAltitude(atsu.targetFlightState().speed.toString());
            return true;
        default:
            return false;
        }
    }

    private static FillPositionReportRelatedData(atsu: Atsu, message: CpdlcMessage): boolean {
        switch (message.Content[0]?.TypeId) {
        case 'UM138':
            if (atsu.lastWaypoint()) message.Response.Content[0].Content[0].Value = `${timestampToString(atsu.lastWaypoint().utc)}Z`;
            return true;
        case 'UM139':
            if (atsu.lastWaypoint()) message.Response.Content[0].Content[0].Value = atsu.lastWaypoint().ident;
            return true;
        case 'UM140':
            if (atsu.activeWaypoint()) message.Response.Content[0].Content[0].Value = atsu.activeWaypoint().ident;
            return true;
        case 'UM141':
            if (atsu.activeWaypoint()) message.Response.Content[0].Content[0].Value = `${timestampToString(atsu.activeWaypoint().utc)}Z`;
            return true;
        case 'UM142':
            if (atsu.nextWaypoint()) message.Response.Content[0].Content[0].Value = atsu.nextWaypoint().ident;
            return true;
        case 'UM147':
            message.Response = Atsu.createAutomatedPositionReport(atsu);
            return true;
        case 'UM148':
        case 'UM151':
            message.Response.Content[0].Content[0].Value = message.Content[0].Content[0].Value;
            return true;
        case 'UM152':
            message.Response.Content[0].Content[0].Value = message.Content[0].Content[0].Value;
            message.Response.Content[0].Content[1].Value = message.Content[0].Content[1].Value;
            return true;
        case 'UM228':
            if (atsu.destinationWaypoint()) {
                message.Response.Content[0].Content[0].Value = atsu.destinationWaypoint().ident;
                message.Response.Content[0].Content[1].Value = `${timestampToString(atsu.destinationWaypoint().utc)}Z`;
            }
            return true;
        default:
            return false;
        }
    }

    private static FillReportingRelatedData(message: CpdlcMessage): boolean {
        switch (message.Content[0]?.TypeId) {
        case 'UM128':
        case 'UM129':
        case 'UM130':
        case 'UM175':
            message.Response.Content[0].Content[0].Value = message.Content[0].Content[0].Value;
            return true;
        case 'UM180':
            for (let i = 0; i < message.Response.Content[0].Content.length; ++i) {
                message.Response.Content[0].Content[i].Value = message.Content[0].Content[i].Value;
            }
            return true;
        default:
            return false;
        }
    }

    public static AppendSemanticAnswer(atsu: Atsu, positiveAnswer: boolean, message: CpdlcMessage): boolean {
        if (message.Content[0]?.TypeId === 'UM143') {
            // find last request and create a deep copy
            for (const atcMessage of atsu.atc.messages()) {
                const cpdlc = atcMessage as CpdlcMessage;

                if (UplinkMessageInterpretation.RequestMessages.findIndex((elem) => elem === cpdlc.Content[0].TypeId) !== -1) {
                    const response = new CpdlcMessage();

                    response.Station = atcMessage.Station;
                    response.PreviousTransmissionId = message.CurrentTransmissionId;
                    for (const entry of cpdlc.Content) {
                        response.Content.push(entry.deepCopy());
                    }

                    message.Response = response;
                    return true;
                }
            }

            if (!message.Response) {
                const response = new CpdlcMessage();
                response.Station = message.Station;
                response.PreviousTransmissionId = message.CurrentTransmissionId;
                response.Content.push(CpdlcMessagesDownlink.DM67[1].deepCopy());
                response.Content[0].Content[0].Value = 'NO REQUEST TRANSMITTED';
                message.Response = response;
            }
        } else if (message.Content[0]?.TypeId in UplinkMessageInterpretation.SemanticAnswerTable) {
            const lutEntry = UplinkMessageInterpretation.SemanticAnswerTable[message.Content[0].TypeId];
            if (lutEntry.positiveOrNegative) {
                const response = new CpdlcMessage();
                response.Station = message.Station;
                response.PreviousTransmissionId = message.CurrentTransmissionId;

                if (positiveAnswer) {
                    response.Content.push(CpdlcMessagesDownlink[lutEntry.messages[0]][1].deepCopy());
                } else {
                    response.Content.push(CpdlcMessagesDownlink[lutEntry.messages[1]][1].deepCopy());
                }

                message.Response = response;
            } else if (lutEntry.messages[0] in CpdlcMessagesDownlink) {
                const response = new CpdlcMessage();
                response.Station = message.Station;
                response.PreviousTransmissionId = message.CurrentTransmissionId;
                response.Content.push(CpdlcMessagesDownlink[lutEntry.messages[0]][1].deepCopy());
                message.Response = response;
            }
        }

        if (!UplinkMessageInterpretation.FillPresentData(atsu, message) && !UplinkMessageInterpretation.FillAssignedData(atsu, message)) {
            if (!UplinkMessageInterpretation.FillPositionReportRelatedData(atsu, message)) {
                UplinkMessageInterpretation.FillReportingRelatedData(message);
            }
        }
        return false;
    }

    public static HasNegativeResponse(message: CpdlcMessage): boolean {
        if (message.Content[0]?.TypeId in UplinkMessageInterpretation.SemanticAnswerTable) {
            const lutEntry = UplinkMessageInterpretation.SemanticAnswerTable[message.Content[0]?.TypeId];
            if (lutEntry.positiveOrNegative) {
                return message.Response.Content[0].TypeId !== lutEntry.messages[1];
            }
        }
        return false;
    }

    public static IsModifiable(message: CpdlcMessage): boolean {
        if (message.Content[0]?.TypeId in UplinkMessageInterpretation.SemanticAnswerTable) {
            const lutEntry = UplinkMessageInterpretation.SemanticAnswerTable[message.Content[0]?.TypeId];
            return lutEntry.modifiable;
        }
        return false;
    }
}
