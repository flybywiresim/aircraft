export const Mode = () => {
    return <div className="fcu-window">
        <svg>
            <text className="label active" x="40%" y="50%" text-anchor="end" alignment-baseline="middle">HDG</text>
            <text className="label active" x="40%" y="85%" text-anchor="end">TRK</text>
            <text className="label active" x="60%" y="50%" alignment-baseline="middle">V/S</text>
            <text className="label active" x="60%" y="85%">FPA</text>
        </svg>
    </div>;
}
