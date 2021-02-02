/**
 * Format the given frequency to be displayed.
 * @param {number} frequency The frequency in Hertz.
 * @return {string} The formatted frequency.
 */
function formatFrequency(frequency) {
    return (frequency / 1000000).toFixed(3).padEnd(7, '0');
}

export function SevenSegmentDisplay(props) {
    let { value } = props;
    const type = props.type || '8.33';
    if (type === '8.33') value = formatFrequency(value);

    return (
        <svg>
            <text x="100%" y="60%">
                {props.lightsTest ? 888.888 : value}
            </text>
        </svg>
    );
}
