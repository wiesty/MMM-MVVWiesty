Module.register("MMM-MVVWiesty", {
    defaults: {
        maxEntries: 5,
        stopId: "de:09162:6",
        filter: {},
        displayNotifications: true,
        displayBundled: false,
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
        return this.data.header || this.config.header || "MVV Abfahrtsmonitor";
    },

    getDom () {
        const wrapper = document.createElement("div");
        wrapper.classList.add("mvv-table-wrapper");

        if (this.filteredDepartures.length > 0) {
            let bundledNotifications = {};

            for (let i = 0; i < this.filteredDepartures.length && i < this.config.maxEntries; i++) {
                const departure = this.filteredDepartures[i];

                const row = document.createElement("div");
                row.classList.add("departure-row");

                const iconCell = document.createElement("div");
                iconCell.classList.add("icon-cell");
                const lineImage = document.createElement("img");
                lineImage.classList.add("productsvg");
                lineImage.src = this.getLineIcon(departure.line.name);
                iconCell.appendChild(lineImage);
                row.appendChild(iconCell);

                const lineCell = document.createElement("div");
                lineCell.classList.add("line-cell");
                lineCell.textContent = departure.line.number;
                row.appendChild(lineCell);

                const directionCell = document.createElement("div");
                directionCell.classList.add("direction-cell");
                directionCell.textContent = departure.direction;
                row.appendChild(directionCell);

                const displayTime = departure.departureLive || departure.departurePlanned;

                const timeCell = document.createElement("div");
                timeCell.classList.add("time-cell");
                timeCell.textContent = displayTime;
                row.appendChild(timeCell);

                const untilCell = document.createElement("div");
                untilCell.classList.add("until-cell");
                const minutesUntilDeparture = this.calculateTimeUntil(departure);
                untilCell.textContent = minutesUntilDeparture >= 1 ? `in ${minutesUntilDeparture} Min` : "";
                row.appendChild(untilCell);

                wrapper.appendChild(row);

                if (this.config.displayNotifications && departure.notifications && departure.notifications.length > 0) {
                    const notificationText = departure.notifications[0].text;

                    if (this.config.displayBundled) {
                        if (!bundledNotifications[departure.line.number]) {
                            bundledNotifications[departure.line.number] = new Set();
                        }
                        bundledNotifications[departure.line.number].add(notificationText);
                    } else {
                        wrapper.appendChild(this.createNotificationRow(notificationText));
                    }
                }
            }

            if (this.config.displayBundled) {
                Object.keys(bundledNotifications).forEach(lineNumber => {
                    bundledNotifications[lineNumber].forEach(notificationText => {
                        wrapper.appendChild(this.createNotificationRow(notificationText));
                    });
                });
            }
        } else {
            wrapper.textContent = "Keine Abfahrten gefunden.";
        }

        return wrapper;
    },

    createNotificationRow (notificationText) {
        const notificationRow = document.createElement("div");
        notificationRow.classList.add("notification-row");
        const notificationContainer = document.createElement("div");
        notificationContainer.classList.add("scroll-container");
        const scrollNotification = document.createElement("div");
        scrollNotification.classList.add("scroll-text");
        scrollNotification.textContent = notificationText;

        this.setScrollAnimation(scrollNotification, this.config.scrollSpeed);

        notificationContainer.appendChild(scrollNotification);
        notificationRow.appendChild(notificationContainer);
        return notificationRow;
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
            case "Bus": case "MetroBus": case "MVV-Regionalbus": case "RegionalBus": case "ExpressBus": case "NachtBus": case "StadtBus":
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

    calculateTimeUntil (departure) {
        const timeStr = departure.departureLive || departure.departurePlanned;
        if (!timeStr) return 0;

        const dateStr = departure.departureDate; // e.g. "20260415"
        const year = parseInt(dateStr.substring(0, 4));
        const month = parseInt(dateStr.substring(4, 6)) - 1;
        const day = parseInt(dateStr.substring(6, 8));
        const [hours, minutes] = timeStr.split(":").map(Number);

        const departureDateTime = new Date(year, month, day, hours, minutes, 0);
        const diff = Math.floor((departureDateTime - new Date()) / (1000 * 60));
        return diff >= 0 ? diff : 0;
    },

    async loadDepartures () {
        const self = this;
        const stopId = this.config.stopId.replace(/:/g, "%3A");
        const url = `https://www.mvv-muenchen.de/?eID=departuresFinder&action=get_departures&stop_id=${stopId}&requested_timestamp=${Math.floor(Date.now() / 1000)}&lines=all`;
        Log.info(`[MMM-MVVWiesty]: Fetching departures from URL: ${url}`);
        try {
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                if (data && data.departures && data.departures.length > 0) {
                    Log.info(`[MMM-MVVWiesty]: Fetched ${data.departures.length} departures from API.`);
                    self.departures = self.filterDepartures(data.departures);
                    self.departures.sort((a, b) => {
                        const dateTimeA = `${a.departureDate}T${a.departureLive || a.departurePlanned}`;
                        const dateTimeB = `${b.departureDate}T${b.departureLive || b.departurePlanned}`;
                        return dateTimeA.localeCompare(dateTimeB);
                    });
                    self.updateFilteredDepartures();
                    self.updateDom();
                    Log.info(`[MMM-MVVWiesty]: Filtered, we have ${self.departures.length} departures to present`);
                } else {
                    Log.error("[MMM-MVVWiesty]: No departures found in response.");
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

        return departures.filter(departure => {
            const minutesUntilDeparture = self.calculateTimeUntil(departure);
            if (minutesUntilDeparture < minTime) return false;

            if (filterKeys.length === 0 || self.config.filter.hasOwnProperty("all")) return true;

            const lineFilter = self.config.filter[departure.line.number];

            if (lineFilter === undefined) return false;
            if (!lineFilter) return true;

            if (Array.isArray(lineFilter)) {
                return lineFilter.includes(departure.direction);
            }

            return departure.direction === lineFilter || lineFilter === "";
        });
    },

    updateFilteredDepartures () {
        const now = new Date();
        this.filteredDepartures = this.departures.filter(departure => {
            const timeStr = departure.departureLive || departure.departurePlanned;
            if (!timeStr) return false;

            const dateStr = departure.departureDate;
            const year = parseInt(dateStr.substring(0, 4));
            const month = parseInt(dateStr.substring(4, 6)) - 1;
            const day = parseInt(dateStr.substring(6, 8));
            const [hours, minutes] = timeStr.split(":").map(Number);

            const departureDateTime = new Date(year, month, day, hours, minutes, 0);
            return departureDateTime >= now;
        });
    },

    scheduleUpdate () {
        setInterval(() => {
            this.loadDepartures();
        }, 300000);
    },

    scheduleMinuteUpdate () {
        const now = new Date();
        const msUntilNextMinute = (60 - now.getSeconds()) * 1000;

        setTimeout(() => {
            this.updateFilteredDepartures();
            this.updateDom();
            setInterval(() => {
                this.updateFilteredDepartures();
                this.updateDom();
            }, 60000);
        }, msUntilNextMinute);
    }
});
