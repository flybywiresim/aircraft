function getDayNightState(seconds: number) {
    const localHour = Math.floor(seconds / 3600);
    const timeOfDay = (localHour >= 6 && localHour <= 18) ? 'day' : 'night';
    return timeOfDay;
}

export default getDayNightState;
