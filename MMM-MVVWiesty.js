Module.register("MMM-MVVWiesty", {
    defaults: {
        maxEntries: 5,
        stopId: "de:09162:6",
        filter: {},
        displayNotifications: true,
        scrollSpeed: 40,
        minTimeUntilDeparture: 0
    },

    start: function () {
        Log.info('%cMMM-MVVWiesty loaded. ', 'background: #00355C; color: #C0D101');
        this.departures = [];
        this.filteredDepartures = [];
        this.loadDepartures();
        this.scheduleUpdate();
        this.scheduleMinuteUpdate();
    },

    getStyles: function () {
        return ["MMM-MVVWiesty.css"];
    },

    getHeader: function () {
        return this.config.header && (this.config.header !== "") ? this.config.header : "MVV Abfahrtsmonitor";
    },

    getDom: function () {
        var wrapper = document.createElement("div");
        wrapper.classList.add("mvv-table-wrapper");

        if (this.filteredDepartures.length > 0) {
            var table = document.createElement("table");
            table.classList.add("mvv-table");

            for (var i = 0; i < this.filteredDepartures.length && i < this.config.maxEntries; i++) {
                var departure = this.filteredDepartures[i];
                var row = document.createElement("tr");
                row.classList.add("departure-row");

                var iconCell = document.createElement("td");
                iconCell.classList.add("icon-cell");
                var lineImage = document.createElement("img");
                lineImage.classList.add("productsvg");
                lineImage.src = this.getLineIcon(departure.line.name);
                iconCell.appendChild(lineImage);
                row.appendChild(iconCell);

                var lineCell = document.createElement("td");
                lineCell.classList.add("line-cell");
                lineCell.innerHTML = departure.line.number;
                row.appendChild(lineCell);

                var directionCell = document.createElement("td");
                directionCell.classList.add("direction-cell");
                directionCell.innerHTML = departure.direction;
                row.appendChild(directionCell);

                var timeCell = document.createElement("td");
                timeCell.classList.add("time-cell");
                timeCell.innerHTML = departure.departureLive;
                row.appendChild(timeCell);

                var untilCell = document.createElement("td");
                untilCell.classList.add("until-cell");
                var minutesUntilDeparture = this.calculateTimeUntil(departure.departureLive);
                untilCell.innerHTML = minutesUntilDeparture >= 1 ? `in ${minutesUntilDeparture} Min` : "";
                row.appendChild(untilCell);

                table.appendChild(row);

                if (this.config.displayNotifications && departure.notifications && departure.notifications.length > 0) {
                    var notificationRow = document.createElement("tr");
                    var notificationCell = document.createElement("td");
                    notificationCell.colSpan = 5;
                    notificationCell.classList.add("notification-cell");
                    var notificationText = document.createElement("div");
                    notificationText.classList.add("scroll-container");
                    var scrollNotification = document.createElement("div");
                    scrollNotification.classList.add("scroll-text");
                    scrollNotification.innerHTML = departure.notifications[0].text;

                    this.setScrollAnimation(scrollNotification, this.config.scrollSpeed);

                    notificationText.appendChild(scrollNotification);
                    notificationCell.appendChild(notificationText);
                    notificationRow.appendChild(notificationCell);
                    table.appendChild(notificationRow);

                    row.classList.remove("departure-row");
                }
            }

            wrapper.appendChild(table);
        } else {
            wrapper.innerHTML = "Keine Abfahrten gefunden.";
        }

        return wrapper;
    },

    setScrollAnimation: function (scrollTextElement, scrollSpeed) {
        document.body.appendChild(scrollTextElement);
        var scrollWidth = scrollTextElement.scrollWidth;
        document.body.removeChild(scrollTextElement);
        scrollTextElement.style.width = `${scrollWidth}px`;
        var duration = scrollWidth / scrollSpeed;
        scrollTextElement.style.animationDuration = `${duration}s`;
    },

    getLineIcon: function (lineName) {
        switch (lineName) {
            case "Bus": case "MetroBus": case "MVV-Regionalbus": case "RegionalBus": case "ExpressBus":
                return this.file("assets/bus.svg");
            case "S-Bahn":
                return this.file("assets/sbahn.svg");
            case "Tram": case "NachtTram":
                return this.file("assets/tram.svg");
            case "U-Bahn":
                return this.file("assets/ubahn.svg");
            default:
                return this.file("assets/default.svg");
        }
    },

    calculateTimeUntil: function (departureTime) {
        var now = new Date();
        var departure = new Date();
        departure.setHours(departureTime.split(":")[0]);
        departure.setMinutes(departureTime.split(":")[1]);
        var diff = Math.floor((departure - now) / (1000 * 60));
        return diff >= 0 ? diff : 0;
    },

    loadDepartures: function () {
        var self = this;
        var stopId = this.config.stopId.replace(/:/g, "%3A");
        var url = "https://www.mvv-muenchen.de/?eID=departuresFinder&action=get_departures&stop_id=" + stopId + "&requested_timestamp=" + Math.floor(Date.now() / 1000) + "&lines=";

        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                var response = JSON.parse(xhr.responseText);
                if (response && response.departures && response.departures.length > 0) {
                    self.departures = self.filterDepartures(response.departures);
                    self.departures.sort(function(a, b) {
                        return new Date(`1970-01-01T${a.departureLive}:00Z`) - new Date(`1970-01-01T${b.departureLive}:00Z`);
                    });
                    self.updateFilteredDepartures();
                    self.updateDom();
                }
            } else if (xhr.readyState === 4 && xhr.status !== 200) {
                Log.info('%cMMM-MVVWiesty failed to load departures or no departures found.', 'background: #00355C; color: #C0D101');
            }
        };
        xhr.send();
    },

    filterDepartures: function (departures) {
        var self = this;
        var filterKeys = Object.keys(self.config.filter);
        var minTime = this.config.minTimeUntilDeparture;
    
        return departures.filter(function (departure) {
            var minutesUntilDeparture = self.calculateTimeUntil(departure.departureLive);
            if (minutesUntilDeparture < minTime) return false;
    
            if (filterKeys.length === 0 || self.config.filter.hasOwnProperty("all")) return true;
    
            var lineFilter = self.config.filter[departure.line.number];
            if (!lineFilter) return false;
    
            if (Array.isArray(lineFilter)) {
                return lineFilter.includes(departure.direction);
            }
    
            return departure.direction === lineFilter || lineFilter === "";
        });
    },     

    updateFilteredDepartures: function () {
        var now = new Date();
        this.filteredDepartures = this.departures.filter((departure) => {
            var departureDate = new Date();
            departureDate.setHours(departure.departureLive.split(":")[0]);
            departureDate.setMinutes(departure.departureLive.split(":")[1]);
            return departureDate >= now;
        });
    },

    scheduleUpdate: function () {
        var self = this;
        setInterval(function () {
            self.loadDepartures();
        }, 300000);
    },

    scheduleMinuteUpdate: function () {
        var self = this;
        var now = new Date();
        var msUntilNextMinute = (60 - now.getSeconds()) * 1000;

        setTimeout(function () {
            self.updateFilteredDepartures();
            self.updateDom();

            setInterval(function () {
                self.updateFilteredDepartures();
                self.updateDom();
            }, 60000);
        }, msUntilNextMinute);
    }
});
