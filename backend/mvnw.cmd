@REM Maven Wrapper startup script for Windows
@REM
@REM Required ENV vars:
@REM JAVA_HOME - location of a JDK home dir

@echo off
setlocal

set MAVEN_PROJECTBASEDIR=%~dp0

@REM Find java.exe
if defined JAVA_HOME goto findJavaFromJavaHome

set JAVA_EXE=java.exe
%JAVA_EXE% -version >NUL 2>&1
if %ERRORLEVEL% equ 0 goto execute

echo ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.
echo Please set the JAVA_HOME variable in your environment to match the
echo location of your Java installation.
goto fail

:findJavaFromJavaHome
set JAVA_HOME=%JAVA_HOME:"=%
set JAVA_EXE=%JAVA_HOME%/bin/java.exe

if exist "%JAVA_EXE%" goto execute

echo ERROR: JAVA_HOME is set to an invalid directory: %JAVA_HOME%
echo Please set the JAVA_HOME variable in your environment to match the
echo location of your Java installation.
goto fail

:execute
@REM Setup the command line

set WRAPPER_JAR="%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar"
set WRAPPER_URL="https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar"

if exist %WRAPPER_JAR% (
    "%JAVA_EXE%" %MAVEN_OPTS% ^
      -jar %WRAPPER_JAR% %*
) else (
    @REM Download the maven-wrapper.jar
    echo Downloading Maven Wrapper...
    powershell -Command "Invoke-WebRequest -Uri %WRAPPER_URL% -OutFile %WRAPPER_JAR%"
    "%JAVA_EXE%" %MAVEN_OPTS% ^
      -jar %WRAPPER_JAR% %*
)
goto end

:fail
exit /b 1

:end
endlocal
