@echo off
npm install
node bin\nudge.js start > output.log 2>&1
echo DONE
