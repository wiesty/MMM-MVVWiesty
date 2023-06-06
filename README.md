# MMM-mvgmunich [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wiesty/MMM-MVVWiesty/raw/master/LICENSE)

MagicMirror² Module to display public transport from Munich  in Germany.


![image](https://github.com/wiesty/MMM-MVVWiesty/assets/106901362/9656a212-c737-4ad5-a181-55abcc75fcec)


## Dependencies
* instance of [MagicMirror²](https://github.com/MichMich/MagicMirror)
* Node Fetch (linux: npm install node-fetch)

## Installation
1. Clone this repository in your MagicMirror installation into the folder modules.
```git clone https://github.com/wiesty/MMM-MVVWiesty.git```
2. Install dependencies in main MagicMirror folder
3. Head over to [mvv-muenchen.de](https://www.mvv-muenchen.de/fahrplanauskunft/fuer-entwickler/opendata/index.html) and download Haltestellenliste CSV
4. Search your station and add modify the config template below
5. Add configuration to your config.js

## Config


```
{
    module: "MMM-MVVWiesty",
    position: "bottom_left",
    config: {
        updateInterval: 60000, // Aktualisierungsintervall in Millisekunden (hier: 1 Minute)
        maxEntries: 5, // Maximale Anzahl der angezeigten Einträge in der Tabelle
        stopId: "de:09162:6", // Stop-ID im Format de:09162:6
    }
},
```
