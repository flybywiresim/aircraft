@ECHO OFF
CLS
For /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
For /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
echo %mydate% - %mytime%
ECHO.
ECHO Welcome to FlyByWire Simulations
ECHO Note: Make sure to have your Docker Desktop opened!
ECHO.
ECHO 1. Setup
ECHO 2. Build
ECHO 3. Exit
ECHO.

CHOICE /C 123 /M "Enter your choice:"
:: Note - list ERRORLEVELS in decreasing order
IF ERRORLEVEL 3 GOTO Exit
IF ERRORLEVEL 2 GOTO Build
IF ERRORLEVEL 1 GOTO Setup

:Setup
ECHO Setup set mypath=%cd%
./scripts/dev-env/run.cmd ./scripts/setup.sh
GOTO End@echo off

:Build
ECHO Build set mypath=%cd%
./scripts/dev-env/run.cmd ./scripts/build.sh
GOTO End@echo off

:Exit
ECHO Exist
 exit /b %ERRORLEVEL%
GOTO End@echo off