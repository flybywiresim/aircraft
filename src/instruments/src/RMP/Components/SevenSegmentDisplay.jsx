export function SevenSegmentDisplay(props) {
    return (<svg>
        <text x="100%" y="60%">{props.lightsTest ? 888.888 : props.value}</text>
    </svg>);
}
