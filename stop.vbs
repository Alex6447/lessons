' ============================================================
'  Lessons platform - stop the server started by start.vbs
'  Frees port 3000 by terminating the Node process holding it.
' ============================================================
Option Explicit

Dim sh
Set sh = CreateObject("WScript.Shell")

' Find the PID listening on port 3000 and kill it (silently).
sh.Run "cmd /c for /f ""tokens=5"" %a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %a", 0, True
