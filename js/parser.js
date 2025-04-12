let placeVisitList = []
let activitySegmentList = []

let yearColorMap = {};

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
                    timestampEnd: obj.placeVisit.duration.endTimestamp,
                    locationConfidence: loc.locationConfidence || 0,
                    marker: undefined
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
                    locationConfidence: obj.activitySegment.waypointPath?.confidence * 100 || 0,
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

async function processFeatures(geojson, year) {
    for (let feature of geojson.features) {
        if (feature.geometry.type === "Point" && feature.properties.type === "placeVisit") {
            let newMarker = await handlePlaceVisit(feature, yearColorMap[year]);
            feature.properties.marker = newMarker
            placeVisitList.push(feature)
        } else if (feature.geometry.type === "LineString" && feature.properties.type === "activitySegment") {
            activitySegmentList.push(feature) // Do not render all the segments in the initial load to avoid performance issues.
        }
    }
}

async function processFile(file) {    
    const year = extractYearFromFilename(file.name);

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                const geojson = convertToGeoJSON(data);

                if (!yearColorMap[year]) {
                    addYearCheckbox(year);
                }

                await processFeatures(geojson, year);
                resolve();
            } catch (err) {
                console.error("Error parsing JSON:", file.name, err);
                reject(err);
            }
        };

        reader.onerror = reject;
        reader.readAsText(file);
    });
}

function addYearCheckbox(year) {
    if (!yearColorMap[year]) {
        yearColorMap[year] = getRandomColor();

        // Crear y añadir checkbox
        const label = document.createElement('label');
        label.innerHTML = `
            <span style="display:inline-block;width:12px;height:12px;background:${yearColorMap[year]};margin-left:6px;"></span>
            ${year}`;
        document.getElementById("legend").appendChild(label);
    }
}

function filterPlaceVisitByDateAndConfidence(dates) {
    const confidenceThreshold = document.getElementById("customRange").value;

    const places = placeVisitList.filter(feature => {
        const timestamp = feature.properties?.timestampStart;
        return (
            dates.some(date => timestamp?.includes(date)) &&
            feature.properties?.locationConfidence >= confidenceThreshold
        );
    });

    return places
        .sort((a, b) => new Date(a.properties.timestampStart) - new Date(b.properties.timestampStart))
        .reverse();
}

function getPlaceVisitDateListByConfidence() {
    let dates = []
    placeVisitList.forEach(p => {
        if(p.properties?.locationConfidence >= document.getElementById("customRange").value){
            dates.push(p.properties?.timestampStart)
        } 
    });
    return dates.sort()
}

function filterActivitySegmentByDateAndConfidence(dates) {
    const confidenceThreshold = document.getElementById("customRange").value;

    const activities = activitySegmentList.filter(feature => {
        const timestamp = feature.properties?.timestampStart;
        return (
            dates.some(date => timestamp?.includes(date)) && feature.properties?.locationConfidence >= confidenceThreshold
        );
    });

    return activities
        .sort((a, b) => new Date(a.properties.timestampStart) - new Date(b.properties.timestampStart))
        .reverse();
}