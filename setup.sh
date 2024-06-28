#!/bin/bash

echo "Setting up the project..."

# Install the necessary dependencies
npm install

# Copy the example.env file and rename it to .env
cp example.env .env

# Make folder database, and file users.json and userState.json inside it
mkdir database
echo '{}' > database/users.json
echo '{}' > database/userState.json
echo '{}' > database/hosts

# Start the bot
node index.js

echo "Project setup complete!"

read -p "Press any key to exit..."