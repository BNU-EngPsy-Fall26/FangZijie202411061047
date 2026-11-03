@echo off
cd /d "%~dp0"
echo Starparcel Lab - http://localhost:4173
echo Keep this window open while using the website.
start "" "http://localhost:4173"
node server.mjs
pause
