import { coordinateToString, timestampToString } from '../Common';
import { InputValidation } from '../InputValidation';
import { CpdlcMessagesDownlink } from '../messages/CpdlcMessageElements';
import { Atsu } from '../ATSU';
import { CpdlcMessage } from '../messages/CpdlcMessage';
import { RequestMessage } from '../messages/RequestMessage';

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
        UM127: { positiveOrNegative: false, messages: ['DM41'] },
        UM128: { positiveOrNegative: false, messages: ['DM28'] },
        UM129: { positiveOrNegative: false, messages: ['DM37'] },
        UM130: { positiveOrNegative: false, messages: ['DM31'] },
        UM131: { positiveOrNegative: false, messages: ['DM57'] },
        UM132: { positiveOrNegative: false, messages: ['DM33'] },
        UM133: { positiveOrNegative: false, messages: ['DM32'] },
        UM134: { positiveOrNegative: false, messages: ['DM34'] },
        UM135: { positiveOrNegative: false, messages: ['DM38'] },
        UM136: { positiveOrNegative: false, messages: ['DM39'] },
        UM137: { positiveOrNegative: false, messages: ['DM40'] },
        UM138: { positiveOrNegative: false, messages: ['DM46'] },
        UM139: { positiveOrNegative: false, messages: ['DM45'] },
        UM140: { positiveOrNegative: false, messages: ['DM42'] },
        UM141: { positiveOrNegative: false, messages: ['DM43'] },
        UM142: { positiveOrNegative: false, messages: ['DM44'] },
        UM144: { positiveOrNegative: false, messages: ['DM47'] },
        UM145: { positiveOrNegative: false, messages: ['DM35'] },
        UM146: { positiveOrNegative: false, messages: ['DM36'] },
        UM147: { positiveOrNegative: false, messages: ['DM48'] },
        UM148: { positiveOrNegative: true, messages: ['DM81', 'DM82'] },
        UM151: { positiveOrNegative: false, messages: ['DM83'] },
        UM152: { positiveOrNegative: true, messages: ['DM85', 'DM86'] },
        UM180: { positiveOrNegative: true, messages: ['DM67', 'DM68'] },
        UM181: { positiveOrNegative: true, messages: ['DM67', 'DM68'] },
        UM182: { positiveOrNegative: true, messages: ['DM67', 'DM68'] },
        UM228: { positiveOrNegative: true, messages: ['DM67', 'DM68'] },
        UM231: { positiveOrNegative: false, messages: ['DM106'] },
        UM232: { positiveOrNegative: false, messages: ['DM109'] },
    };

    public static MessageRemainsOnDcdu(message: CpdlcMessage): boolean {
        return UplinkMessageInterpretation.NonAutomaticClosingMessage.findIndex((elem) => message.Content.TypeId === elem) !== -1;
    }

    public static SemanticAnswerRequired(message: CpdlcMessage): boolean {
        return message.Content.TypeId === 'UM143' || message.Content.TypeId in UplinkMessageInterpretation.SemanticAnswerTable;
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
        if (message.Content.TypeId === 'UM132') {
            message.Response.Content.Content[0].Value = coordinateToString({ lat: atsu.currentFlightState().lat, lon: atsu.currentFlightState().lon }, false);
        } else if (message.Content.TypeId === 'UM133') {
            message.Response.Content.Content[0].Value = InputValidation.formatScratchpadAltitude(Math.round(atsu.currentFlightState().altitude / 100).toString());
        } else if (message.Content.TypeId === 'UM134') {
            message.Response.Content.Content[0].Value = InputValidation.formatScratchpadSpeed(atsu.currentFlightState().indicatedAirspeed.toString());
        } else if (message.Content.TypeId === 'UM144') {
            const squawk = UplinkMessageInterpretation.getDigitsFromBco16(SimVar.GetSimVarValue('TRANSPONDER CODE:1', 'Bco16'));
            message.Response.Content.Content[0].Value = `${squawk[0]}${squawk[1]}${squawk[2]}${squawk[3]}`;
        } else if (message.Content.TypeId === 'UM145') {
            message.Response.Content.Content[0].Value = atsu.currentFlightState().heading.toString();
        } else if (message.Content.TypeId === 'UM146') {
            message.Response.Content.Content[0].Value = atsu.currentFlightState().track.toString();
        } else if (message.Content.TypeId === 'UM228') {
            message.Response.Content.Content[0].Value = `${timestampToString(atsu.destinationWaypoint().utc)}Z`;
        } else {
            return false;
        }

        return true;
    }

    private static FillAssignedData(atsu: Atsu, message: CpdlcMessage): boolean {
        if (message.Content.TypeId === 'UM135' && atsu.targetFlightState().altitude !== undefined) {
            message.Response.Content.Content[0].Value = InputValidation.formatScratchpadAltitude(Math.round(atsu.targetFlightState().altitude / 100).toString());
        } else if (message.Content.TypeId === 'UM136' && atsu.targetFlightState().speed !== undefined) {
            message.Response.Content.Content[0].Value = InputValidation.formatScratchpadAltitude(atsu.targetFlightState().speed.toString());
        } else {
            return false;
        }

        return true;
    }
    // UM137 -> assigned route

    private static FillPositionReportRelatedData(atsu: Atsu, message: CpdlcMessage): boolean {
        if (message.Content.TypeId === 'UM138') {
            message.Response.Content.Content[0].Value = `${timestampToString(atsu.lastWaypoint().utc)}Z`;
        } else if (message.Content.TypeId === 'UM139') {
            message.Response.Content.Content[0].Value = atsu.lastWaypoint().ident;
        } else if (message.Content.TypeId === 'UM140') {
            message.Response.Content.Content[0].Value = atsu.activeWaypoint().ident;
        } else if (message.Content.TypeId === 'UM141') {
            message.Response.Content.Content[0].Value = `${timestampToString(atsu.activeWaypoint().utc)}Z`;
        } else if (message.Content.TypeId === 'UM142') {
            message.Response.Content.Content[0].Value = atsu.nextWaypoint().ident;
        } else if (message.Content.TypeId === 'UM147') {
            message.Response = Atsu.createAutomatedPositionReport(atsu);
        } else if (message.Content.TypeId === 'UM148' || message.Content.TypeId === 'UM151') {
            message.Response.Content.Content[0].Value = message.Content.Content[0].Value;
        } else if (message.Content.TypeId === 'UM152') {
            message.Response.Content.Content[0].Value = message.Content.Content[0].Value;
            message.Response.Content.Content[1].Value = message.Content.Content[1].Value;
        } else {
            return false;
        }

        return true;
    }
    // UM181 -> distance to %s

    public static AppendSemanticAnswer(atsu: Atsu, positiveAnswer: boolean, message: CpdlcMessage) {
        const cpdlc = message as CpdlcMessage;

        if (message.Content.TypeId === 'UM143') {
            // find last request and create a deep copy
            for (const message of atsu.atc.messages()) {
                if (UplinkMessageInterpretation.RequestMessages.findIndex((elem) => elem === cpdlc.Content.TypeId) !== -1) {
                    const request = message as RequestMessage;
                    const response = new RequestMessage();

                    response.Station = message.Station;
                    response.PreviousTransmissionId = request.CurrentTransmissionId;
                    response.Content = cpdlc.Content.deepCopy();
                    request.Extensions.forEach((extension) => response.Extensions.push(extension.deepCopy()));
                    cpdlc.Response = response;
                    break;
                }
            }
        } else if (message.Content.TypeId in UplinkMessageInterpretation.SemanticAnswerTable) {
            const lutEntry = UplinkMessageInterpretation.SemanticAnswerTable[message.Content.TypeId];
            if (lutEntry.positiveOrNegative) {
                const response = new RequestMessage();
                response.Station = message.Station;
                response.PreviousTransmissionId = message.CurrentTransmissionId;

                if (positiveAnswer) {
                    response.Content = CpdlcMessagesDownlink[lutEntry.messages[0]][1].deepCopy();
                } else {
                    response.Content = CpdlcMessagesDownlink[lutEntry.messages[1]][1].deepCopy();
                }

                cpdlc.Response = response;
            } else if (lutEntry.messages[0] in CpdlcMessagesDownlink) {
                const response = new RequestMessage();
                response.Station = message.Station;
                response.PreviousTransmissionId = message.CurrentTransmissionId;
                response.Content = CpdlcMessagesDownlink[lutEntry.messages[0]][1].deepCopy();
                cpdlc.Response = response;
            }
        }

        if (!UplinkMessageInterpretation.FillPresentData(atsu, message) && !UplinkMessageInterpretation.FillAssignedData(atsu, message)) {
            UplinkMessageInterpretation.FillPositionReportRelatedData(atsu, message);
        }
    }

    public static HasNegativeResponse(message: CpdlcMessage): boolean {
        if (message.Content.TypeId in UplinkMessageInterpretation.SemanticAnswerTable) {
            const lutEntry = UplinkMessageInterpretation.SemanticAnswerTable[message.Content.TypeId];
            if (lutEntry.positiveOrNegative) {
                return message.Response.Content.TypeId !== lutEntry.messages[1];
            }
        }
        return false;
    }
}
