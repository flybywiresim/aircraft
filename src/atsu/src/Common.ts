import { CpdlcMessageRequestedResponseType } from './messages/CpdlcMessage';

function wordWrap(text: string, maxLength: number) {
    const result = [];
    let line = [];
    let length = 0;

    text.split(' ').forEach((word) => {
        if ((length + word.length) >= maxLength) {
            result.push(line.join(' ').toUpperCase());
            line = []; length = 0;
        }
        length += word.length + 1;
        line.push(word);
    });

    if (line.length > 0) {
        result.push(line.join(' ').toUpperCase());
    }

    return result;
}

function cpdlcToString(type: CpdlcMessageRequestedResponseType) {
    switch (type) {
    case CpdlcMessageRequestedResponseType.AffirmNegative:
        return 'AN';
    case CpdlcMessageRequestedResponseType.No:
        return 'N';
    case CpdlcMessageRequestedResponseType.Roger:
        return 'R';
    case CpdlcMessageRequestedResponseType.WilcoUnable:
        return 'WU';
    case CpdlcMessageRequestedResponseType.Yes:
        return 'Y';
    case CpdlcMessageRequestedResponseType.NotRequired:
        return 'NE';
    default:
        return '';
    }
}

function stringToCpdlc(str: string) {
    switch (str) {
    case 'AN':
        return CpdlcMessageRequestedResponseType.AffirmNegative;
    case 'N':
        return CpdlcMessageRequestedResponseType.No;
    case 'R':
        return CpdlcMessageRequestedResponseType.Roger;
    case 'WU':
        return CpdlcMessageRequestedResponseType.WilcoUnable;
    case 'Y':
        return CpdlcMessageRequestedResponseType.Yes;
    default:
        return CpdlcMessageRequestedResponseType.NotRequired;
    }
}
