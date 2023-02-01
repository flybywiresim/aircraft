export function getTailWind(windDirection: number, windMagnitude: number, runwayHeading: number): number {
    const windDirectionRelativeToRwy = windDirection - runwayHeading;
    const windDirectionRelativeToRwyRadians = toRadians(windDirectionRelativeToRwy);

    const tailWind = Math.cos(Math.PI - windDirectionRelativeToRwyRadians) * windMagnitude;
    return tailWind;
}

export function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}
