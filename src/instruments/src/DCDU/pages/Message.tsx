import { useState, memo } from 'react';
import { AtcMessage, AtcMessageType } from '@atsu/AtcMessage';
import { useInteractionEvent } from '../../util.js';
import { BaseView } from '../elements/BaseView';
import { MessageView } from '../elements/MessageView';

type MessageProps = {
    message: AtcMessage,
}

export const Message: React.FC<MessageProps> = memo(({ message }) => {
    const [inop, setInop] = useState(false);
    const [lineOffset, setLineOffset] = useState(0);

    useInteractionEvent('A32NX_DCDU_BTN_INOP', () => {
        if (!inop) {
            setInop(true);
            setTimeout(() => {
                setInop(false);
            }, 3000);
        }
    });

    switch (message.Type) {
    case AtcMessageType.Telex:
    case AtcMessageType.PDC:
        return (
            <>
                <svg className="dcdu">
                    <MessageView message={message} lineOffset={lineOffset} />
                    <BaseView />
                </svg>
            </>
        );
    default:
        return (
            <>
                <svg className="text-wrapper">
                    <text x="246" y="170">UNKNOWN MSG</text>
                </svg>
            </>
        );
    }
});
