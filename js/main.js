// Global variables
let calendar;
let calendarSelectedDates = [''];

// Initialize application
document.addEventListener("DOMContentLoaded", () => {
    initializeTooltip();
    initializeCalendar();
    bindEventListeners();
});

// Initialize Bootstrap tooltips
function initializeTooltip() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
}

// Initialize Flatpickr calendar
function initializeCalendar() {
    calendar = flatpickr("#calendar", {
        inline: true,
        mode: "multiple",
        dateFormat: "Y-m-d",
        enable: [],
        onChange: handleCalendarChange,
        onDayCreate: handleDayCreate,
    });
}

// Handle calendar date selection
function handleCalendarChange(selectedDates, dateStr) {
    calendarSelectedDates = dateStr.split(",").map(date => date.trim());
    console.log(selectedDates)
    updateMapAndAddActivityDetails(calendarSelectedDates);
    if (selectedDates.length === 0) {
        removeLines()
        document.getElementById("btnClearCalendar").disabled = true;
    } else {
        document.getElementById("btnClearCalendar").disabled = false;
    }
    
}

// Add a class to each day in the calendar
function handleDayCreate(dObj, dStr, fp, dayElem) {
    dayElem.classList.add("highlight-enabled-day");
}

// Bind event listeners to DOM elements
function bindEventListeners() {
    document.getElementById('btnClearCalendar').addEventListener('click', clearCalendar);
    document.getElementById('btnClearData').addEventListener('click', clearData);
    document.getElementById('btnImport').addEventListener('click', triggerFileInput);
    document.getElementById('fileInput').addEventListener('change', handleFileInputChange);    
    document.getElementById("customRange").addEventListener("change", handleCustomRangeChange);
    setupTabNavigation();
}

// Clear calendar selection and reset date
function clearCalendar() {
    calendar.clear();
    calendarSelectedDates = ['']
    removeLines();
    refresh()
}

// Clear all data and reset state
function clearData() {
    removeMarkers();
    removeLines();
    resetClearDataButton();
    resetFileInput(); 
    resetCalendarState();     
    clearActivityDetails();
    resetStatsTab();
    resetMapView();
}

// Reset the button for clearing data
function resetClearDataButton() {
    const btnClear = document.getElementById('btnClearData');
    btnClear.className = 'btn btn-secondary btn-sm';
    btnClear.disabled = true;
}

// Clear stats displayed on the page
function clearActivityDetails() {
    document.getElementById("day-details-list").replaceChildren();
    document.getElementById("legend").replaceChildren()
}

// Reset the file input to allow uploading again
function resetFileInput() {
    $("#fileInput")[0].value = ''; // Reset file input
}

// Reset calendar to initial state
function resetCalendarState() {
    const customRange = document.getElementById("customRange")
    customRange.disabled = true;
    customRange.value = "0";    

    calendar.set('enable', []);
    calendar.redraw();    
    document.getElementById("btnClearCalendar").disabled = true;
}

// Reset map view
function resetMapView() {
    map.flyTo({ center: [0, 20], zoom: 2 });
}

// Reset chart stats
function resetStatsTab() {
    resetChartStats()
    document.getElementById('globalStatsCardGrid').replaceChildren();
    document.getElementById('statsCardGrid').replaceChildren();
    document.getElementById('data-placeholder').style.display = "block";
}

// Trigger the file input dialog
function triggerFileInput() {
    document.getElementById('fileInput').click();
}

// Handle file input change (processing uploaded files)
async function handleFileInputChange(event) {
    const files = event.target.files;
    if (!files.length) return;

    showLoadingState(true);

    for (const file of files) {
        if (file.name.endsWith('.json')) {
            await processFile(file);
        }
    }

    fitMapBounds();
    showLoadingState(false);
    enableClearButton(true);

    document.getElementById("customRange").disabled = false;
    document.getElementById("customRange").value = 80
    updateMapAndAddActivityDetails(calendarSelectedDates);
    refresh()

    document.getElementById("btnClearCalendar").disabled = false;
    
    document.getElementById('data-placeholder').style.display = "none";
    updateStatsTab(placeVisitList, activitySegmentList)
}

// Handle custom range change
function handleCustomRangeChange() {
    setTimeout(() => {
        if (document.getElementById("customRange").disabled != true) {            
            updateMapAndAddActivityDetails(calendarSelectedDates);
            refresh(calendarSelectedDates)
        }
    }
    , 500);
}

function refresh(calendarSelectedDates) {
    let placeVisitDateList = getPlaceVisitDateListByConfidence();
    calendar.set('enable', placeVisitDateList);
    console.log(calendarSelectedDates)
    if (calendarSelectedDates != undefined && calendarSelectedDates[0] === '') {
        calendar.jumpToDate(placeVisitDateList[placeVisitDateList.length - 1]);
    }    
    calendar.redraw();
}

// Set up tab navigation (show map or stats)
function setupTabNavigation() {
    const tabs = document.querySelectorAll('.nav-link');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => handleTabClick(e));
    });
}

// Handle tab click event (map or stats)
function handleTabClick(e) {
    const target = e.target.getAttribute('data-bs-target');

    if (target === '#tab-stats') {
        document.getElementById('map').style.display = 'none';
        document.getElementById('stats').style.display = 'block';
    } else if (target === '#tab-map') {
        document.getElementById('map').style.display = 'block';
        document.getElementById('stats').style.display = 'none';
    }
}
