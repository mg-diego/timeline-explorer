function getRandomColor() {
    const pantoneColors = [
        "#F44336", "#4CAF50", "#2196F3", "#FFEB3B", "#9C27B0", "#FF9800", "#00BCD4", "#795548"
    ];
    const index = Math.floor(Math.random() * pantoneColors.length);
    return pantoneColors[index];
}

function formatTimestamp(ts) {
    const date = new Date(ts);
    return `${date.getDate().toString().padStart(2, '0')}-` +
           `${(date.getMonth()+1).toString().padStart(2, '0')}-` +
           `${date.getFullYear()} ` +
           `${date.getHours().toString().padStart(2, '0')}:` +
           `${date.getMinutes().toString().padStart(2, '0')}:` +
           `${date.getSeconds().toString().padStart(2, '0')}h`;
}

function formatDistanceValue(distance) {
    return distance === undefined ? 0 : (distance / 1000).toFixed(2);
}

function formatChartDistanceValue(distance) {    
    return distance === undefined ? 0 : (distance / 1000).toLocaleString('de-DE', {maximumFractionDigits: 0});
}

function haversineDistanceE7(coordinates) {
    const toRadians = degrees => degrees * (Math.PI / 180);

    // Convert E7 to decimal degrees
    const lat1 = coordinates[0][0]
    const lon1 = coordinates[0][1]
    const lat2 = coordinates[1][0]
    const lon2 = coordinates[1][1]

    const R = 6371000; // Earth's radius in meters
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

function extractYearFromFilename(filename) {
    return filename.split(/[-_]/)[0];
}

function showLoadingState(isLoading) {
    const btn = document.getElementById('btnImport');
    btn.innerHTML = isLoading
        ? '<span class="spinner-border spinner-border-sm" aria-hidden="true"></span><span role="status"> Loading...</span>'
        : 'Import Data';
    btn.disabled = isLoading;
}

function enableClearButton(enabled) {
    const btn = document.getElementById('btnClearData');
    btn.className = enabled ? 'btn btn-danger' : 'btn btn-secondary btn-sm';
    btn.disabled = !enabled;
}

function normalizeTravelMode(mode) {
    if (["IN_VEHICLE", "IN_PASSENGER_VEHICLE"].includes(mode)) return "DRIVE";
    if (["BICYCLE", "WALKING"].includes(mode)) return "WALK";
    if (mode === "IN_TRAM") return "IN_SUBWAY";
    return mode;
}

function formatDate(dt) {
    let date = new Date(dt);
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };

    return date.toLocaleDateString('en-US', options);
}

function addActivityDetails(feature) {
    const ul = document.getElementById("day-details-list");
    const li = document.createElement("li");

    li.className = "list-group-item";
    li.innerHTML = `<strong>${feature.properties.name}</strong><br>  ${feature.properties.address}<br> <br><u>Confidence:</u> <span style="color: green;">${feature.properties.locationConfidence}</span>`

    ul.appendChild(li);
}

function addActivityDay(date) {
    const ul = document.getElementById("day-details-list");
    const li = document.createElement("li");

    li.className = "list-group-item";
    li.style = "background-color: lightgray";
    li.innerHTML = `<strong>${date}</strong>`;

    ul.appendChild(li);
}

function updateMapAndAddActivityDetails(selectedDates) {
    hideMarkers()
    removeLines()
    bounds = new maplibregl.LngLatBounds();
    document.getElementById("day-details-list").replaceChildren()

    let places = filterPlaceVisitByDateAndConfidence(selectedDates);
    
    let lastDay = ''

    places.forEach(p => {
        let formatDateValue = formatDate(p.properties.timestampStart)
        showMarker(p);
        if (formatDateValue != lastDay) {
            lastDay = formatDateValue;
            addActivityDay(formatDateValue)
        }
        addActivityDetails(p)
        if (p.properties.marker != undefined) extendBounds(p);
    });

    if (selectedDates[0] != '') {
        let activities = filterActivitySegmentByDateAndConfidence(selectedDates)
        activities.forEach(a => {
            handleActivitySegment(a, undefined)
        })
    }

    fitMapBounds()
}