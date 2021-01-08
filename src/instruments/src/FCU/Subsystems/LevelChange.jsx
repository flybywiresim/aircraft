export const LevelChange = () => {
    return <div className="level-change">
        <svg>
            <line className="active" x1="36%" y1="15%" x2="36%" y2="25%" />
            <line className="active" x1="36%" y1="15%" x2="43%" y2="15%" />
            <text className="label active" x="44%" y="25%">LVL/CH</text>
            <line className="active" x1="68%" y1="15%" x2="68%" y2="25%" />
            <line className="active" x1="68%" y1="15%" x2="61%" y2="15%" />
        </svg>
    </div>;
}
