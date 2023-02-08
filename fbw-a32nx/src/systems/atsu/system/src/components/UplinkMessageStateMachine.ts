import { CpdlcMessage, CpdlcMessageMonitoringState, AtsuMessageComStatus, AtsuTimestamp } from '@atsu/common';
import { Atsu } from '../ATSU';
import { UplinkMonitor } from '../../../common/src/components/UplinkMonitor';
import { UplinkMessageInterpretation } from '../../../common/src/components/UplinkMessageInterpretation';

export class UplinkMessageStateMachine {
    public static initialize(atsu: Atsu, message: CpdlcMessage): void {
        message.CloseAutomatically = !UplinkMessageInterpretation.MessageRemainsOnMailbox(message);

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
                message.ReminderTimestamp = AtsuTimestamp.fromClock(atsu.digitalInputs.UtcClock);
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
