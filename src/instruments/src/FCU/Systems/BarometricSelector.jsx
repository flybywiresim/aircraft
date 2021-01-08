export const BarometricSelector = () => {
    return <div className="wrapper" style={{width: "14%", top: "8%"}}>
        <svg>
            <text className="label active" x="9%" y="32%">QFE</text>
            <text className="label active" x="93%" y="32%" text-anchor="end">QNH</text>
            <text className="value active" x="14%" y="86%">8888</text>
            <circle className="active" r="1.5%" cx="49.5%" cy="82.5%" />
        </svg>
    </div>;
}
