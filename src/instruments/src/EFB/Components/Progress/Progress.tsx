import * as React from "react";
import * as PropTypes from "prop-types";
import './Progress.scss';

export type ProgressBarProps = {
  completed: string | number;
  displayBar?: boolean;
  completedBar?: number;
  bgcolor?: string;
  baseBgColor?: string;
  height?: string;
  width?: string;
  borderRadius?: string;
  margin?: string;
  padding?: string;
  labelAlignment?: "left" | "center" | "right" | "outside";
  labelColor?: string;
  labelSize?: string;
  isLabelVisible?: boolean;
};

const ProgressBar: React.FC<ProgressBarProps> = ({
  bgcolor,
  completed,
  displayBar,
  completedBar,
  baseBgColor,
  height,
  width,
  margin,
  padding,
  borderRadius,
  labelAlignment,
  labelColor,
  labelSize,
  isLabelVisible,
}) => {
  const getAlignment = (
    alignmentOption: ProgressBarProps["labelAlignment"]
  ) => {
    if (alignmentOption === "left") {
      return "flex-start";
    } else if (alignmentOption === "center") {
      return "center";
    } else if (alignmentOption === "right") {
      return "flex-end";
    } else {
      return null;
    }
  };

  const formatBar = (percent:number) => {
    return 6 + 0.51 * percent
  }

  const alignment = getAlignment(labelAlignment);

  const containerStyles: React.CSSProperties = {
    height: height,
    backgroundColor: baseBgColor,
    borderRadius: borderRadius,
    padding: padding,
    width: width,
    margin: margin,
  };

  const fillerStyles: React.CSSProperties = {
    height: height,
    width:
      typeof completed === "string" || completed > 100
        ? `100%`
        : `${completed}%`,
    backgroundColor: bgcolor,
    transition: "width 1s ease-in-out",
    borderRadius: "inherit",
    display: "flex",
    alignItems: "center",
    justifyContent:
      labelAlignment !== "outside" && alignment ? alignment : "normal",
  };

  const labelStyles: React.CSSProperties = {
    padding: labelAlignment === "outside" ? "0 0 0 5px" : "5px",
    color: labelColor,
    fontWeight: "bold",
    fontSize: labelSize,
    display: !isLabelVisible ? "none" : "initial",
  };

  const outsideStyles = {
    display: labelAlignment === "outside" ? "flex" : "initial",
    alignItems: labelAlignment === "outside" ? "center" : "initial",
  };

  return (
    <React.Fragment>
    <div className={displayBar? "vertical-progress-bar" : "hidden"} style={{left:''+formatBar(completedBar||0)+'%'}}></div>
    <div className="progress-bar">
        <div style={outsideStyles}>
        <div style={containerStyles}>
            <div style={fillerStyles}>
            {labelAlignment !== "outside" && (
                <span style={labelStyles}>
                {typeof completed === "number" ? `${completed}%` : `${completed}`}
                </span>
            )}
            </div>
        </div>
        {labelAlignment === "outside" && (
            <span style={labelStyles}>
            {typeof completed === "number" ? `${completed}%` : `${completed}`}
            </span>
        )}
        </div>
    </div>
    </React.Fragment>
  );
};

ProgressBar.propTypes = {
  completed: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  bgcolor: PropTypes.string,
  baseBgColor: PropTypes.string,
  height: PropTypes.string,
  width: PropTypes.string,
  borderRadius: PropTypes.string,
  margin: PropTypes.string,
  padding: PropTypes.string,
  labelAlignment: PropTypes.oneOf(["left", "center", "right", "outside"]),
  labelColor: PropTypes.string,
  labelSize: PropTypes.string,
  isLabelVisible: PropTypes.bool,
};

ProgressBar.defaultProps = {
  bgcolor: "#6a1b9a",
  height: "20px",
  width: "100%",
  borderRadius: "50px",
  labelAlignment: "right",
  baseBgColor: "#e0e0de",
  labelColor: "#fff",
  labelSize: "15px",
  isLabelVisible: true,
  displayBar:false,
  completedBar: 0
};

export default ProgressBar;
