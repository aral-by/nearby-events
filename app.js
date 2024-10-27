const express = require('express');
const axios = require('axios'); 
const path = require('path');

require('dotenv').config();

const app = express();
const PORT = 3002;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'))

const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY;
const geo_username = process.env.GEONAMES_USERNAME;

// Fetch countries from the API
async function fetchCountries() {
    try {
        const response = await axios.get('https://restcountries.com/v3.1/all');
        return response.data.map(country => ({
            name: country.name.common,
            alpha3Code: country.cca2 // we use cca2 instead of alpha3Code
        }));
    } catch (error) {
        console.error('Error while fetching countries:', error);
        return [];
    }
}

// Fetch cities from the API
async function fetchCitiesByCountry(countryCode) {
     const username = geo_username;
    try {
        const response = await axios.get(`http://api.geonames.org/searchJSON?country=${countryCode}&username=${username}`);
        return response.data.geonames.map(city => city.name);
    } catch (error) {
        console.error('Error while fetching cities:', error);
        return [];
    }
}

// Function to convert address to coordinates using the Nominatim API
async function getCoordinatesFromAddress(address, city, state, country) {
    const nominatimURL = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address + ', ' + city + ', ' + state + ', ' + country)}&format=json&limit=1`;

    try {
        const response = await axios.get(nominatimURL);
        if (response.data && response.data.length > 0) {
            const { lat, lon } = response.data[0];
            return { latitude: lat, longitude: lon };
        } else { 
            return null; // enter default coordinates for events whose coordinates are not retrieved
        }
    } catch (error) {
        console.error('Error while retrieving coordinates:', error.message);
        return null;
    }
}

// Function to group events at the same coordinates
function groupEventsByCoordinates(events) {
    const groupedEvents = {};

    events.forEach(event => {
        const key = `${event.latitude},${event.longitude}`;
        if (!groupedEvents[key]) {
            groupedEvents[key] = [];
        }
        groupedEvents[key].push(event);
    });

    return groupedEvents;
}

app.get('/', async (req, res) => {
    const countries = await fetchCountries();
    res.render('index', { countries });
});

app.get('/cities/:countryCode', async (req, res) => {
    const cities = await fetchCitiesByCountry(req.params.countryCode);
    res.json(cities);  // Return cities in JSON format
}); 

// Fetch Ticketmaster data with API and return coordinates
app.post('/events', async (req, res) => {

    const SelectedCity = req.body.city;

    try {
        const response = await axios.get('https://app.ticketmaster.com/discovery/v2/events', {
            params: {
                apikey: TICKETMASTER_API_KEY,
                // latlong: '40.1826,29.0665', 
                keyword: SelectedCity, // enter your city here
                radius: '500', // For example, events within 1000 km radius
                unit: 'km'
                }           
            });

            const events = [];
            const ticketmasterEvents = response.data._embedded.events;

            for (const event of ticketmasterEvents) {
                const eventName = event.name;
                const eventStartDate = event.dates.start.localDate;
                const eventURL = event.url;
                // Event venue information
                const venue = event._embedded.venues[0];
                const eventAddress = venue.address.line1;
                const eventCity = venue.city.name;
                const eventState = venue.state ? venue.state.name : ''; // If there is state information, we get it
                const eventCountry = venue.country.name;

                console.log(eventName);
                // Convert address to coordinates
                const coordinates = await getCoordinatesFromAddress(eventAddress, eventCity, eventState, eventCountry);

                if (coordinates) {
                    events.push({
                        name: eventName,
                        date: eventStartDate,
                        link: eventURL,
                        address: `${eventAddress}, ${eventCity}, ${eventState}, ${eventCountry}`,
                        latitude: coordinates.latitude,
                        longitude: coordinates.longitude
                    });
                } else { // if Nominatim does not return coordinates, use Ticketmaster's default coordinates
                    events.push({
                        name: eventName,
                        date: eventStartDate,
                        link: eventURL,
                        address: `${eventAddress}, ${eventCity}, ${eventState}, ${eventCountry}`,
                        latitude: event._embedded.venues[0].location.latitude, 
                        longitude: event._embedded.venues[0].location.longitude
                    });
                }
            }

            // Group events by coordinates
            const groupedEvents = groupEventsByCoordinates(events);

            console.log(groupedEvents);

            res.render('events', { groupedEvents: groupedEvents });
            
        } catch (error) {
            res.status(500).json({ error: 'Error occurred during API request' });
        }
    });

app.listen(PORT, () => {
    console.log(`This server running on this port => ${PORT}`);
});
