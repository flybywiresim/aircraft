export function getTailWind(windDirection: number, windMagnitude: number, runwayHeading: number): number {
	let windDirectionRelativeToRwy = windDirection - runwayHeading;
	let windDirectionRelativeToRwyRadians = windDirectionRelativeToRwy * (Math.PI / 180);

	let tailWind = Math.cos(Math.PI - windDirectionRelativeToRwyRadians) * windMagnitude;
	return tailWind;
}
