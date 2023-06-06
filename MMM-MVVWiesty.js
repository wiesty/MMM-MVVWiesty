Module.register("MMM-MVVWiesty", {
    defaults: {
      updateInterval: 60000,
      maxEntries: 5,
      stopId: "de:09162:6" 
    },
  
    start: function () {
      this.departures = [];
      this.loadDepartures();
      this.scheduleUpdate();
    },
  
    getStyles: function () {
      return ["MMM-MVVWiesty.css"];
    },
  
    getHeader: function () {
      return "MVV Abfahrtsmonitor";
    },
  
    getDom: function () {
      var wrapper = document.createElement("div");
  
      if (this.departures.length > 0) {
        var table = document.createElement("table");
        table.classList.add("mvv-table");
  
        for (var i = 0; i < this.departures.length && i < this.config.maxEntries; i++) {
          var departure = this.departures[i];
  
          var row = document.createElement("tr");

          var lineCell = document.createElement("td");
          lineCell.innerHTML = departure.line.name + " " + departure.line.number;
          row.appendChild(lineCell);
  
          var directionCell = document.createElement("td");
          directionCell.innerHTML = departure.line.direction;
          row.appendChild(directionCell);
  
          var timeCell = document.createElement("td");
          timeCell.innerHTML = departure.departureLive;
          row.appendChild(timeCell);
  
          table.appendChild(row);
        }
  
        wrapper.appendChild(table);
      } else {
        wrapper.innerHTML = "Keine Abfahrten gefunden.";
      }
  
      return wrapper;
    },
  
    loadDepartures: function () {
      var self = this;
      var stopId = this.config.stopId.replace(/:/g, "%3A");
      var url =
        "https://www.mvv-muenchen.de/?eID=departuresFinder&action=get_departures&stop_id=" +
        stopId +
        "&requested_timestamp=" +
        Math.floor(Date.now() / 1000) + // Aktuellen Timestamp verwenden
        "&lines=";
  
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
          var response = JSON.parse(xhr.responseText);
          if (response && response.departures && response.departures.length > 0) {
            self.departures = response.departures;
            self.updateDom();
          }
        }
      };
      Log.info(url);
      xhr.send();
    },
  
    scheduleUpdate: function () {
      var self = this;
      setInterval(function () {
        self.loadDepartures();
      }, this.config.updateInterval);
    }
  });
  