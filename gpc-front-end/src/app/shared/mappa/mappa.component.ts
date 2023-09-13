import { Component, OnInit, Input, Output, EventEmitter, Inject } from '@angular/core';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
declare let L;
// declare let window;
declare var HeatmapOverlay: any;

interface MappaModel {
  label: string;
  indirizzo: string;
  latitudine: number;
  longitudine: number;
  id: string;
}

@Component({
  selector: 'app-mappa',
  templateUrl: './mappa.component.html',
  styleUrls: ['./mappa.component.css']
})
export class MappaComponent implements OnInit {

  @Input() elements: any[];
  @Input() fullScreen: boolean = false;
  @Input() enableHeatmap: boolean = false;
  @Input() dettaglioSegnalazione: boolean = false;
  @Output() coordinatesEmit: EventEmitter<any> = new EventEmitter<any>();
  @Output() dettaglioFeature: EventEmitter<any> = new EventEmitter<any>();
  @Output() commitPoi: EventEmitter<any> = new EventEmitter<any>();

  heatmap: any;

  constructor(
    private dialogRef: DynamicDialogRef,
    @Inject(DynamicDialogConfig) data: any) {
      if(data && data.data && data.data.elements) {
        this.elements = data.data.elements;
        this.fullScreen = data.data.fullScreen;
        this.enableHeatmap = data.data.enableHeatmap;
      }   
    }

  thereAreCoordinates(element){
    return element.dati_istanza.indirizzo_segnale_indicatore.location 
            && element.dati_istanza.indirizzo_segnale_indicatore.location.lat 
            && element.dati_istanza.indirizzo_segnale_indicatore.location.lon
                 ? true : false;
  }

  ngOnInit() {
    const __this = this;
    let keys = this.elements ? Object.keys(this.elements) : [];
    let thereAreCoordinates: boolean = keys.length == 0 ? false : (keys.length == 1 ? this.thereAreCoordinates(this.elements[0]) : true);

    let coordinates: MappaModel[] = keys.map(x => {
      return {
        label: this.elements[x].anagrafica.nome + ' ' + this.elements[x].anagrafica.cognome,
        indirizzo: this.elements[x].dati_istanza.indirizzo_segnale_indicatore.indirizzo,
        latitudine: this.elements[x].dati_istanza.indirizzo_segnale_indicatore.location?.lat || null,
        longitudine: this.elements[x].dati_istanza.indirizzo_segnale_indicatore.location?.lon || null,
        id: this.elements[x].id_doc                                                                                  
      };
    });
    
    coordinates = coordinates.filter(x => x.latitudine != null && x.longitudine != null);

    let verticalShift = !this.fullScreen && keys.length == 1 ? 0.014 : 0;
    let startPoint: number[] = thereAreCoordinates ? [(coordinates[0].latitudine - verticalShift), coordinates[0].longitudine]
                                                   : [(41.1255301 - 0.014), 16.8618679];

    var tiles = L.tileLayer.colorFilter('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      filter: ['grayscale:100%']
    });

    var cfg = {
      "radius": .02,
      "maxOpacity": .8, 
      "scaleRadius": true, 
      "useLocalExtrema": true,
      latField: 'lat',
      lngField: 'lng',
      valueField: 'count'
    };

    this.heatmap = new HeatmapOverlay(cfg);

    var map = L.map('map', {
      fullscreenControl: true,
      fullscreenControlOptions: {
        position: 'topright',
        title:"Attiva Fullscreen",
        titleCancel:"Disattiva Fullscreen"
      },
      editable: !thereAreCoordinates && !this.fullScreen,
      center: startPoint, 
      zoom: keys.length > 1 ? 10 : 13, 
      layers: [tiles] 
    });

    let customIcon = L.icon({
      iconUrl: '../../../assets/marker-icon.png', 
      shadowUrl: '../../../assets/marker-shadow.png',
      iconSize:    [25, 41],
  		iconAnchor:  [12, 41],
  		popupAnchor: [1, -34],
  		tooltipAnchor: [16, -28],
  		shadowSize:  [41, 41]
    });

