# 🌍 Timeline Explorer

Timeline Explorer is a web-based tool to visualize your **Google Location History** (Takeout data) in an interactive and colorful map interface. Explore your past travels, see where you've been by year, and analyze your transportation habits with charts.

![Map](https://i.imgur.com/ZIAdYMl.gif)

![Stats](https://i.imgur.com/1HDBVaQ.gif)

## ✨ Features

- 🗂 Parse multiple [Google Takeout](https://takeout.google.com/) Location History JSON files.
- 🗺 Interactive map powered by [MapLibre GL JS](https://maplibre.org/).
- 🎨 Year-based color-coded markers with filtering options.
- 📌 Popups with detailed location info (using [OpenStreetMap Nominatim API](https://nominatim.org/release-docs/latest/api/Reverse/)).
- 📊 Activity analysis with [Chart.js](https://www.chartjs.org/) (bar/doughnut charts).
- 📅 Yearly summary cards with stats.
- 🔍 Adjustable zoom, scrollable content, and responsive design ([Bootstrap 5](https://maplibre.org/)).

## 📦 How to Use

1. Navigate to https://mg-diego.github.io/timeline-explorer/
2. Import data using the examples located at the `examples` folder or dowload your own Google Takeout Location data:
    - Go to [Google Takeout](https://takeout.google.com/).
    - Export only **Timeline History**.
    - Extract the .zip file.
    - Inside **Semantic Location History**, locate the yearly .json files (e.g. 2020.json).
    - Upload one or more files using the file input in the app.

## ✨ Built with
- [MapLibre GL JS](https://maplibre.org/)
- [Bootstrap 5](https://maplibre.org/)
- [Chart.js](https://www.chartjs.org/)
- [OpenStreetMap Nominatim API](https://nominatim.org/release-docs/latest/api/Reverse/)

## 📌 Note on Privacy
This tool works 100% client-side. No data is ever uploaded or stored externally.

## 📈 Roadmap
- Improve the Map tab performance when a huge number or markers is added. 
- Add extra metrics to the Stats tab.
