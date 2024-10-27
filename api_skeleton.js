const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 3002;

const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY;

// Nominatim API ile adresi koordinatlara dönüştürme fonksiyonu
async function getCoordinatesFromAddress(address, city, state, country) {
    const nominatimURL = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address + ', ' + city + ', ' + state + ', ' + country)}&format=json&limit=1`;

    try {
        const response = await axios.get(nominatimURL);
        if (response.data && response.data.length > 0) {
            const { lat, lon } = response.data[0];
            return { latitude: lat, longitude: lon };
        } else { 
            return null; //koordinatları alınmayan etklinliklerin varsaylan koordinatlarını gir
        }
    } catch (error) {
        console.error('Koordinatları alırken hata oluştu:', error.message);
        return null;
    }
}

// Aynı koordinattaki etkinlikleri gruplama fonksiyonu
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

// API ile Ticketmaster verilerini getir ve koordinatları döndür
app.get('/events', async (req, res) => {
    try {
        const response = await axios.get('https://app.ticketmaster.com/discovery/v2/events', {
           params: {
            apikey: TICKETMASTER_API_KEY,
            //latlong: '40.1826,29.0665', 
            keyword:'canakkale', // buraya bulunduğunuz şehri yazınız
            radius: '500', // Örneğin, 1000 km çevresindeki etkinlikler
            unit: 'km'
            }           
        });

        const events = [];
        const ticketmasterEvents = response.data._embedded.events;

        for (const event of ticketmasterEvents) {
            const eventName = event.name;
            const eventStartDate = event.dates.start.localDate;
            const eventURL = event.url
            // Etkinlik mekanı bilgileri
            const venue = event._embedded.venues[0];
            const eventAddress = venue.address.line1;
            const eventCity = venue.city.name;
            const eventState = venue.state ? venue.state.name : ''; // Eyalet bilgisi varsa alıyoruz
            const eventCountry = venue.country.name;

            console.log(eventName);
            // Adresi koordinatlara dönüştür
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
            }else{ // eğer nominatim bir koordinat döndürmüyorsa ticketmaserın varsayılan koordinatlarını kullan
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

        // Etkinlikleri koordinatlara göre grupla
        const groupedEvents = groupEventsByCoordinates(events);
        res.json(groupedEvents); // Gruplanmış etkinlikleri JSON olarak döndür
        
    } catch (error) {
        res.status(500).json({ error: 'API isteğinde hata oluştu' });
    }
});

app.use(express.static('public')); // HTML dosyalarını sunmak için static dizin

app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor`);
});
