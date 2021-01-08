export const Altitude = () => {
    return <div className="fcu-window">
        <svg style={{width: "125%"}}>
            <text className="label active" x="40%" y="25%">ALT</text>
            <text className="value active" x="20%" y="85%">88888</text>
            <circle className="active" r="5.6%" cx="85%" cy="62%" />
        </svg>
    </div>;
}
