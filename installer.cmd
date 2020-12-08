::@Kimbyeongjang - (김병장#7165)
@echo off
title A32NX Builder

>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
if '%errorlevel%' NEQ '0' (
    echo Request Administrator Privilege ...
    goto UACPrompt
) else ( goto gotAdmin )

:UACPrompt
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
    set params = %*:"=""
    echo UAC.ShellExecute "cmd.exe", "/c %~s0 %params%", "", "runas", 1 >> "%temp%\getadmin.vbs"
    "%temp%\getadmin.vbs"
    rem del "%temp%\getadmin.vbs"
    exit /B

:gotAdmin
pushd "%CD%"
    CD /D "%~dp0"
	
:init
docker v
if "%ERRORLEVEL%" == "0" ( 
     echo. Docker check passed...
) else ( 
     goto dockerERROR
)

git v
if "%ERRORLEVEL%" == "0" ( 
     echo. Git check passed...
) else ( 
     goto gitERROR
)

goto main

:dockerERROR
cls
echo.
echo ===================================================================
echo               You should install Docker for build
echo                 Do you want to install Docker?
echo ===================================================================
echo.
set /p docker= Y or N : 
if "%docker%"=="y" (
start "" https://www.docker.com/get-started & goto exit
) else if "%docker%"=="n" (
goto exit
) else (
goto dockerERROR)

:gitERROR
cls
echo.
echo ===================================================================
echo                 You should install git for build
echo                   Do you want to install git?
echo ===================================================================
echo.
set /p git= Y or N : 
if "%git%"=="y" (
start "" https://git-scm.com/downloads & goto exit
) else if "%git%"=="n" (
goto exit
) else (
goto gitERROR)

:main
@echo off
cls
::: =======================================================================
:::        ______ _         ____         __          ___          
:::       |  ____| |       |  _ \        \ \        / (_)         
:::       | |__  | |_   _  | |_) |_   _   \ \  /\  / / _ _ __ ___ 
:::       |  __| | | | | | |  _ <| | | |   \ \/  \/ / | | '__/ _ \
:::       | |    | | |_| | | |_) | |_| |    \  /\  /  | | | |  __/
:::       |_|    |_|\__, | |____/ \__, |     \/  \/   |_|_|  \___|
:::                  __/ |         __/ |                          
:::                 |___/         |___/                           
:::
:::           ____ ___  _   ___   __  ____        _ _     _           
:::       /\   |___ \__ \| \ | \ \ / / |  _ \      (_) |   | |          
:::      /  \    __) | ) |  \| |\ V /  | |_) |_   _ _| | __| | ___ _ __ 
:::     / /\ \  |__ < / /| . ` | > <   |  _ <| | | | | |/ _` |/ _ \ '__|
:::    / ____ \ ___) / /_| |\  |/ . \  | |_) | |_| | | | (_| |  __/ |   
:::   /_/    \_\____/____|_| \_/_/ \_\ |____/ \__,_|_|_|\__,_|\___|_|   
:::
::: =======================================================================
:::
:::          1. Download A32NX Git image & Setup (Recommended)
:::          2. Download Git Image (Download Only)
:::          3. Update Git Image (Update Only)
:::          4. Setup A32NX (Setup Only)
:::          5. Build A32NX (Build Only)
:::          6. Help
:::          7. Contact
:::          8. EXIT
:::
::: =======================================================================
:::
for /f "delims=: tokens=*" %%A in ('findstr /b ::: "%~f0"') do @echo(%%A

set /p mainChoose= Choose number :
if "%mainChoose%"=="1" (
goto auto
) else if "%mainChoose%"=="2" (
goto download
) else if "%mainChoose%"=="3" (
goto update
) else if "%mainChoose%"=="4" (
goto setup
) else if "%mainChoose%"=="5" (
goto build
) else if "%mainChoose%"=="6" (
goto help
) else if "%mainChoose%"=="7" (
goto contact
) else if "%mainChoose%"=="8" (
goto exit
) else (
goto main)

:auto
cls
@echo on
if exist %CD%/.github (
     git pull
	 call ./scripts/dev-env/run.cmd ./scripts/setup.sh
	 call ./scripts/dev-env/run.cmd ./scripts/build.sh
	 pause
	 goto main
) 
if not exist %CD%/.github(
     git clone https://github.com/flybywiresim/a32nx.git
	 cd a32nx
     call ./scripts/dev-env/run.cmd ./scripts/setup.sh
	 call ./scripts/dev-env/run.cmd ./scripts/build.sh
	 pause
	 goto main
)
pause
goto main

:download
cls
@echo on
git clone https://github.com/flybywiresim/a32nx.git
pause
goto main

:update
cls
@echo on
git pull
pause
goto main

:setup
cls
@echo on
call ./scripts/dev-env/run.cmd ./scripts/setup.sh
pause
goto main

:build
cls
@echo on
call ./scripts/dev-env/run.cmd ./scripts/build.sh
pause
goto main

:help
cls
echo.
echo =======================================================================
echo.
echo  1. Start
echo    First, Download Git image to use "git clone" or
echo    via 2nd menu (2. Download Git Image (Download Only))
echo.
echo    Second, Setup default plugin via script folder in a32nx git folder
echo    (./scripts/dev-env/run.cmd ./scripts/setup.sh)
echo.    
echo    Last, build via script folder in a32nx git folder
echo    (./scripts/dev-env/run.cmd ./scripts/build.sh)
echo.
echo  2. Menu
echo    2-1. Download A32NX Git image and Setup (Recommended)
echo      This menu automatically download, setup and build A32NX for user
echo.
echo    2-2. Download Git Image (Download Only)
echo      It is download Git Image only
echo      Link : https://github.com/flybywiresim/a32nx.git
echo.
echo    2-3. Update Git Image (Update Only)
echo      It is Update Git Image via 'git pull' command
echo.
echo    2-4. Setup A32NX (Setup Only)
echo      It is Setup A32NX for build and development.
echo      This will remove node_modules to reset and fresh install modules
echo      And automatically update node_modules
echo.
echo    2-5. Build A32NX (Build Only)
echo      It is Build A32NX for FlightSimulator 
echo      You should build before copy A32NX folder to Community folder
echo.
echo  3. Requirements
echo    A32NX dev should have Git and Docker for setup and build
echo    Git : https://www.docker.com/get-started
echo    Docker : https://www.docker.com/get-started
echo.
echo  4. Contact
echo    If you are interested in the project 
echo    Or would like to contact the developer,
echo.
echo    Please contact GitHub or Discord
echo    Github : https://github.com/flybywiresim/a32nx
echo    Discord : https://discord.com/invite/flybywire
echo.
echo =======================================================================
echo.
pause
goto main

:contact
cls
echo.
echo =======================================================================
echo.
echo                             1. Discord
echo                             2. Github
echo                             3. Sponsor
echo                             4. Menu
echo.
echo =======================================================================
echo.

set /p contactChoose= Choose number :
if "%contactChoose%"=="1" (
start "" https://discord.com/invite/flybywire & goto main
) else if "%contactChoose%"=="2" (
start "" https://github.com/flybywiresim/a32nx & goto main
) else if "%contactChoose%"=="3" (
start "" https://opencollective.com/flybywire & goto main
) else if "%contactChoose%"=="4" (
goto main
) else (
goto contact)

:exit
exit