    if(thereAreCoordinates) {
      var markers = L.markerClusterGroup();

      coordinates.forEach(el => {
        var marker = L.marker([el.latitudine, el.longitudine], {icon: customIcon});
        //this.enableHeatmap è un parametro indicativo momentaneo per non riportare tale funzione sul GPC
        if((this.fullScreen && this.enableHeatmap) || this.dettaglioSegnalazione) 
          marker.bindPopup(this.getContentPopup(el))
          .on("popupopen", (a) => {
              a.target.getPopup().getElement()
            .querySelector(".info")
            .addEventListener("click", e => {           
              __this.openDetailsModal(el);          
            });
          }); 
        else  
          marker.bindPopup(this.getContentPopup(el));
          
        markers.addLayer(marker);
      });
  
      map.addLayer(markers);

      if(keys.length > 1 && this.enableHeatmap){
        this.setHeatmapData(coordinates);
        map.on('zoomend', function(data) {
          switch(map._zoom) { 
            case 8:
            case 9:
            case 10: { 
              __this.heatmap.cfg.radius = .02; 
              break; 
            } 
            case 11: { 
              __this.heatmap.cfg.radius = .01;
              break; 
            } 
            case 12: { 
              __this.heatmap.cfg.radius = .005;
              break; 
            }
            case 13: { 
              __this.heatmap.cfg.radius = .003;
              break; 
            }   
            case 14: { 
              __this.heatmap.cfg.radius = .002;
              break; 
            } 
            case 15: { 
              __this.heatmap.cfg.radius = .001;
              break; 
            }
            case 16: { 
              __this.heatmap.cfg.radius = .0007;
              break; 
            }  
            case 17: { 
              __this.heatmap.cfg.radius = .0005;
              break; 
            }  
            case 18:
            case 19: { 
              __this.heatmap.cfg.radius = .0003;
              break; 
            }
            default: { 
              __this.heatmap.cfg.radius = .06; 
              break; 
            } 
           } 
        });

        L.EditControl = L.Control.extend({
          options: {
            position: 'topright',
            callback: null,
            kind: 'HeatMap',
            html: '<a class="heatmap-icon"></a>'
          },

          onAdd: function (map) {
            var container = L.DomUtil.create('div', 'leaflet-control leaflet-bar'),
                link = L.DomUtil.create('a', '', container);
  
            link.href = '#';
            link.title = 'Abilita/Disabilita ' + this.options.kind;
            link.innerHTML = this.options.html;
            L.DomEvent.on(link, 'click', L.DomEvent.stop)
                      .on(link, 'click', function () {
                        if(map.hasLayer(__this.heatmap))
                          map.removeLayer(__this.heatmap);
                        else  
                          map.addLayer(__this.heatmap);
                      }, this);
  
            return container;
          }
        });

        map.addControl(new L.EditControl());
      }
    }
    else if(!this.fullScreen) {
      var drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);

      var drawControl = new L.Control.Draw({
        draw: {
            position: 'topleft',
            polygon: false,                         
            marker: {
              icon: customIcon,
            },
            polyline: false, 
            rectangle: false,
            circle: false,
            circlemarker: false
        },
        edit: {
            featureGroup: drawnItems
        }
      });

      //settagglio traduzioni bottoni
      L.drawLocal.draw.toolbar.buttons.marker = "Inserisci segnale indicatore";
      L.drawLocal.draw.toolbar.actions.text = "Annulla";
      L.drawLocal.edit.toolbar.actions.save.title = "Salva";
      L.drawLocal.edit.toolbar.actions.save.text = "Salva";
      L.drawLocal.edit.toolbar.actions.cancel.title = "Annulla";
      L.drawLocal.edit.toolbar.actions.cancel.text = "Annulla";
      L.drawLocal.edit.toolbar.actions.clearAll.title = "Elimina tutto";
      L.drawLocal.edit.toolbar.actions.clearAll.text = "Elimina tutto";
      L.drawLocal.edit.toolbar.buttons.edit = "Modifica";
      L.drawLocal.edit.toolbar.buttons.editDisabled = "Nessun marker da modificare";
      L.drawLocal.edit.toolbar.buttons.remove = "Elimina";
      L.drawLocal.edit.toolbar.buttons.removeDisabled = "Nessun marker da eliminare";     

      map.addControl(drawControl); 

      map.on('draw:created', function(e) { 
        map.eachLayer(function (layerMap) {
          let type = __this.getShapeType(layerMap);
          if(type)
            map.removeLayer(layerMap);
        });
        __this.coordinatesEmit.emit(null);
        var layer = e.layer;
        var type = __this.getShapeType(layer);
        if (type === 'marker') {
          let latlng = layer.getLatLng();
          __this.coordinatesEmit.emit(latlng);
          let msg = __this.getContentPopupNewMarker(latlng);
          layer.bindPopup(msg);  
        }
        drawnItems.addLayer(layer);
      });
      
