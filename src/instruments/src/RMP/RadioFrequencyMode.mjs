function FindClosestInArray(value, array) {
    return array.reduce(function(previous, current) {
        return (Math.abs(current - value) < Math.abs(previous - value) ? current : previous);
    });
}

// @todo: Move inside RadioFrequencyMode, fix not cycling at min, max.
class Offsetter {
    constructor(spacing) {
        this.spacing = spacing;
        // 8.33 kHz Frequency Endings.
        if (spacing === 8.33) this.endings = [0,5,10,15,25,30,35,40,50,55,60,65,75,80,85,90];
        // 25 kHz Frequency Endings.
        else if (spacing === 25) this.endings = [0,25,50,75];
        // High Frequency (HF) Endings.
        else if (spacing === 10) this.endings = [0,10,20,30,40,50,60,70,80,90];
        // VOR/ILS Frequency Endings.
        else if (spacing = 50) this.endings = [0, 50];
        // ADF is a special case where endings are not used.
        else if (spacing === 500) undefined;
    }

    OffsetChannel(channel, offset) {
        // Special cases, such as ADF, do not use the ending algorithm to find frequencies.
        if (this.endings === undefined) return this.ManualOffsetChannel(channel, offset);

        // Create a clone of the endings array.
        const endings = this.endings.slice();
        // Reverse the channel order if we're going backwards.
        if (offset < 0) endings.reverse();

        // For channel 456, front is 4.
        const _front = Math.floor(channel / 100);
        // For channel 456, back is 56.
        const _back = Math.round(channel % 100);

        // Find the nearest valid channel.
        const back = FindClosestInArray(_back, endings);

        // Find the index of the channel;
        const index = endings.indexOf(back);

        // Find the offset channel's index.
        const newIndex = index + Math.abs(offset);

        // Figure out how the front needs to change.
        // I.e. how many times did we go off the end of the endings array.
        const front = _front + Math.floor(newIndex / endings.length) * Math.sign(offset);

        // Combine the calculated front and back to form the new channel.
        return (front * 100) + endings[newIndex % endings.length];
    }

    ManualOffsetChannel(channel, offset) {
        // For manual offset the channels spacing is greater than 100 Khz.
        const _channel = Math.floor(channel / 100);
        return (_channel + this.spacing * offset) * 100;
    }
}

class RadioFrequencyMode {
    constructor() {
        this.minimum = undefined;
        this.maximum = undefined;
        this.spacing = undefined;
        this.ActiveGetSimVar = undefined;
        this.ActiveSetSimVar = undefined;
        this.StandbyGetSimVar = undefined;
        this.StandbySetSimVar = undefined;

        if (new.target === RadioFrequencyMode) {
            throw new TypeError("RadioFrequencyMode is an abstract class!");
        }
    }
    get active() {
        return SimVar.GetSimVarValue(this.ActiveGetSimVar, "kHz");
    }

    set active(active) {
        active = Utils.Clamp(active, this.minimum, this.maximum);
        SimVar.SetSimVarValue(this.ActiveSetSimVar, "Hz", active * 1000);
    }

    get standby() {
        return SimVar.GetSimVarValue(this.StandbyGetSimVar, "kHz");
    }

    set standby(standby) {
        standby = Utils.Clamp(standby, this.minimum, this.maximum);
        SimVar.SetSimVarValue(this.StandbySetSimVar, "Hz", standby * 1000);
    }

    transfer() {
        const _standby = this.standby;
        this.standby = this.active;
        this.active = _standby;
    }

    changeStandbyIntegerValue(offset) {
        const frequency = Math.round(this.standby);
        let integer = Math.floor(frequency / 1000);
        const decimal = frequency % 1000;

        const minimum = Math.floor(this.minimum / 1000);
        const maximum = Math.floor(this.maximum / 1000);
        integer = Utils.Clamp(integer + offset, minimum, maximum);

        this.standby = integer * 1000 + decimal;
    }

    changeStandbyDecimalValue(offset) {
        const frequency = Math.round(this.standby);
        const integer = Math.floor(frequency / 1000);
        this.standby = integer * 1000 + this.offsetter.OffsetChannel(frequency % 1000, offset);
    }

    get frequencies() {
        return {
            active: this.format(this.active),
            standby: this.format(this.standby),
        };
    }
}


export class VeryHighFrequency extends RadioFrequencyMode {
    constructor(index = 1) {
        super();
        this.minimum = 118000;
        this.maximum = 136990;
        this.offsetter = new Offsetter(8.33);
        this.ActiveGetSimVar = `COM ACTIVE FREQUENCY:${index}`;
        this.ActiveSetSimVar = index === 1 ? "K:COM_RADIO_SET_HZ" : `K:COM${index}_RADIO_SET_HZ`;
        this.StandbyGetSimVar = `COM STANDBY FREQUENCY:${index}`;
        this.StandbySetSimVar = index === 1 ? "K:COM_STBY_RADIO_SET_HZ" : `K:COM${index}_STBY_RADIO_SET_HZ`;
    }

    format(frequency) {
        return (frequency / 1000).toFixed(3).padEnd(7, '0');
    }
}


export class HighFrequency extends RadioFrequencyMode {
    constructor(index = 1) {
        super();
        this.minimum = 2800;
        this.maximum = 23990;
        this.offsetter = new Offsetter(10)
        this.ActiveGetSimVar = `L:A32NX_RMP_HF_ACTIVE_FREQUENCY:${index}`;
        this.ActiveSetSimVar = `L:A32NX_RMP_HF_ACTIVE_FREQUENCY:${index}`;
        this.StandbyGetSimVar = `L:A32NX_RMP_HF_STANDBY_FREQUENCY:${index}`;
        this.StandbySetSimVar = `L:A32NX_RMP_HF_STANDBY_FREQUENCY:${index}`;
    }

    format(frequency) {
        const front = Math.floor(frequency / 1000);
        const back = Math.round(frequency % 1000);
        return front.toString().padStart(3, " ") + "." + back.toString().padEnd(3, "0");
    }
}
