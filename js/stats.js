let totals = {
    WALK: 0,
    IN_SUBWAY: 0,
    IN_BUS: 0,
    DRIVE: 0,
    IN_TRAIN: 0,
    FLYING: 0
};

let locationsMapStats = new Map()

function updateStatsTab(locationsMap, activitiesMap) {
    const totals = computeTotalActivities(activitiesMap);
    const totalMarkers = computeTotalMarkers(locationsMap);

    renderGlobalStatsCard(totalMarkers, totals);
    renderMarkersChart(locationsMap);
    renderActivitiesChart(totals);
    renderYearlyCards(locationsMap, activitiesMap);
}

function computeTotalActivities(activitiesMap) {
    activitiesMap.forEach(activityMap => {
        for (const type in totals) {
            totals[type] += activityMap.get(type) || 0;
        }
    });

    return totals;
}

function computeTotalMarkers(locationsMap) {
    return Array.from(locationsMap.values()).reduce((a, b) => a + b, 0);
}

function renderGlobalStatsCard(totalMarkers, totals) {
    const totalDistance = Object.values(totals).reduce((a, b) => a + b, 0);
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
                                <h5><strong>📌 Markers:</strong> ${totalMarkers}</h5>
                                <canvas id="markers-chart" width="600" height="600"></canvas>
                            </div>
                            <div class="col">
                                <h5><strong>✨ Activities: ${formatChartDistanceValue(totalDistance)} km</strong></h5>
                                <canvas id="activities-chart" width="300" height="300"></canvas>
                            </div>
                        </div>
                    </li>
                </ul>
            </div>
        </div>`;

    document.getElementById('globalStatsCardGrid').innerHTML = html;
}

function renderMarkersChart(locationsMap) {
    locationsMapStats = new Map([...locationsMapStats, ...locationsMap]);
    const sortedMap = new Map([...locationsMapStats].sort(([keyA], [keyB]) => keyA.localeCompare(keyB)));
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
    const ctx = document.getElementById('activities-chart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['🚶 Walk', '🚇 Subway', '🚌 Bus', '🚗 Car', '🚅 Train', '✈️ Flight'],
            datasets: [{
                label: 'Distance (km)',
                data: Object.values(totals).map(formatDistanceValue),
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
                            <tr><td>🚶 Walk:</td><td>${formatChartDistanceValue(activities.get("WALK"))} km</td></tr>
                            <tr><td>🚇 Subway:</td><td>${formatChartDistanceValue(activities.get("IN_SUBWAY"))} km</td></tr>
                            <tr><td>🚌 Bus:</td><td>${formatChartDistanceValue(activities.get("IN_BUS"))} km</td></tr>
                            <tr><td>🚗 Car:</td><td>${formatChartDistanceValue(activities.get("DRIVE"))} km</td></tr>
                            <tr><td>🚅 Train:</td><td>${formatChartDistanceValue(activities.get("IN_TRAIN"))} km</td></tr>
                            <tr><td>✈️ Flight:</td><td>${formatChartDistanceValue(activities.get("FLYING"))} km</td></tr>
                        </tbody></table>
                    </li>
                </ul>
            </div>
        </div>`;

        container.innerHTML += html;
    });
}

function resetChartStats() {
    for (const type in totals) {
        totals[type] = 0
    }
}
