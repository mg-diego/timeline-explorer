let activityDetails = {
    WALK: 0,
    IN_SUBWAY: 0,
    IN_BUS: 0,
    DRIVE: 0,
    IN_TRAIN: 0,
    FLYING: 0
};

let locationTotalsPerYear = new Map();
let locationTotalsPerCountry = new Map();
let activityTotalsPerYear = new Map();

function updateStatsTab(locationsMap, activitiesMap) {
    locationTotalsPerYear = new Map([...locationTotalsPerYear, ...computeTotalLocationsPerYear(locationsMap)]);
    activityTotalsPerYear = computeTotalActivitiesPerYear(activitiesMap);
    locationTotalsPerCountry = computeTotalLocationsPerCountry(locationsMap)
    console.log(locationTotalsPerCountry)

    renderGlobalStatsCard(locationTotalsPerYear, activityTotalsPerYear);
    renderMarkersChart(locationTotalsPerYear);
    renderActivitiesChart(activityTotalsPerYear);
    renderYearlyCards(locationTotalsPerYear, activityTotalsPerYear);
}

function renderGlobalStatsCard(locationTotalsPerYear, activityTotalsPerYear) {
    let totalLocations = 0
    for (let value of locationTotalsPerYear.values()) {
        totalLocations += value;
    }

    let totalDistance = 0
    for (let activityDetails of activityTotalsPerYear.values()) {
        for (let distance of Object.values(activityDetails)) {
            totalDistance += distance;
        }
    }

    const html = `
        <div class="col">
            <div class="card">
                <div class="card-header">
                    <h4><strong>GLOBAL STATS</strong></h4>
                </div>
                <ul class="list-group list-group-flush">
                    <li class="list-group-item">
                        <div class="row">
                            <div class="col">
                                <h5><strong>📌 Markers:</strong> ${totalLocations}</h5>
                                <canvas id="markers-chart" width="600" height="600"></canvas>
                            </div>
                            <div class="col">
                                <h5><strong>✨ Activities:</strong> ${formatChartDistanceValue(totalDistance)} km</h5>
                                <canvas id="activities-chart" width="300" height="300"></canvas>
                            </div>
                        </div>
                    </li>
                </ul>
            </div>
        </div>`;

    document.getElementById('globalStatsCardGrid').innerHTML = html;
}

function renderMarkersChart(locationTotalsPerYear) {
    const sortedMap = new Map([...locationTotalsPerYear].sort(([keyA], [keyB]) => keyA - keyB));
    const ctx = document.getElementById('markers-chart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Array.from(sortedMap.keys()),
            datasets: [{
                label: 'Markers',
                data: Array.from(sortedMap.values()),
                backgroundColor: ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#FF5722', '#00BCD4']
            }]
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function renderActivitiesChart(totals) {
    const totalPerCategory = {};

    for (const [year, activityMap] of totals) {
        for (const [category, distance] of Object.entries(activityMap)) {
            totalPerCategory[category] = (totalPerCategory[category] || 0) + distance;
        }
    }

    const ctx = document.getElementById('activities-chart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(totalPerCategory), //['🚶 Walk', '🚇 Subway', '🚌 Bus', '🚗 Car', '🚅 Train', '✈️ Flight'],
            datasets: [{
                label: 'Distance (km)',
                data: Object.values(totalPerCategory).map(formatDistanceValue),
                backgroundColor: ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#FF5722', '#00BCD4'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: tooltipItem => `${tooltipItem.label}: ${tooltipItem.raw} km`
                    }
                },
                datalabels: {
                    color: '#FFFFFF',
                    font: { weight: 'bold' },
                    formatter: value => `${value} km`
                }
            },
            cutout: '70%',
            rotation: -90
        },
        plugins: [ChartDataLabels]
    });
}

function renderYearlyCards(locationsMap, activitiesMap) {
    // PENDING
    const container = document.getElementById('statsCardGrid');
    locationsMap.forEach((markers, year) => {
        const activities = activitiesMap.get(year);
        const html = `
        <div class="col" style="margin-bottom:30px">
            <div class="card">
                <div class="card-header">
                    <h5><strong>${year}</strong></h5>
                </div>
                <ul class="list-group list-group-flush">
                    <li class="list-group-item"><strong>📌 Markers:</strong> ${markers}</li>
                    <li class="list-group-item">
                        <strong>✨ Activities:</strong><br><br>
                        <table><tbody>
                            <tr><td>🚶 Walk:</td><td>${formatChartDistanceValue(activities["WALKING"])} km</td></tr>
                            <tr><td>🚇 Subway:</td><td>${formatChartDistanceValue(activities["IN_SUBWAY"])} km</td></tr>
                            <tr><td>🚌 Bus:</td><td>${formatChartDistanceValue(activities["IN_BUS"])} km</td></tr>
                            <tr><td>🚗 Car:</td><td>${formatChartDistanceValue(activities["IN_PASSENGER_VEHICLE"])} km</td></tr>
                            <tr><td>🚅 Train:</td><td>${formatChartDistanceValue(activities["IN_TRAIN"])} km</td></tr>
                            <tr><td>✈️ Flight:</td><td>${formatChartDistanceValue(activities["FLYING"])} km</td></tr>
                        </tbody></table>
                    </li>
                </ul>
            </div>
        </div>`;

        container.innerHTML += html;
    })
}

function resetChartStats() {
    locationTotalsPerYear = new Map();
    activityTotalsPerYear = new Map();
}

function computeTotalLocationsPerYear(map) {
    const yearMap = new Map();

    map.forEach(m => {
        const timestamp = m.properties?.timestampStart;
        if (timestamp) {
            const year = new Date(timestamp).getUTCFullYear();
            if (!locationTotalsPerYear.get(year)) {
                yearMap.set(year, (yearMap.get(year) || 0) + 1);
            }
        }
    });
    return yearMap;
}

function computeTotalLocationsPerCountry(map) {
    const yearMap = new Map();

    map.forEach(m => {
        const country = m.properties?.country;
        if (country) {
            if (!locationTotalsPerYear.get(country)) {
                yearMap.set(country, (yearMap.get(country) || 0) + 1);
            }
        }
    });
    return yearMap;
}

function computeTotalActivitiesPerYear(activitiesMap) {
    const yearMap = new Map();

    activitiesMap.forEach(activityMap => {
        const timestamp = activityMap.properties?.timestampStart;
        const activityType = activityMap.properties?.activityType;
        const distance = activityMap.properties?.distanceMeters || 0;

        if (timestamp && activityType) {
            const year = new Date(timestamp).getUTCFullYear();

            // Get or create the map for this year
            let activityDetails = yearMap.get(year);
            if (!activityDetails) {
                activityDetails = {};
                yearMap.set(year, activityDetails);
            }

            // Accumulate the distance for the activity type
            activityDetails[activityType] = (activityDetails[activityType] || 0) + distance;
        }
    });

    return yearMap;
}
