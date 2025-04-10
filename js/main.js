let calendar

document.addEventListener("DOMContentLoaded", function () {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach(function (tooltipTriggerEl) {
        new bootstrap.Tooltip(tooltipTriggerEl);
    });

    calendar = flatpickr("#calendar", {
        inline: true,
        mode: "single",
        dateFormat: "Y-m-d",
        enable: [],
        onChange: function(selectedDates, dateStr) {
            hideMarkers()
            bounds = new maplibregl.LngLatBounds();
            document.getElementById("day-details-list").replaceChildren()

            let features = filterPlaceVisitByDate(dateStr);
            features.forEach(f => {
                showMarker(f);
                addActivityDetails(f)
                if (f.properties.marker != undefined) extendBounds(f);
            });

            fitMapBounds()
        },
        onDayCreate: function(dObj, dStr, fp, dayElem) {
            dayElem.classList.add("highlight-enabled-day");
        }
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

document.getElementById('btnClearCalendar').addEventListener('click', () => {
    calendar.clear()
    let placeVisitDateList = getPlaceVisitDateList()
    calendar.set('enable', placeVisitDateList)
    calendar.jumpToDate(placeVisitDateList[placeVisitDateList.length - 1]);
});

document.getElementById('btnClearData').addEventListener('click', () => {
    removeMarkers()

    document.getElementById('yearsCheckboxCol1').replaceChildren();
    document.getElementById('yearsCheckboxCol2').replaceChildren();
    yearColorMap = {};

    const btnClear = document.getElementById('btnClearData');
    btnClear.className = 'btn btn-secondary btn-sm';
    btnClear.disabled = true;

    document.getElementById('globalStatsCardGrid').replaceChildren()  
    document.getElementById('statsCardGrid').replaceChildren()   
    
    $("#fileInput")[0].value = ''; // Reset the file input to allow to upload again the same year

    map.flyTo({ center: [0,20], zoom: 2 });
    resetChartStats()

    calendar.set('enable', [])
    calendar.redraw();

    document.getElementById("btnClearCalendar").disabled = true;
});

document.getElementById('btnImport').addEventListener('click', () => {
    document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', async function (event) {
    const files = event.target.files;
    if (!files.length) return;

    showLoadingState(true);    

    for (const file of files) {
        if (!file.name.endsWith('.json')) continue;
        await processFile(file);
    }

    //updateStatsTab(locationsMap, activitiesMap); PENDING
    fitMapBounds()

    showLoadingState(false);
    enableClearButton(true);
    
    let placeVisitDateList = getPlaceVisitDateList()
    calendar.set('enable', placeVisitDateList)
    calendar.jumpToDate(placeVisitDateList[placeVisitDateList.length - 1]);
    calendar.redraw();
    document.getElementById("btnClearCalendar").disabled = false;
});

const tabs = document.querySelectorAll('.nav-link');
tabs.forEach(tab => {
    tab.addEventListener('click', function (e) {        
        const target = e.target.getAttribute('data-bs-target');

        // Hide map when Stats tab is selected
        if (target === '#tab-stats') {
            document.getElementById('map').style.display = 'none';
            document.getElementById('stats').style.display = 'block';
        } else if (target === '#tab-map') {
            document.getElementById('map').style.display = 'block';
            document.getElementById('stats').style.display = 'none';
        }
    });
});

const rangeInput = document.getElementById("customRange");
const rangeValue = document.getElementById("rangeValue");

rangeInput.addEventListener("input", function () {
    rangeValue.textContent = this.value;
});
