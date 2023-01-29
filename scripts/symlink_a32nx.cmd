@ECHO OFF

SET steamMsfsPath="%APPDATA%\\Microsoft Flight Simulator\\UserCfg.opt"
SET msStoreMsfsPath="%USERPROFILE%\\AppData\\Local\\Packages\\Microsoft.FlightSimulator_8wekyb3d8bbwe\\LocalCache\\UserCfg.opt"

IF EXIST %steamMsfsPath% (
    SET userPath=%steamMsfsPath%
) ELSE (
	IF EXIST %msStoreMsfsPath% (
		SET userPath=%msStoreMsfsPath%
	) ELSE (
		ECHO Could not find Community folder while searching the following paths:
		ECHO %steamMsfsPath%
		ECHO %msStoreMsfsPath%
		EXIT /B 1
	)
)

REM Look for "InstalledPackagesPath" in UserCfg.opt. This contains the path to the packages file.
FOR /F "tokens=*" %%F IN ('FINDSTR "InstalledPackagesPath" %userPath%') DO (
	SET line=%%F
	SET communityFolder=%line:~22%
)

FOR %%i IN ("%~dp0..") DO SET "a32nx=%%~fi"

if EXIST %communityFolder%\Community\flybywire-aircraft-a320-neo (
	ECHO Deleting and recreating existing junction
	RD %communityFolder%\Community\flybywire-aircraft-a320-neo
)

MKLINK /J %communityFolder%\Community\flybywire-aircraft-a320-neo %a32nx%\fbw-a32nx\out\flybywire-aircraft-a320-neo
