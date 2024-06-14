@echo off

echo Setting up the project...

REM Install the necessary dependencies
npm install

REM Copy the example.env file and rename it to .env
copy example.env .env

REM Make folder database, and file users.json and userState.json inside it
mkdir database
cd database
echo {} > users.json
echo {} > userState.json
cd ..

REM Start the bot
node index.js

echo Project setup complete!

pause