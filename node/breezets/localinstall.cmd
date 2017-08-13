set TO="\users\Thomas\node_modules\breezets"
rem set TO="%~dp0%node_modules\breezets"
set FROM="%~dp0%"
IF EXIST %TO% (RMDIR /Q %TO%)
mklink /J %TO% %FROM%
