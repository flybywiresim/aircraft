// From Beheh's PR: https://github.com/beheh/a32nx/commit/3bb63c90eb36fe24bee6209582362a73f9223ed5

const LINE_SPACING = 30;
const LETTER_WIDTH = 16;

const x = 10;
const y = 565;

const LowerDisplay = () => {
    const mesgPool = [
        [
            '',
            '\x1b<4m\x1b4mFWS\x1bm FWC 1+2 FAULT',
            '\x1b<5m -MONITOR SYS',
            '\x1b<5m -MONITOR OVERHEAD PANEL',
        ].join('\r'),
        [
            "\x1b<2m\x1b4mELEC\x1bm \x1b'mEMER CONFIG\x1bm",
            '\x1b<5m PROC:GRVTY FUEL FEEDING',
            '\x1b<5m -FAC 1......OFF THEN ON',
            '',
            '',
            '\x1b<5m -BUS TIE............OFF',
            '\x1b<5m -GEN 1+2... OFF THEN ON',
        ].join('\r'),
        [
            '\x1b<4m\x1b4mNAV\x1bm \x1b<4mILS 2 FAULT\x1bm',
            '\x1b<4m    GPS2 FAULT',
            '\x1b<4m\x1b4mF/CTL\x1bm \x1b<4mELAC 1 FAULT\x1bm',
            '\x1b<5m -ELAC 1.....OFF THEN ON',
            '\x1b<7m   .IF UNSUCCESSFUL :',
            '\x1b<5m -ELAC 1.....OFF THEN ON',
            '\x1b<4m\x1b4mC/B\x1bm \x1b<4mTRIPPED REAR PNL J-M\x1bm',
        ].join('\r'),
        [
            '023456789012345678901234567',
            ' -2',
            ' -3',
            ' -4',
            ' -5',
            ' -6',
            ' -7',
            ' -8',
        ].join('\r'),
    ];

    const message = mesgPool[Math.floor(Math.random() * mesgPool.length)];
    // const message = mesgPool[2];

    const lines = [];
    let spans = [];

    let color = 'White';
    let underlined = false;
    let flashing = false;
    let framed = false;

    const decorations = [];

    let buffer = '';
    let startCol = 0;
    let col = 0;
    for (let i = 0; i < message.length; i++) {
        const char = message[i];
        if (char === '\x1B' || char === '\r') {
            if (buffer !== '') {
                // close current part
                spans.push(
                    <tspan
                        key={buffer}
                        className={`${color} EWDWarn`}
                    >
                        {buffer}
                    </tspan>,
                );
                buffer = '';

                if (underlined) {
                    decorations.push(
                        <path
                            className={`Underline ${color}Line`}
                            d={`M ${x + (startCol * LETTER_WIDTH)} ${y + (lines.length * LINE_SPACING + 4)} h ${(col - startCol) * LETTER_WIDTH + 1}`}
                            strokeLinecap="round"
                        />,
                    );
                }

                if (framed) {
                    decorations.push(
                        <path
                            className={`Underline ${color}Line`}
                            d={`M ${x + (startCol * LETTER_WIDTH)}
                            ${y + (lines.length * LINE_SPACING) - 22} h ${(col - startCol) * LETTER_WIDTH + 12} v 27 h ${-((col - startCol) * LETTER_WIDTH + 12)} v -27`}
                            strokeLinecap="round"
                        />,
                    );
                }

                startCol = col;
            }

            if (char === '\x1B') {
                let ctrlBuffer = '';
                i++;
                for (; i < message.length; i++) {
                    ctrlBuffer += message[i];

                    let match = true;
                    switch (ctrlBuffer) {
                    case 'm':
                        // Reset attribute
                        underlined = false;
                        flashing = false;
                        framed = false;
                        break;
                    case '4m':
                        // Underlined attribute
                        underlined = true;
                        break;
                    case ')m':
                        // Flashing attribute
                        flashing = true;
                        break;
                    case "'m":
                        // Characters which follow must be framed
                        framed = true;
                        break;
                    case '<1m':
                        // Select YELLOW
                        color = 'Yellow';
                        break;
                    case '<2m':
                        // Select RED
                        color = 'Red';
                        break;
                    case '<3m':
                        // Select GREEN
                        color = 'Green';
                        break;
                    case '<4m':
                        // Select AMBER
                        color = 'Amber';
                        break;
                    case '<5m':
                        // Select CYAN (blue-green)
                        color = 'Cyan';
                        break;
                    case '<6m':
                        // Select MAGENTA
                        color = 'Magenta';
                        break;
                    case '<7m':
                        // Select WHITE
                        color = 'White';
                        break;
                    default:
                        match = false;
                        break;
                    }

                    if (match) {
                        break;
                    }
                }

                continue;
            }

            if (char === '\r') {
                lines.push(<text x={x} y={y + (lines.length * LINE_SPACING)}>{spans}</text>);

                spans = [];
                col = 0;
                startCol = 0;
                continue;
            }
        }

        buffer += char;
        col++;
    }

    if (buffer !== '') {
        spans.push(
            <tspan
                key={buffer}
                className={`${color} EWDWarn`}
            >
                {buffer}
            </tspan>,
        );
    }

    if (spans.length) {
        lines.push(<text x={x} y={y + (lines.length * LINE_SPACING)}>{spans}</text>);
    }

    const memos = [
        <>&nbsp;NOT AVAIL</>,
        'ECAM WARN',
        'ALTI ALERT',
        'STATUS',
        'A/CALL OUT',
        'MEMO',
    ];

    return (
        <g id="LowerLeftDisplay">

            <g>
                {lines}
                {decorations}
            </g>
            {/*
            <text
                x={x + 473}
                y={y - 22}
                fill="White"
                textAnchor="middle"
                className="EWDWarn White"
            >
                ADV
            </text>
            */}
            {/* Border for ADV
            <path
                className="WhiteLine"
                d={`M ${x + 446} ${y - 19} h 55 v -24 h -55 v 24`}
                strokeLinecap="round"
            />
            */}
            {/*
            <text x={x + 473} y={y + 185} className="White EWDWarn" textAnchor="middle">
                STS
            </text>
            */}
            {/* Border for STS
            <path
                className="WhiteLine"
                d={`M ${x + 446} ${y + 188} h 55 v -24 h -55 v 24`}
                strokeLinecap="round"
            />
            */}
            {/* Down arrow */}
            <path
                d={`m ${x + 471} ${y + 164} h 5 v 18 h 5 l -7.5,11 l -7.5,-11 h 5 v -18`}
                style={{
                    fill: '#00ff00',
                    stroke: 'none',
                    // strokeWidth: 0.2,
                }}
            />
        </g>
    );
};

export default LowerDisplay;
