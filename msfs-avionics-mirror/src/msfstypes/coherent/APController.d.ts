declare class APController {
  static apGetAutopilotModeActive(apMode: MSFSAPStates): number;
}

declare enum MSFSAPStates {
  LogicOn = 1 << 0,
  APOn = 1 << 1,
  FDOn = 1 << 2,
  FLC = 1 << 3,
  Alt = 1 << 4,
  AltArm = 1 << 5,
  GS = 1 << 6,
  GSArm = 1 << 7,
  Pitch = 1 << 8,
  VS = 1 << 9,
  Heading = 1 << 10,
  Nav = 1 << 11,
  NavArm = 1 << 12,
  WingLevel = 1 << 13,
  Attitude = 1 << 14,
  ThrottleSpd = 1 << 15,
  ThrottleMach = 1 << 16,
  ATArm = 1 << 17,
  YD = 1 << 18,
  EngineRPM = 1 << 19,
  TOGAPower = 1 << 20,
  Autoland = 1 << 21,
  TOGAPitch = 1 << 22,
  Bank = 1 << 23,
  FBW = 1 << 24,
  AvionicsManaged = 1 << 25,
  None = 1 << 31
}