import { CpdlcMessageResponseType } from './messages/CpdlcMessage';

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

function cpdlcToString(type: CpdlcMessageResponseType) {
    switch (type) {
    case CpdlcMessageResponseType.AffirmNegative:
        return 'AN';
    case CpdlcMessageResponseType.No:
        return 'N';
    case CpdlcMessageResponseType.Roger:
        return 'R';
    case CpdlcMessageResponseType.WilcoUnable:
        return 'WU';
    case CpdlcMessageResponseType.Yes:
        return 'Y';
    default:
        return '';
    }
}

function stringToCpdlc(str: string) {
    switch (str) {
    case 'AN':
        return CpdlcMessageResponseType.AffirmNegative;
    case 'N':
        return CpdlcMessageResponseType.No;
    case 'R':
        return CpdlcMessageResponseType.Roger;
    case 'WU':
        return CpdlcMessageResponseType.WilcoUnable;
    case 'Y':
        return CpdlcMessageResponseType.Yes;
    default:
        return CpdlcMessageResponseType.NotRequired;
    }
}

export { wordWrap, cpdlcToString, stringToCpdlc };
