// OpenLayers Haritası Başlatma
const map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM()
        })
    ],
    view: new ol.View({
        center: ol.proj.fromLonLat([32.8597, 39.9334]), // Başlangıç noktası (ör. Türkiye)
        zoom: 6
    })
});

// İşaretçileri haritaya ekleyen fonksiyon
function addMarkers(events) {
    events.forEach(event => {
        const eventCoordinates = ol.proj.fromLonLat([event.longitude, event.latitude]);
        
        // İşaretçi (marker) oluştur
        const marker = new ol.Feature({
            geometry: new ol.geom.Point(eventCoordinates),
            name: event.name,
            date: event.date,
            link: event.link,
            address: event.address
        });

        // Stil ayarı
        marker.setStyle(new ol.style.Style({
            image: new ol.style.Icon({
                anchor: [0.5, 1],
                src: 'https://cdn-icons-png.flaticon.com/512/68/68384.png', // İşaretçi ikonu URL'si
                scale: 0.05
            })
        }));

        // Vektör kaynağına işaretçiyi ekleyin
        const vectorSource = new ol.source.Vector({
            features: [marker]
        });

        const markerLayer = new ol.layer.Vector({
            source: vectorSource
        });

        map.addLayer(markerLayer);

        // İşaretçi üzerine tıklanınca açılacak popup
        map.on('click', function (evt) {
            map.forEachFeatureAtPixel(evt.pixel, function (feature) {
                if (feature === marker) {
                    alert(`Etkinlik: ${feature.get('name')}\nTarih: ${feature.get('date')}\nAdres: ${feature.get('address')}\nLink: ${feature.get('link')}`);
                }
            });
        });
    });
}

// Etkinlikleri haritaya ekleyin
addMarkers(events);
