class FBW_PFD_VertSpeedIndicator {
    constructor() {
        this.VerticalSpeedGroup = document.getElementById("VerticalSpeedGroup");
        this.VSpeedFlag = document.getElementById("VSpeedFailText");

        this.VSpeedTextGroup = document.getElementById("VSpeedTextGroup");
        this.PrevVSpeedVisible = true;
        this.PrevVSpeedTextAmber = false;
        this.VSpeedText = document.getElementById("VSpeedText");

        this.VSpeedIndicator = document.getElementById("VSpeedIndicator");
    }

    init(_index) {
        this.VSpeedFlag.style.display = "none";
    }

    update(radioAlt) {
        // This would be inertial vertical speed. if the IRS fails, barometric vertical speed will be used (not implemented)
        const VSpeed = SimVar.GetSimVarValue("VELOCITY WORLD Y", "feet per minute");

        const absVSpeed = Math.abs(VSpeed);
        const sign = Math.sign(VSpeed);

        let yOffset = 0;

        if (absVSpeed < 1000) {
            yOffset = VSpeed / 1000 * -25.5255;
        } else if (absVSpeed < 2000) {
            yOffset = (VSpeed - sign * 1000) / 1000 * -10.14 - sign * 25.5255;
        } else if (absVSpeed < 6000) {
            yOffset = (VSpeed - sign * 2000) / 4000 * -10.14 - sign * 35.6655;
        } else {
            yOffset = sign * -45.8055;
        }

        if ((absVSpeed > 6000 || (radioAlt < 2500 && radioAlt > 1000 && VSpeed < -2000) || (radioAlt < 1000 && VSpeed < -1200)) && !this.PrevVSpeedTextAmber) {
            this.VSpeedText.classList.add("Amber");
            this.VSpeedIndicator.classList.add("Amber");
            this.VSpeedText.classList.remove("Green");
            this.VSpeedIndicator.classList.remove("Green");
            this.PrevVSpeedTextAmber = true;
        } else if (!(absVSpeed > 6000 || (radioAlt < 2500 && radioAlt > 1000 && VSpeed < -2000) || (radioAlt < 1000 && VSpeed < -1200)) && this.PrevVSpeedTextAmber) {
            this.VSpeedText.classList.remove("Amber");
            this.VSpeedIndicator.classList.remove("Amber");
            this.VSpeedText.classList.add("Green");
            this.VSpeedIndicator.classList.add("Green");
            this.PrevVSpeedTextAmber = false;
        }

        this.VSpeedIndicator.setAttribute("d", `m162.74 80.822 l -12.525 ${yOffset}`);
        this.updateVSpeedText(absVSpeed, sign, yOffset);
    }

    updateVSpeedText(absVSpeed, sign, yOffset) {
        if (absVSpeed < 200 && this.PrevVSpeedVisible) {
            this.VSpeedTextGroup.style.display = "none";
            this.PrevVSpeedVisible = false;
            return;
        } else if (absVSpeed >= 200 && !this.PrevVSpeedVisible) {
            this.VSpeedTextGroup.style.display = "block";
            this.PrevVSpeedVisible = true;
        }

        this.VSpeedTextGroup.setAttribute("transform", `translate(0 ${yOffset - sign * 2.4})`);

        const text = (Math.round(absVSpeed / 100) < 10 ? "0" : "") + Math.round(absVSpeed / 100).toString();
        this.VSpeedText.textContent = text;
    }
}
