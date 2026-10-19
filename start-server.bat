@echo off
title KERYX Church OS - Local Server
echo Starting KERYX Church OS Local Server on http://localhost:8080...
powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause

