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
    const lineData = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: feature.geometry.coordinates
        }
      };

      if (!map.getSource(`dynamic-line-${feature.properties.timestampStart}`)) {
        map.addSource(`dynamic-line-${feature.properties.timestampStart}`, {
            type: 'geojson',
            data: lineData
        });

        map.addLayer({
            id: `dynamic-line-${feature.properties.timestampStart}`,
            type: 'line',
            source: `dynamic-line-${feature.properties.timestampStart}`,
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#007AFF',
                'line-width': 4
            }
        });

        switch (true) {
            case feature.properties.travelMode.includes("WALK"):
                feature.properties.travelMode = "🚶" + feature.properties.travelMode
                break;
            case feature.properties.travelMode.includes("BUS"):
                feature.properties.travelMode = "🚌" + feature.properties.travelMode
                break;
            case feature.properties.travelMode.includes("TRAIN"):
                feature.properties.travelMode = "🚅" + feature.properties.travelMode
                break;
            case feature.properties.travelMode.includes("DRIVE"):
                feature.properties.travelMode = "🚗" + feature.properties.travelMode
                break;
            case feature.properties.travelMode.includes("FLYING"):
                feature.properties.travelMode = "✈️" + feature.properties.travelMode
                break;
            case feature.properties.travelMode.includes("SUBWAY"):
                feature.properties.travelMode = "🚇" + feature.properties.travelMode
                break;
        }

        // Add an event listener for when the LineString is clicked
        map.on('click', `dynamic-line-${feature.properties.timestampStart}`, (e) => {
            // Create a popup with the description from the feature's properties
            new maplibregl.Popup()
                .setLngLat(e.lngLat) // Position popup at the clicked location
                .setHTML(`<strong>${feature.properties.travelMode}</strong><br>Distance: ${formatDistanceValue(feature.properties.distanceMeters)} km<br>Confidence: ${feature.properties.locationConfidence}`)
                .addTo(map);
        });

        // Change the cursor to a pointer when hovering over the LineString
        map.on('mouseenter', `dynamic-line-${feature.properties.timestampStart}`, () => {
            map.getCanvas().style.cursor = 'pointer';
        });

        // Reset cursor when leaving the LineString
        map.on('mouseleave', `dynamic-line-${feature.properties.timestampStart}`, () => {
            map.getCanvas().style.cursor = '';
        });
    } else {
        map.getSource(`dynamic-line-${feature.properties.timestampStart}`).setData(lineData);
    }

    /*const normalizedMode = normalizeTravelMode(feature.properties.travelMode);
    const distance = feature.properties.distanceMeters;
    const yearMap = activitiesMap.get(year);
    const current = yearMap.get(normalizedMode) || 0;
    yearMap.set(normalizedMode, current + distance);    */
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

function removeLines() {
    Object.values(activitySegmentList).forEach(segment => {
        removeLineFromMap(segment.properties.timestampStart)
    });
}

function hideMarkers() {
    Object.values(placeVisitList).forEach(place => {
        if (place.properties.marker != undefined) {
            place.properties.marker.getElement().style.display = 'none';
        }
    });
}

function hideLines() {
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

function removeLineFromMap(timestamp) {
    if (map.getLayer(`dynamic-line-${timestamp}`)) {
      map.removeLayer(`dynamic-line-${timestamp}`);
    }
    if (map.getSource(`dynamic-line-${timestamp}`)) {
      map.removeSource(`dynamic-line-${timestamp}`);
    }
  }