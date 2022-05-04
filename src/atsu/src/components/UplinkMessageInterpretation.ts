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

    public static AppendSemanticAnswer(atsu: Atsu, positiveAnswer: boolean, message: CpdlcMessage) {
        const cpdlc = message as CpdlcMessage;

        if (message.Content.TypeId === 'UM143') {
            // find last request and create a deep copy
            for (const message of atsu.atc.messages()) {
                if (UplinkMessageInterpretation.RequestMessages.findIndex((elem) => elem === cpdlc.Content.TypeId) !== -1) {
                    const request = message as RequestMessage;
                    const response = new RequestMessage();
                    response.Content = cpdlc.Content.deepCopy();
                    request.Extensions.forEach((extension) => response.Extensions.push(extension.deepCopy()));
                    cpdlc.Response = response;
                    break;
                }
            }
        } else if (message.Content.TypeId in UplinkMessageInterpretation.SemanticAnswerTable) {
            const lutEntry = UplinkMessageInterpretation.SemanticAnswerTable[message.Content.TypeId];
            if (lutEntry.positiveOrNegative) {
                const response = new CpdlcMessage();

                if (positiveAnswer) {
                    response.Content = CpdlcMessagesDownlink[lutEntry.messages[0]][1].deepCopy();
                } else {
                    response.Content = CpdlcMessagesDownlink[lutEntry.messages[1]][1].deepCopy();
                }

                cpdlc.Response = response;
            } else if (lutEntry.messages[0] in CpdlcMessagesDownlink) {
                const response = new CpdlcMessage();
                response.Content = CpdlcMessagesDownlink[lutEntry.messages[0]][1].deepCopy();
                cpdlc.Response = response;
            }
        }

        // TODO fill out the values of content and extension
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
