# Nearby Events

Nearby Events is a Node.js web application that allows users to search for upcoming events in specific cities and view them on an interactive map.

## Table of Contents
- [Features](#features)
- [Technologies](#technologies)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Screenshots](#screenshots)
- [License](#license)

## Features
- Fetches data for cities and countries from a REST Countries API.
- Utilizes Ticketmaster API to retrieve events by city.
- Displays events on a Leaflet map with markers for each location.
- Groups multiple events at the same coordinates into a single popup.
- Converts event addresses to geographic coordinates using the Nominatim API.

## Technologies
- Node.js & Express
- EJS for templating
- Axios for API requests
- Leaflet for interactive mapping
- REST Countries API
- GeoNames API
- Nominatim OpenStreetMap API
- Ticketmaster API

## Installation

To install and run the project locally, execute the following commands:

```bash
# Clone the repository
git clone https://github.com/your-username/nearby-events.git

# Navigate into the project directory
cd nearby-events

# Install dependencies
npm install

# Create a .env file and add your API keys
echo -e "TICKETMASTER_API_KEY=your_ticketmaster_api_key\nGEONAMES_USERNAME=your_geonames_username" > .env

# Start the application
node app.js

