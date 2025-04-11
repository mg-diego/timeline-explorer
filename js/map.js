const initialView = {
    center: [0, 20],
    zoom: 2
};

const map = new maplibregl.Map({
    container: 'map',
    style: {
        version: 8,
        sources: {
            osm: {
                type: 'raster',
                tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '&copy; OpenStreetMap contributors'
            }
        },
        layers: [{
            id: 'osm',
            type: 'raster',
            source: 'osm'
        }]
    },
    center: [0, 20],
    zoom: 2,
    maxZoom: 18
});

let bounds = new maplibregl.LngLatBounds();

async function handlePlaceVisit(feature, markerColor) {
    if (feature.properties.locationConfidence < document.getElementById("customRange").value) return;
    extendBounds(feature);
    let marker = addMarker(feature.geometry.coordinates, feature.properties, markerColor)
    return marker
}

function addMarker(location, properties, markerColor) {
    const popup = new maplibregl.Popup({ offset: 25 });
    popup.on('open', () => loadPopupLocation(popup, location, properties.name, properties.timestampStart, properties.locationConfidence));

    const marker = new maplibregl.Marker({ color: markerColor })
        .setLngLat(location)
        .setPopup(popup)
        .addTo(map);   

    return marker
}

function extendBounds(feature) {
    if (feature.geometry.coordinates != undefined) {
        bounds.extend(feature.geometry.coordinates);
    }
}

function handleActivitySegment(feature, year) {
    // WIP
    /*
    const normalizedMode = normalizeTravelMode(feature.properties.travelMode);
    const distance = feature.properties.distanceMeters;
    const yearMap = activitiesMap.get(year);
    const current = yearMap.get(normalizedMode) || 0;
    yearMap.set(normalizedMode, current + distance);
    */ //PENDING
}

function loadPopupLocation(popup, loc, name, timestamp, confidence) {
    const [lon, lat] = loc;
    popup.setHTML('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...');
    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`)
        .then(res => res.json())
        .then(data => {
            const place = data.display_name || 'Unknown location';
            popup.setHTML(`<strong>${name}</strong><br>${place}<br><em>${formatTimestamp(timestamp)}</em><br><br>Confidence: ${confidence}`);
        })
        .catch(err => {
            console.error('Nominatim error:', err);
            popup.setHTML(`<strong>${name}</strong><br><em>Could not load address</em>`);
        });
}

function removeMarkers() {
    Object.values(placeVisitList).forEach(place => {
        if (place.properties.marker != undefined) {
            place.properties.marker.remove();
        }
    });
}

function hideMarkers() {
    Object.values(placeVisitList).forEach(place => {
        if (place.properties.marker != undefined) {
            place.properties.marker.getElement().style.display = 'none';
        }
    });
}

function showMarker(feature) {
    if (feature.properties.marker != undefined) {
        feature.properties.marker.getElement().style.display = 'block';
    }
}

function fitMapBounds() {
    if (Object.keys(bounds).length > 0) {
        setTimeout(() => map.fitBounds(bounds, { padding: 50 }), 500);
    }
}