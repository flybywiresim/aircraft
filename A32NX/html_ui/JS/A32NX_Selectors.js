class A32NX_Selectors {
    static VMAX() {
        const crossSpeed = SimVar.GetGameVarValue("AIRCRAFT CROSSOVER SPEED", "Knots");
        const cruiseMach = SimVar.GetGameVarValue("AIRCRAFT CRUISE MACH", "mach");
        const crossSpeedFactor = Simplane.getCrossoverSpeedFactor(crossSpeed, cruiseMach);
        // Simplane.getMaxSpeed accounts for VMO, VFE, and VLE
        // The crossSpeedFactor seems to somehow account for the MMO
        const maxSpeed = Simplane.getMaxSpeed(this.aircraft) * crossSpeedFactor;
        return maxSpeed;
    }
}