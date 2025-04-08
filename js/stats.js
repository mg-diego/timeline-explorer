function updateStatsTab(locationsMap, activitiesMap) {

    let totalWalk = 0;
    let totalSubway = 0;
    let totalBus = 0;
    let totalDrive = 0;
    let totalTrain = 0;
    let totalFlying = 0;

    console.log(activitiesMap)
    activitiesMap.forEach((activityMap) => {
        totalWalk += activityMap.get("WALK") || 0;
        totalSubway += activityMap.get("IN_SUBWAY") || 0;
        totalDrive += activityMap.get("DRIVE") || 0;
        totalBus += activityMap.get("IN_BUS") || 0;
        totalTrain += activityMap.get("IN_TRAIN") || 0;
        totalFlying += activityMap.get("FLYING") || 0;
    });

    const activitiesArrayValues = [totalWalk, totalSubway, totalBus, totalDrive, totalTrain, totalFlying]

    const globalCardHTML = `
        <div class="col">
            <div class="card" >
                <div class="card-header">
                    <h4><strong>GLOBAL STATS</strong><h4>
                </div>
                <ul class="list-group list-group-flush">
                    <li class="list-group-item">
                        <div class="row">
                            <div class="col">
                                <h5><strong>📌 Markers:</strong> ${Array.from(locationsMap.values()).reduce((accumulator, currentValue) => accumulator + currentValue, 0)}</h5>
                                <canvas id="markers-chart" width="600" height="600"></canvas>
                            </div>
                            <div class="col">
                                <h5><strong>✨ Activities: ${formatChartDistanceValue(activitiesArrayValues.reduce((accumulator, currentValue) => accumulator + currentValue, 0))} km</strong></h5>
                                <canvas id="activities-chart" width="300" height="300"></canvas>
                            </div>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    `;            
    const globalCardGrid = document.getElementById('globalStatsCardGrid');
    globalCardGrid.innerHTML += globalCardHTML;

    const markersChart = document.getElementById('markers-chart').getContext('2d');
    new Chart(markersChart, {
        type: 'bar',
        data: {
            labels: Array.from(locationsMap.keys()).reverse(),
            datasets: [{
                label: "Markers",
                data: Array.from(locationsMap.values()).reverse(), // convert meters to km
                backgroundColor: [
                    '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#FF5722', '#00BCD4'
                ]
            }]
        },
        options: {
            responsive: false, // Makes the chart responsive
            maintainAspectRatio: false, // Prevents the chart from maintaining its aspect ratio
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    const activitiesChart = document.getElementById('activities-chart').getContext('2d');
    new Chart(activitiesChart, {
        type: 'doughnut', // Change type to 'doughnut'
        data: {
            labels: ['🚶 Walk', '🚇 Subway', '🚌 Bus', '🚗 Car', '🚅 Train', '✈️ Flight'],
            datasets: [{
                label: 'Distance (km)',
                data: activitiesArrayValues.map(d => formatDistanceValue(d)), // Convert meters to km
                backgroundColor: [
                    '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#FF5722', '#00BCD4'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top', // You can change the position as 'top', 'left', 'bottom', 'right'
                },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            return `${tooltipItem.label}: ${tooltipItem.raw} km`; // Customizing the tooltip
                        }
                    }
                },
                datalabels: {
                    color: '#FFFFFF', // Change data label text color (e.g., black)
                    font: {
                        weight: 'bold'
                    },
                    formatter: (value) => {
                        return value + ' km'; // Display value with unit
                    }
                }
            },
            cutout: '70%', // Adjust cutout percentage for the center hole
            rotation: -90, // Rotate the chart for better display
        },
        plugins: [ChartDataLabels]
    });

    locationsMap.forEach((markers, year) => {
        const activities = activitiesMap.get(year)
        const cardHTML = `
        <div class="col" style="margin-bottom:30px">
            <div class="card">
                <div class="card-header">
                    <h5><strong>${year}</strong><h5>
                </div>
                <ul class="list-group list-group-flush">
                    <li class="list-group-item"><strong>📌 Markers:</strong> ${markers}</li>
                    <li class="list-group-item">
                        <strong>✨ Activities: </strong><br><br>
                        <table>
                            <tbody>
                                <tr><td>🚶 Walk:  </td><td>${formatChartDistanceValue(activities.get("WALK"))} km</td></tr>
                                <tr><td>🚇 Subway:  </td><td>${formatChartDistanceValue(activities.get("IN_SUBWAY"))} km</td></tr>
                                <tr><td>🚌 Bus:  </td><td>${formatChartDistanceValue(activities.get("IN_BUS"))} km</td></tr>
                                <tr><td>🚗 Car:  </td><td>${formatChartDistanceValue(activities.get("DRIVE"))} km</td></tr>
                                <tr><td>🚅 Train:  </td><td>${formatChartDistanceValue(activities.get("IN_TRAIN"))} km</td></tr>
                                <tr><td>✈️ Flight:  </td><td>${formatChartDistanceValue(activities.get("FLYING"))} km</td></tr>
                            </tbody>
                        </table>
                    </li>
                </ul>
            </div>
        </div>
        `;
        
        // Append the new card to the grid
        const cardGrid = document.getElementById('statsCardGrid');
        cardGrid.innerHTML += cardHTML; // Adds the new card to the existing grid
    });
}