      map.on('draw:editstop', function(e) {  
        map.closePopup();
      });
  
      map.on('draw:edited', function (e) {
        var layers = e.layers;
        layers.eachLayer(function (layer) {
          var type = __this.getShapeType(layer);
          if (type === 'marker') {
            let latlng = layer.getLatLng();
            __this.coordinatesEmit.emit(latlng);
            let msg = __this.getContentPopupNewMarker(latlng); 
            layer.bindPopup(msg);  
          }
        });
      });

      map.on('draw:deleted', function (e) {
        var layers = e.layers;
        layers.eachLayer(function (layer) {
          var type = __this.getShapeType(layer);
          if (type === 'marker') {
            __this.coordinatesEmit.emit(null);
          }
        });
      });

      L.EditControl = L.Control.extend({
        options: {
          position: 'topright',
          callback: null,
          kind: 'Salva',
          html: '<a class="pi pi-save"></a>'
        },

        onAdd: function (map) {
          var container = L.DomUtil.create('div', 'leaflet-control leaflet-bar'),
              link = L.DomUtil.create('a', '', container);

          link.href = '#';
          link.title = this.options.kind;
          link.innerHTML = this.options.html;
          L.DomEvent.on(link, 'click', L.DomEvent.stop)
                    .on(link, 'click', function () {
                      __this.commitPoi.emit();
                    }, this);

          return container;
        }
      });

      map.addControl(new L.EditControl());
    }
  }

  getShapeType(layer): string {
    let shape = '';
    if (layer instanceof L.Circle) {
      shape = 'circle';
    }
    if (layer instanceof L.Marker) {
      shape = 'marker';
    }
    if (layer instanceof L.CircleMarker) {
      shape = 'circleMarker';
    }
    if ((layer instanceof L.Polyline) && !(layer instanceof L.Polygon)) {
      shape = 'polyline';
    }
    if ((layer instanceof L.Polygon) && !(layer instanceof L.Rectangle)) {
      shape = 'polygon';
    }
    if (layer instanceof L.Rectangle) {
      shape = 'rectangle';
    }
    return shape;
  };

  getContentPopup(el): string {    
      let label = el.label.trim() ? el.label : 'N.D.';
      let id = el.id ? el.id : 'N.D.';
      let text = '<strong>' + label + ' - ID: ' + id + '</strong><br />' +
      '<strong>Indirizzo: </strong>' + el.indirizzo + '<br />' +
      '<strong>Latitudine: </strong>' + el.latitudine.toFixed(6) + ' - ' +
      '<strong>Longitudine: </strong>' + el.longitudine.toFixed(6);
      if((this.fullScreen && this.enableHeatmap) || this.dettaglioSegnalazione)
        text += "<br/> <button class=\"info btn-custom-style btn-dettagli\">Dettagli</button>"
      return text;
  }

  getContentPopupNewMarker(latlng): string {    
    let text = '<strong>Nuovo segnale indicatore</strong><br/>' +
    '<strong>Latitudine: </strong>' + latlng.lat.toFixed(6) + ' - ' +
    '<strong>Longitudine: </strong>' + latlng.lng.toFixed(6);
    return text;
  }

  setHeatmapData(coordinates){
    var heatmapData = {
      max: 0,
      data: []
    };

    let maxCount = 0;

    coordinates = coordinates.map(passocarrabile => {
      return {lat: Number(passocarrabile.latitudine.toFixed(5)), lng: Number(passocarrabile.longitudine.toFixed(5))}
    });

    while(coordinates.length > 0){
      let currCoordinates = coordinates[0];
      let count = 0;
      let indexToDelete = [];

      for(let index = 0; index < coordinates.length; index++) {
        if(coordinates[index].lat == currCoordinates.lat && coordinates[index].lng == currCoordinates.lng){
          count++;
          indexToDelete.push(index);
        }          
      }

      maxCount = Math.max(maxCount, count);
      heatmapData.data.push({lat: currCoordinates.lat, lng:currCoordinates.lng, count: count});   
      indexToDelete.forEach(index => coordinates.splice(index, 1));       
    }

    heatmapData.max = maxCount;
    this.heatmap.setData(heatmapData);
  }

  openDetailsModal(element){    
    this.dettaglioFeature.emit(element);
    this.closeDialog(element);
  }

  closeDialog(event?) {
    this.dialogRef.close(event);
  }
}
