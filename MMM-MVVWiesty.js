Module.register("MMM-MVVWiesty", {
    defaults: {
        maxEntries: 5,
        stopId: "de:09162:6",
        filter: {},
        displayNotifications: true,
        scrollSpeed: 40,
        minTimeUntilDeparture: 0
    },

    start () {
        Log.info(`Starting module: ${this.name} with identifier: ${this.identifier}`);
        this.departures = [];
        this.filteredDepartures = [];
        this.loadDepartures();
        this.scheduleUpdate();
        this.scheduleMinuteUpdate();
    },

    getStyles () {
        return ["MMM-MVVWiesty.css"];
    },

    getHeader () {
        return this.config.header && (this.config.header !== "") ? this.config.header : "MVV Abfahrtsmonitor";
    },

    getDom () {
        const wrapper = document.createElement("div");
        wrapper.classList.add("mvv-table-wrapper");

        if (this.filteredDepartures.length > 0) {
            const table = document.createElement("table");
            table.classList.add("mvv-table");

            for (let i = 0; i < this.filteredDepartures.length && i < this.config.maxEntries; i++) {
                const departure = this.filteredDepartures[i];
                const row = document.createElement("tr");
                row.classList.add("departure-row");

                const iconCell = document.createElement("td");
                iconCell.classList.add("icon-cell");
                const lineImage = document.createElement("img");
                lineImage.classList.add("productsvg");
                lineImage.src = this.getLineIcon(departure.line.name);
                iconCell.appendChild(lineImage);
                row.appendChild(iconCell);

                const lineCell = document.createElement("td");
                lineCell.classList.add("line-cell");
                lineCell.innerHTML = departure.line.number;
                row.appendChild(lineCell);

                const directionCell = document.createElement("td");
                directionCell.classList.add("direction-cell");
                directionCell.innerHTML = departure.direction;
                row.appendChild(directionCell);

                const timeCell = document.createElement("td");
                timeCell.classList.add("time-cell");
                timeCell.innerHTML = departure.departureLive;
                row.appendChild(timeCell);

                const untilCell = document.createElement("td");
                untilCell.classList.add("until-cell");
                const minutesUntilDeparture = this.calculateTimeUntil(departure.departureLive);
                untilCell.innerHTML = minutesUntilDeparture >= 1 ? `in ${minutesUntilDeparture} Min` : "";
                row.appendChild(untilCell);

                table.appendChild(row);

                if (this.config.displayNotifications && departure.notifications && departure.notifications.length > 0) {
                    const notificationRow = document.createElement("tr");
                    const notificationCell = document.createElement("td");
                    notificationCell.colSpan = 5;
                    notificationCell.classList.add("notification-cell");
                    const notificationText = document.createElement("div");
                    notificationText.classList.add("scroll-container");
                    const scrollNotification = document.createElement("div");
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

    setScrollAnimation (scrollTextElement, scrollSpeed) {
        document.body.appendChild(scrollTextElement);
        const scrollWidth = scrollTextElement.scrollWidth;
        document.body.removeChild(scrollTextElement);
        scrollTextElement.style.width = `${scrollWidth}px`;
        const duration = scrollWidth / scrollSpeed;
        scrollTextElement.style.animationDuration = `${duration}s`;
    },

    getLineIcon (lineName) {
        switch (lineName) {
            case "Bus": case "MetroBus": case "MVV-Regionalbus": case "RegionalBus": case "ExpressBus": case "NachtBus":
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

    calculateTimeUntil (departureTime) {
        const now = new Date();
        const departure = new Date();
        departure.setHours(departureTime.split(":")[0]);
        departure.setMinutes(departureTime.split(":")[1]);
        const diff = Math.floor((departure - now) / (1000 * 60));
        return diff >= 0 ? diff : 0;
    },

    async loadDepartures () {
        const self = this;
        const stopId = this.config.stopId.replace(/:/g, "%3A");
        const url = `https://www.mvv-muenchen.de/?eID=departuresFinder&action=get_departures&stop_id=${stopId}&requested_timestamp=${Math.floor(Date.now() / 1000)}&lines=`;
        try {
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                if (data && data.departures && data.departures.length > 0) {
                    self.departures = self.filterDepartures(data.departures);
                    self.departures.sort(function (a, b) {
                        return new Date(`1970-01-01T${a.departureLive}:00Z`) - new Date(`1970-01-01T${b.departureLive}:00Z`);
                    });
                    self.updateFilteredDepartures();
                    self.updateDom();
                }
            } else {
                Log.error("[MMM-MVVWiesty]: Failed to load departures or no departures found.");
            }
        } catch (error) {
            Log.error("[MMM-MVVWiesty]: Error fetching departures:", error);
        }
    },

    filterDepartures (departures) {
        const self = this;
        const filterKeys = Object.keys(self.config.filter);
        const minTime = this.config.minTimeUntilDeparture;

        return departures.filter(function (departure) {
            const minutesUntilDeparture = self.calculateTimeUntil(departure.departureLive);
            if (minutesUntilDeparture < minTime) return false;

            if (filterKeys.length === 0 || self.config.filter.hasOwnProperty("all")) return true;

            const lineFilter = self.config.filter[departure.line.number];
            if (!lineFilter) return false;

            if (Array.isArray(lineFilter)) {
                return lineFilter.includes(departure.direction);
            }

            return departure.direction === lineFilter || lineFilter === "";
        });
    },

    updateFilteredDepartures () {
        const now = new Date();
        this.filteredDepartures = this.departures.filter((departure) => {
            const departureDate = new Date();
            departureDate.setHours(departure.departureLive.split(":")[0]);
            departureDate.setMinutes(departure.departureLive.split(":")[1]);
            return departureDate >= now;
        });
    },

    scheduleUpdate () {
        const self = this;
        setInterval(function () {
            self.loadDepartures();
        }, 300000);
    },

    scheduleMinuteUpdate () {
        const self = this;
        const now = new Date();
        const msUntilNextMinute = (60 - now.getSeconds()) * 1000;

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
