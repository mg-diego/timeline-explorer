
let yearColorMap = {};
let yearMarkersMap = {};

document.addEventListener("DOMContentLoaded", function () {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach(function (tooltipTriggerEl) {
        new bootstrap.Tooltip(tooltipTriggerEl);
    });
});

document.addEventListener('change', function (e) {
    if (e.target.classList.contains('year-checkbox')) {
        const year = e.target.getAttribute('data-year');
        const show = e.target.checked;
        yearMarkersMap[year]?.forEach(marker => {
            if (show) marker.addTo(map);
            else marker.remove();
        });
    }
});

document.getElementById('btnClearData').addEventListener('click', () => {
    Object.values(yearMarkersMap).flat().forEach(marker => marker.remove());

    const yearsLabel = document.getElementById('years-label')
    if (yearsLabel != null) yearsLabel.style.display = 'none'

    const yearsLegend = document.getElementById('legend')
    yearsLegend.replaceChildren();           

    yearColorMap = {};
    yearMarkersMap = {};

    const btnClear = document.getElementById('btnClearData');
    btnClear.className = 'btn btn-secondary btn-sm';
    btnClear.disabled = true;

    document.getElementById('globalStatsCardGrid').replaceChildren()  
    document.getElementById('statsCardGrid').replaceChildren()   
    
    $("#fileInput")[0].value = ''; // Reset the file input to allow to upload again the same year

    map.flyTo({ center: [0,20], zoom: 2 });
});

document.getElementById('btnImport').addEventListener('click', () => {
    document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', async function (event) {
    const files = event.target.files;
    if (!files.length) return;

    const btn = document.getElementById('btnImport');
    btn.innerHTML = '<span class="spinner-border spinner-border-sm" aria-hidden="true"></span><span role="status"> Loading...</span>';
    btn.disabled = true;

    // Years label
    const yearsLabel = document.getElementById('years-label')
    if (yearsLabel != null) yearsLabel.style.display = "block";           

    const bounds = new maplibregl.LngLatBounds();
    let locationsMap = new Map();
    let activitiesMap = new Map();

    for (const file of files) {
        if (!file.name.endsWith('.json')) continue;  // Skip non-JSON files

        const reader = new FileReader();
        const year = file.name.split(/[-_]/)[0];

        // Wrap the reader.onload in a Promise to use await
        await new Promise((resolve, reject) => {
            reader.onload = function (e) {
                try {
                    const data = JSON.parse(e.target.result);
                    const geojson = convertToGeoJSON(data);

                    // Initialize the year if not already done
                    if (!yearColorMap[year]) {
                        locationsMap.set(year, 0);
                        activitiesMap.set(year, new Map());

                        yearColorMap[year] = getRandomColor();
                        yearMarkersMap[year] = [];

                        // Add checkbox to the legend
                        const label = document.createElement('label');
                        label.innerHTML = `
                            <input type="checkbox" class="year-checkbox" data-year="${year}" checked />
                            <span style="display:inline-block;width:12px;height:12px;background:${yearColorMap[year]};margin-right:6px;"></span>
                            ${year}`;
                            document.getElementById('legend').appendChild(label);
                    }

                    const markerColor = yearColorMap[year];

                    geojson.features.forEach(feature => {
                        if (feature.geometry.type === "Point" && feature.properties.type === "placeVisit") {
                            const loc = feature.geometry.coordinates;
                            const props = feature.properties;

                            // Optional filtering by confidence
                            const original = data.timelineObjects.find(obj =>
                                obj.placeVisit?.location.placeId === props.placeId
                            );
                            const confidence = original?.placeVisit?.location?.locationConfidence || 100;
                            if (confidence < document.getElementById("customRange").value) return;  // Skip low-confidence markers

                            // Create and set up the popup
                            const popupHTML = `<h6><strong>${props.name}</strong></h6><br>${props.address}<br><em>${formatTimestamp(props.timestampStart)}</em>`;
                            const popup = new maplibregl.Popup({ offset: 25 })//.setHTML(popupHTML);

                            popup.on('open', () => {
                                const [lon, lat] = loc; // GeoJSON order is [lon, lat]
                                popup.setHTML('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span><span class="sr-only"> Loading...</span>');

                                fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`)
                                        .then(res => res.json())
                                        .then(data => {
                                            const place = data.display_name || 'Unknown location';
                                            popup.setHTML(`<strong>${props.name}</strong><br>${place}<br><em>${formatTimestamp(props.timestampStart)}</em><br><br>Confidence: ${confidence}`);
                                    })
                                    .catch(err => {
                                        console.error('Nominatim error:', err);
                                        popup.setHTML(`<strong>${props.name}</strong><br><em>Could not load address</em>`);
                                    });
                            });

                            // Add the marker to the map
                            const marker = new maplibregl.Marker({ color: markerColor })
                                .setLngLat(loc)
                                .setPopup(popup)
                                .addTo(map);

                            yearMarkersMap[year].push(marker);
                            bounds.extend(loc);

                            // Update the count of markers for the year
                            locationsMap.set(year, (locationsMap.get(year) || 0) + 1);
                        }

                        if (feature.geometry.type === "LineString" && feature.properties.type === "activitySegment") {
                            let activitiesMapProperties = new Map();
                            let travelMode = "";

                            if (feature.properties.travelMode === "IN_VEHICLE" || feature.properties.travelMode === "IN_PASSENGER_VEHICLE") {
                                feature.properties.travelMode = "DRIVE";
                            }
                            else if(feature.properties.travelMode === "BICYCLE" || feature.properties.travelMode === "WALKING" ) {
                                feature.properties.travelMode = "WALK";
                            }
                            else if(feature.properties.travelMode === "IN_TRAM") {
                                feature.properties.travelMode = "IN_SUBWAY";
                            }
                            
                            let currentDistance = activitiesMap.get(year).get(feature.properties.travelMode) || 0;  
                            activitiesMap.get(year).set(feature.properties.travelMode, currentDistance + feature.properties.distanceMeters);
                        }
                    });

                    resolve();
                } catch (err) {
                    console.error("Error parsing JSON in file:", file.name, err);
                    reject(err);
                }
            };

            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    updateStatsTab(locationsMap, activitiesMap);
    setTimeout(() => map.fitBounds(bounds, { padding: 50 }), 500);

    const btnImport = document.getElementById('btnImport');
    btnImport.innerHTML = 'Import Data';
    btnImport.disabled = false;

    const btnClear = document.getElementById('btnClearData');
    btnClear.className = 'btn btn-danger';
    btnClear.disabled = false;
});

const tabs = document.querySelectorAll('.nav-link');
    tabs.forEach(tab => {
        tab.addEventListener('click', function (e) {
            const target = e.target.getAttribute('data-bs-target');

            // Hide map when Stats tab is selected
            if (target === '#tab-stats') {
                document.getElementById('map').style.display = 'none';
                document.getElementById('activities').style.display = 'none';
                document.getElementById('stats').style.display = 'block';
            } else if (target === '#tab-map') {
                document.getElementById('map').style.display = 'block';
                document.getElementById('activities').style.display = 'none';
                document.getElementById('stats').style.display = 'none';
            } else if (target === '#tab-activities') {
                document.getElementById('map').style.display = 'none';
                document.getElementById('activities').style.display = 'block';
                document.getElementById('stats').style.display = 'none';
            }
        });
    });
