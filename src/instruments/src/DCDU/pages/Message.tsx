import { useState, memo } from 'react';
import { useInteractionEvent } from '../../util.js';
import { BaseView } from '../elements/BaseView';
import { MessageView } from '../elements/MessageView';

type MessageProps = {
    out: boolean,
    type: string,
    message: string,
}

export const Message: React.FC<MessageProps> = memo(({ out, type, message }) => {
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

    switch (type) {
    case 'TELEX':
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
