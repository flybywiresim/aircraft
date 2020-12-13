class FBW_PFD_HeadingTape {

    /**
     *
     * @param _displayRange     The maximum range of the tape (to one side) in degrees
     * @param _valueSpacing     The spacing of the heading tick values in degrees
     * @param _distanceSpacing  The spacing of the heading ticks in mm
     * @param _tapeGroup        The group to move
     */
    constructor(_displayRange, _valueSpacing, _distanceSpacing, _tapeGroup) {
        this.DisplayRange = _displayRange;
        this.ValueSpacing = _valueSpacing;
        this.DistanceSpacing = _distanceSpacing;
        this.TapeGroup = _tapeGroup;

        this.Graduation = [];
        this.Bugs = [];
    }

    init(_tickPrototype, _tickName) {
        const numTicks = Math.round(this.DisplayRange * 2 / this.ValueSpacing);

        _tickPrototype.id = _tickName + "0";
        const TickElement = new HeadingTapeElement(_tickPrototype);
        this.Graduation.push(TickElement);

        for (let i = 1; i < numTicks; i++) {
            const clone = _tickPrototype.cloneNode(true);
            clone.id = _tickName + i.toString();
            this.TapeGroup.appendChild(clone);
            const TickElement = new HeadingTapeElement(clone);
            this.Graduation.push(TickElement);
        }
    }

    addBug(element) {
        this.Bugs.push(new HeadingTapeElement(element));
        return this.Bugs.length - 1;
    }

    /**
     * Updates the bug with the given index
     * @param index The index of the bug to update
     * @param BugHeading The heading of the bug
     * @param heading The current actual heading
     * @param visible If the bug should be visible or not
     */
    updateBug(index, BugHeading, heading, visible = true) {
        const bug = this.Bugs[index];
        if (visible && !bug.PrevVisible) {
            bug.PrevVisible = true;
            bug.Element.style.display = "block";
        } else if (!visible) {
            if (bug.PrevVisible) {
                bug.PrevVisible = false;
                bug.Element.style.display = "none";
            }
            return;
        }

        const angleToZero = FBW_PFD_HeadingTape.getSmallestAngle(heading, 0);
        const smallestAngle = FBW_PFD_HeadingTape.getSmallestAngle(BugHeading, 0);
        let offset = BugHeading;
        if (Math.abs(angleToZero) < 90 && Math.abs(smallestAngle) < 90) {
            if (angleToZero > 0 && smallestAngle < 0) {
                offset = BugHeading - 360;
            } else if (angleToZero < 0 && smallestAngle > 0) {
                offset = BugHeading + 360;
            }
        }

        offset *= this.DistanceSpacing / this.ValueSpacing;

        if (bug.PrevPos !== offset) {
            bug.PrevPos = offset;
            bug.Element.setAttribute("transform", `translate(${offset} 0)`);
        }
    }

    /**
     * Updates the graduation (the tickmarks) of the heading tape
     * @param heading Actual heading in degrees
     * @param yOffset Optional offset in the y-Axis
     */
    updateGraduation(heading, yOffset = 0) {
        let leftmostHeading = Math.round((heading - this.DisplayRange) / this.ValueSpacing) * this.ValueSpacing;
        if (leftmostHeading < heading - this.DisplayRange) {
            leftmostHeading += this.ValueSpacing;
        }

        this.Graduation.forEach((value, index) => {
            const offset = (leftmostHeading + index * this.ValueSpacing) * this.DistanceSpacing / this.ValueSpacing;

            if (value.PrevPos !== offset) {
                value.Element.setAttribute("transform", `translate(${offset} 0)`);
                value.PrevPos = offset;
                if (value.Text && value.Line) {
                    if ((leftmostHeading + index * this.ValueSpacing) % 10 === 0) {
                        value.Line.setAttribute("transform", "matrix(1, 0, 0, 1, 0, 0)");
                        if ((leftmostHeading + index * this.ValueSpacing) % 30 === 0) {
                            value.Text.classList.remove("FontSmallest");
                            value.Text.classList.add("FontMedium");
                            value.Text.setAttribute("transform", "translate(0 0)");
                        } else {
                            value.Text.classList.remove("FontMedium");
                            value.Text.classList.add("FontSmallest");
                            value.Text.setAttribute("transform", "translate(0 -0.3)");
                        }
                        let textVal = Math.round((leftmostHeading + index * this.ValueSpacing) / 10) % 36;
                        if (textVal < 0) {
                            textVal += 36;
                        }
                        value.Text.textContent = textVal;
                    } else {
                        value.Text.textContent = "";
                        value.Line.setAttribute("transform", "matrix(1, 0, 0, 0.42, 0, 84.5)");
                    }
                }
            }
        });

        this.TapeGroup.setAttribute("transform", `translate(${-heading * this.DistanceSpacing / this.ValueSpacing} ${yOffset})`);
    }

    /**
     * Gets the smallest angle between two angles
     * @param angle1 First angle in degrees
     * @param angle2 Second angle in degrees
     * @returns {number} Smallest angle between angle1 and angle2 in degrees
     */
    static getSmallestAngle(angle1, angle2) {
        let smallestAngle = angle1 - angle2;
        if (smallestAngle > 180) {
            smallestAngle -= 360;
        } else if (smallestAngle < -180) {
            smallestAngle += 360;
        }
        return smallestAngle;
    }
}

class HeadingTapeElement {
    constructor(_element) {
        this.PrevPos = NaN;
        this.PrevVisible = true;
        this.Element = _element;
        this.Text = this.Element.getElementsByTagName("text")[0];
        this.Line = this.Element.getElementsByTagName("path")[0];
    }
}
