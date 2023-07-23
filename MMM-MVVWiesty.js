Module.register("MMM-MVVWiesty", {
  defaults: {
      updateInterval: 300000,
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

              var iconCell = document.createElement("td");
              iconCell.classList.add("icon-cell");
              var lineImage = document.createElement("img");
              lineImage.classList.add("productsvg");

              switch (departure.line.name) {
                  case "Bus":
                      lineImage.src = this.file("assets/bus.svg");
                      break;
                  case "S-Bahn":
                      lineImage.src = this.file("assets/sbahn.svg");
                      break;
                  case "Tram":
                      lineImage.src = this.file("assets/tram.svg");
                      break;
                  case "U-Bahn":
                      lineImage.src = this.file("assets/ubahn.svg");
                      break;
                  case "MVV-Regionalbus":
                      lineImage.src = this.file("assets/bus.svg");
                      break;
                  default:
                      lineImage.src = this.file("assets/default.svg");
                      break;
              }

              iconCell.appendChild(lineImage);
              row.appendChild(iconCell);

              var lineCell = document.createElement("td");
              lineCell.innerHTML = departure.line.number;
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
          Math.floor(Date.now() / 1000) +
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
      xhr.send();
  },

  scheduleUpdate: function () {
      var self = this;
      setInterval(function () {
          self.loadDepartures();
      }, this.config.updateInterval);
  }
});
