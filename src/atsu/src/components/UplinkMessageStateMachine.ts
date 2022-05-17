import { Atsu } from '../ATSU';
import { CpdlcMessage, CpdlcMessageMonitoringState } from '../messages/CpdlcMessage';
import { UplinkMonitor } from './UplinkMessageMonitoring';
import { UplinkMessageInterpretation } from './UplinkMessageInterpretation';
import { AtsuMessageComStatus } from '../messages/AtsuMessage';

export class UplinkMessageStateMachine {
    public static initialize(atsu: Atsu, message: CpdlcMessage): void {
        message.CloseAutomatically = !UplinkMessageInterpretation.MessageRemainsOnDcdu(message);

        if (UplinkMonitor.relevantMessage(message)) {
            message.MessageMonitoring = CpdlcMessageMonitoringState.Required;
            message.SemanticResponseRequired = false;
        } else {
            message.MessageMonitoring = CpdlcMessageMonitoringState.Ignored;
            message.SemanticResponseRequired = UplinkMessageInterpretation.SemanticAnswerRequired(message);
            if (message.SemanticResponseRequired) {
                UplinkMessageInterpretation.AppendSemanticAnswer(atsu, true, message);
            }
        }
    }

    public static update(atsu: Atsu, message: CpdlcMessage, uiEvent: boolean, positive: boolean): void {
        if (positive) {
            if (message.MessageMonitoring === CpdlcMessageMonitoringState.Required) {
                message.MessageMonitoring = CpdlcMessageMonitoringState.Monitoring;
                atsu.atc.messageMonitoring.monitorMessage(message);
            } else if (!uiEvent && message.MessageMonitoring === CpdlcMessageMonitoringState.Monitoring) {
                message.MessageMonitoring = CpdlcMessageMonitoringState.Finished;
                message.SemanticResponseRequired = UplinkMessageInterpretation.SemanticAnswerRequired(message);
            }
        } else if (message.MessageMonitoring === CpdlcMessageMonitoringState.Monitoring) {
            if (message.Response?.ComStatus === AtsuMessageComStatus.Sending || message.Response?.ComStatus === AtsuMessageComStatus.Sent) {
                message.MessageMonitoring = CpdlcMessageMonitoringState.Cancelled;
            } else {
                message.MessageMonitoring = CpdlcMessageMonitoringState.Required;
            }
            atsu.atc.messageMonitoring.removeMessage(message.UniqueMessageID);
        }

        if (message.SemanticResponseRequired) {
            UplinkMessageInterpretation.AppendSemanticAnswer(atsu, positive, message);
        }
    }
}
