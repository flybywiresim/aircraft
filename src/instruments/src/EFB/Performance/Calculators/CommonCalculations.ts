export function getTailWind(windDirection: number, windMagnitude: number, runwayHeading: number): number {
	let windDirectionRelativeToRwy = windDirection - runwayHeading;
	let windDirectionRelativeToRwyRadians = toRadians(windDirectionRelativeToRwy);

	let tailWind = Math.cos(Math.PI - windDirectionRelativeToRwyRadians) * windMagnitude;
	return tailWind;
}

export function toRadians(degrees: number): number {
	return degrees * (Math.PI / 180);
}
