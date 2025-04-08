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

function convertToGeoJSON(timelineData) {
    const features = [];

    timelineData.timelineObjects.forEach((obj) => {
        if (obj.placeVisit) {
            const loc = obj.placeVisit.location;
            features.push({
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [loc.longitudeE7 / 1e7, loc.latitudeE7 / 1e7]
                },
                properties: {
                    type: "placeVisit",
                    name: loc.name || "Unknown",
                    address: loc.address || "",
                    placeId: loc.placeId || null,
                    timestampStart: obj.placeVisit.duration.startTimestamp,
                    timestampEnd: obj.placeVisit.duration.endTimestamp
                }
            });
        }

        if (obj.activitySegment) {
            const waypoints = obj.activitySegment.waypointPath?.waypoints || [];
            const coordinates = waypoints.map(wp => [wp.lngE7 / 1e7, wp.latE7 / 1e7]);

            // Add start and end if no waypoints
            if (coordinates.length === 0) {
                coordinates.push(
                    [obj.activitySegment.startLocation.longitudeE7 / 1e7, obj.activitySegment.startLocation.latitudeE7 / 1e7],
                    [obj.activitySegment.endLocation.longitudeE7 / 1e7, obj.activitySegment.endLocation.latitudeE7 / 1e7]
                );
            }
            
            let activityTypeParsed = obj.activitySegment?.activityType != null
                ? obj.activitySegment.activityType
                : obj.activitySegment.activities[0].activityType

            features.push({
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: coordinates
                },
                properties: {
                    type: "activitySegment",
                    activityType: activityTypeParsed,
                    travelMode: obj.activitySegment.waypointPath?.travelMode != null 
                        ? obj.activitySegment.waypointPath.travelMode 
                        : activityTypeParsed,
                    distanceMeters: haversineDistanceE7(coordinates),
                    confidence: obj.activitySegment.waypointPath?.confidence,
                    timestampStart: obj.activitySegment.duration.startTimestamp,
                    timestampEnd: obj.activitySegment.duration.endTimestamp
                }
            });
        }
    });

    return {
        type: "FeatureCollection",
        features
    };
}

