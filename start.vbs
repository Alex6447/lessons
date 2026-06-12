' ============================================================
'  Lessons platform - silent launcher (no console window)
'  Double-click this file to start the app and open the browser.
'  First run auto-prepares: .env, npm install, DB seed, build.
' ============================================================
Option Explicit

Dim sh, fso, scriptDir, cmd, port, url
Set sh  = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
sh.CurrentDirectory = scriptDir

port = 3000
url  = "http://localhost:" & port

' Build a single chained command run hidden in cmd.exe.
'  - create .env from example if missing
'  - install deps if node_modules missing
'  - if no production build: reset+seed DB, then build
'  - start the production server
cmd = "cmd /c """ & _
      "(if not exist "".env"" copy "".env.example"" "".env"" >nul) & " & _
      "(if not exist ""node_modules"" call npm install) & " & _
      "(if not exist "".next\BUILD_ID"" (call npm run db:reset & call npm run build)) & " & _
      "call npm run start"""

' 0 = hidden window, False = do not wait (server keeps running)
sh.Run cmd, 0, False

' Wait for the server to answer, then open the default browser.
Dim http, ready, i
ready = False
For i = 1 To 60
    WScript.Sleep 2000
    On Error Resume Next
    Set http = CreateObject("MSXML2.XMLHTTP")
    http.open "GET", url, False
    http.send
    If Err.Number = 0 And http.status = 200 Then ready = True
    On Error GoTo 0
    If ready Then Exit For
Next

sh.Run url
