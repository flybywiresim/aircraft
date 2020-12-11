class FBW_PFD_HeadingZone {
    constructor() {
        this.TapeElement = document.getElementById("HeadingTapeElementsGroup");
        this.Tick = document.getElementById("HeadingTick");
        this.GroundTrackBug = document.getElementById("ActualTrackIndicator");
        this.GroundTrackBugIndex = NaN;

        this.HeadingFailText = document.getElementById("HDGFailText");

        this.TargetHeadingBug = document.getElementById("HeadingTargetIndicator");
        this.TargetHeadingOfftapeLeft = document.getElementById("SelectedHeadingTextLeft");
        this.TargetHeadingOfftapeRight = document.getElementById("SelectedHeadingTextRight");
        this.PrevTargetHeadingVisibility = NaN;

        this.QFUBug = document.getElementById("ILSCoursePointer");
        this.QFUOfftapeLeft = document.getElementById("ILSCourseLeft");
        this.QFUOfftapeLeftText = document.getElementById("ILSCourseTextLeft");
        this.QFUOfftapeRight = document.getElementById("ILSCourseRight");
        this.QFUOfftapeRightText = document.getElementById("ILSCourseTextRight");
        this.PrevQFUVisibilty = NaN;
        this.QFUBugIndex = NaN;

        this.HeadingTape = new FBW_PFD_HeadingTape(29, 5, 7.555, this.TapeElement);

        this.disp_index = NaN;
    }

    init(_index) {
        this.HeadingFailText.style.display = "none";

        this.HeadingTape.init(this.Tick, "HeadingTick");
        this.GroundTrackBugIndex = this.HeadingTape.addBug(this.GroundTrackBug);
        this.QFUBugIndex = this.HeadingTape.addBug(this.QFUBug);

        this.disp_index = _index;
    }

    update(heading, groundTrack, targetHeading, LSButtonPressed) {
        this.HeadingTape.updateGraduation(heading);
        this.HeadingTape.updateBug(this.GroundTrackBugIndex, groundTrack, heading);

        this.updateQFUIndicator(heading, LSButtonPressed);

        this.updateTargetHeading(heading, targetHeading);
    }

    updateQFUIndicator(heading, LSButtonPressed) {
        if (LSButtonPressed) {
            const ILSCourse = SimVar.GetSimVarValue("NAV LOCALIZER:3", "degrees");
            this.HeadingTape.updateBug(this.QFUBugIndex, ILSCourse, heading);

            const diff = FBW_PFD_HeadingTape.getSmallestAngle(ILSCourse, heading);

            if (Math.abs(diff) > 24) {
                if (diff > 0) {
                    this.QFUOfftapeRightText.textContent = Math.round(ILSCourse).toString().padStart(3, "0");
                    if (this.PrevQFUVisibilty !== 1) {
                        this.PrevQFUVisibilty = 1;
                        this.QFUOfftapeLeft.style.display = "none";
                        this.QFUOfftapeRight.style.display = "block";
                    }
                } else {
                    this.QFUOfftapeLeftText.textContent = Math.round(ILSCourse).toString().padStart(3, "0");
                    if (this.PrevQFUVisibilty !== 2) {
                        this.PrevQFUVisibilty = 2;
                        this.QFUOfftapeLeft.style.display = "block";
                        this.QFUOfftapeRight.style.display = "none";
                    }
                }
            } else if (this.PrevQFUVisibilty !== 0) {
                this.PrevQFUVisibilty = 0;
                this.QFUOfftapeLeft.style.display = "none";
                this.QFUOfftapeRight.style.display = "none";
            }
        } else {
            this.HeadingTape.updateBug(this.QFUBugIndex, 0, heading, false);
            if (this.PrevQFUVisibilty !== 0) {
                this.PrevQFUVisibilty = 0;
                this.QFUOfftapeLeft.style.display = "none";
                this.QFUOfftapeRight.style.display = "none";
            }
        }
    }

    updateTargetHeading(heading, targetHeading) {
        if (isNaN(targetHeading)) {
            if (this.PrevTargetHeadingVisibility !== 0) {
                this.PrevTargetHeadingVisibility = 0;
                this.TargetHeadingBug.style.display = "none";
                this.TargetHeadingOfftapeLeft.style.display = "none";
                this.TargetHeadingOfftapeRight.style.display = "none";
            }
            return;
        }

        const headingDiff = FBW_PFD_HeadingTape.getSmallestAngle(targetHeading, heading);

        if (Math.abs(headingDiff) > 24) {
            if (headingDiff > 0) {
                if (this.PrevTargetHeadingVisibility !== 3) {
                    this.PrevTargetHeadingVisibility = 3;
                    this.TargetHeadingBug.style.display = "none";
                    this.TargetHeadingOfftapeLeft.style.display = "none";
                    this.TargetHeadingOfftapeRight.style.display = "block";
                }
                this.TargetHeadingOfftapeRight.textContent = Math.round(targetHeading).toString().padStart(3, "0");
            } else {
                if (this.PrevTargetHeadingVisibility !== 2) {
                    this.PrevTargetHeadingVisibility = 2;
                    this.TargetHeadingBug.style.display = "none";
                    this.TargetHeadingOfftapeLeft.style.display = "block";
                    this.TargetHeadingOfftapeRight.style.display = "none";
                }
                this.TargetHeadingOfftapeLeft.textContent = Math.round(targetHeading).toString().padStart(3, "0");
            }
        } else {
            if (this.PrevTargetHeadingVisibility !== 1) {
                this.PrevTargetHeadingVisibility = 1;
                this.TargetHeadingBug.style.display = "block";
                this.TargetHeadingOfftapeLeft.style.display = "none";
                this.TargetHeadingOfftapeRight.style.display = "none";
            }

            const offset = headingDiff * this.HeadingTape.DistanceSpacing / this.HeadingTape.ValueSpacing;

            this.TargetHeadingBug.setAttribute("transform", `translate(${offset} 0)`);
        }
    }
}
