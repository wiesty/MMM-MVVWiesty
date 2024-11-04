# MMM-MVVWiesty [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wiesty/MMM-MVVWiesty/raw/master/LICENSE) <img src="https://img.shields.io/badge/Maintained%3F-yes-green.svg"/>

MagicMirror² Module to display public transport from Munich  in Germany.


<img src="https://raw.githubusercontent.com/wiesty/MMM-MVVWiesty/refs/heads/main/assets/example.png"/>


## Dependencies
* instance of [MagicMirror²](https://github.com/MichMich/MagicMirror)

## Installation
1. Clone this repository in your MagicMirror installation into the folder modules.
```git clone https://github.com/wiesty/MMM-MVVWiesty.git```
2. Install dependencies in main MagicMirror folder
3. Head over to [mvv-muenchen.de](https://www.mvv-muenchen.de/fahrplanauskunft/fuer-entwickler/opendata/index.html) and download Haltestellenliste CSV
4. Search your station and modify the config template below
5. Add configuration to your config.js

## Config


```
{
    module: "MMM-MVVWiesty",
    position: "bottom_left",
    config: {
        maxEntries: 5,                  // Maximum number of departures to display
        stopId: "de:09162:6",           // Stop ID for your station
        filter: {},                     // Filter by line and/or direction (optional)
        displayNotifications: true,     // Show notifications for each departure if available
        scrollSpeed: 40,                // Speed for scrolling notifications
        minTimeUntilDeparture: 0        // Minimum time in minutes until departure to display
    }
},

```

### Configuration Options

-   **maxEntries**: The maximum number of departures to display on the screen.
-   **stopId**: The unique ID for the stop. Find this ID from the MVV Haltestellenliste CSV.
-   **filter**: Object for filtering departures by line number and/or direction (details below).
-   **displayNotifications**: Enables or disables notifications for each departure, such as delays or route changes.
-   **scrollSpeed**: The speed at which notification text scrolls across the screen.
-   **minTimeUntilDeparture**: Specifies the minimum time (in minutes) for departures to be displayed. For example, if set to `3`, only departures leaving in 3 minutes or more will appear.

#

### Filter by Line and Direction
You can filter departures by both line number and direction. To do so, add the line numbers as keys and the desired directions as values in the `filter` object in your module configuration. (Be sure to type the exact name of the line number and for the for the direction. TRAM and BUS only have Numbers. (Tram 16 would be "16", and BUS 123 would be "123")

Example:


    filter: {
      "S8": "Herrsching",
      "U2": "Messestadt Ost"
    } 

With the above configuration, the module will only display departures for the S8 line going towards Herrsching and the U2 line towards Messestadt Ost.

### Filter by Line Only

If you want to display departures for certain lines regardless of their direction, simply provide the line number with an empty string as the value. For example:


```
filter: {
  "16": "",
  "S8": ""
}
```

This configuration results in the module showing all departures for the 16 and S8 lines, irrespective of their direction.

### Multiple Directions Example:

You can specify multiple destinations for a single line by using an array. For example:

```
filter: {
  "S2": ["Petershausen", "Isartor", "Ostbahnhof"]
}
``` 

This configuration will display all S2 departures heading towards Petershausen, Isator, or Ostbahnhof. If any of these directions match the current destination of the line, the departure will be shown.

### Display All Departures

To show all departures without any filtering, you can either leave the `filter` object empty, delete it from the config or include the key `all` with an empty string as its value. Both of these configurations will display every departure:

```
filter: {}
```

Or:

```
filter: {
  "all": ""
}
```

This flexible filtering system ensures that you can always access the departures that are most relevant to you without any unnecessary clutter.


### Overall CSS Layout (`.MMM-MVVWiesty` and `.mvv-table`) - useful for custom css

-   **`.MMM-MVVWiesty .module-content`**: Limits the module’s maximum width to `25vw`, allowing it to adjust responsively up to that width. The module is centered horizontally and has overflow hidden to prevent text spilling out.
-   **`.mvv-table`**: Sets the table width to `100%`, collapses borders for a cleaner look, and uses a fixed table layout to maintain column widths. This class also sets the font size and line height.

### Cell-Specific Classes

-   **`.icon-cell` & `.line-cell`**: These two cells are the narrowest, each set to a width of `1vw` to minimize spacing. Both cells have right padding (`5px`) and text aligned to the start (left) for a compact display of line numbers and icons.
    
-   **`.direction-cell`**: Displays the direction text of each departure with specific settings:
    
    -   **Width**: `8vw`, allowing for adequate space without pushing other elements off.
    -   **Overflow**: `hidden`, `white-space: nowrap`, and `text-overflow: ellipsis` ensure that long text will not wrap and instead shows an ellipsis (`...`) when text is truncated.
    -   **Customizations**: If direction text is cut off or requires more space, consider increasing `width` or adjusting `text-overflow`.
-   **`.time-cell`**: Displays the departure time, with a width of `6vw`, making it slightly narrower than the direction cell but wide enough for typical HH
    
    formatting. It also has `white-space: nowrap` and `overflow: hidden` to ensure text remains on one line.
    
-   **`.until-cell`**: Shows the “time until departure” information with a narrower width of `3vw`. This cell is also set to nowrap and hidden overflow to keep the text compact. If more padding is needed, adjust the `padding` or `width` as desired.
    
-   **`.notification-cell`**: Used for displaying notifications. It spans all columns (`colSpan=5`) and has overflow hidden to keep long notification text within bounds.


## Changelog

### v2.0.1 - Latest Release

-   **Expanded Filtering**: The `filter` option now supports multiple directions per line using an array format, allowing more precise control over which departures are displayed. For example, `"S2": ["Petershausen", "Isator", "Ostbahnhof"]` will show all S2 departures toward these specified destinations.
-   **New Icon**: Added an icon for ExpressBus to enhance line identification.

### v2.0.0

-   **New Config Option**: `minTimeUntilDeparture` - Filters out departures that are too soon, allowing you to show only those that are X minutes or more in the future.
-   **New Config Option**: `displayNotifications` - Enables or disables the display of notifications for each departure.
-   **Removed**: `updateInterval` option - The module now fetches data every 5 minutes by default, updating the displayed times every minute. This change reduces server load by avoiding excessive API requests.
-   **Improved Filtering**: Departures are now sorted and filtered based on the remaining time to departure, allowing the module to only display the most relevant and up-to-date information.
