import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Lugar } from '../interfaces/lugar';
import { HttpClient } from '@angular/common/http';
import { WebsocketService } from '../services/websocket.service';

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.component.html',
  styleUrls: ['./mapa.component.css']
})
export class MapaComponent implements OnInit {
  @ViewChild('map', { static: true }) mapElement: ElementRef;
  public mapa: google.maps.Map;
  constructor(private http: HttpClient, public ws: WebsocketService) { }
  marcadores: google.maps.Marker[] = [];
  infoWindows: google.maps.InfoWindow[] = [];
  public lugares: Lugar[] = [

  ];
  ngOnInit() {

    this.listarMapas();
    this.esuchar();
  }

  listarMapas() {
    this.http.get('http://localhost:5000/mapa').subscribe((item: Lugar[]) => {
      this.lugares = item;
      this.cargarMapa();
      this.listarMarcadores();
    });
  }
  cargarMapa() {
    const latlng = new google.maps.LatLng(37.784679, -122.395936);
    const mapaOpciones: google.maps.MapOptions = {
      center: latlng,
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    }
    this.mapa = new google.maps.Map(this.mapElement.nativeElement, mapaOpciones);
    this.mapa.addListener('click', (coord) => {
      const nuevoMarcador: Lugar = {
        nombre: 'Nuevo lugar ',
        lat: coord.latLng.lat(),
        lng: coord.latLng.lng(),
        id: new Date().toISOString()
      };

      this.agregarMarcador(nuevoMarcador);

      this.ws.emit('marcador-nuevo', nuevoMarcador);

    });
  }

  listarMarcadores() {
    for (const item of this.lugares) {
      this.agregarMarcador(item);
    }
  }
  agregarMarcador(marcador: Lugar) {

    const latlng = new google.maps.LatLng(marcador.lat, marcador.lng);

    const marker = new google.maps.Marker({
      map: this.mapa,
      animation: google.maps.Animation.DROP,
      position: latlng,
      draggable: true,
      icon: 'assets/sho.png',
      title: marcador.id
    });

    this.marcadores.push(marker);
    const contenido = `<b>${marcador.nombre}</b>`;

    const infoWindow = new google.maps.InfoWindow({
      content: contenido
    });

    this.infoWindows.push(infoWindow);

    google.maps.event.addDomListener(marker, 'click', () => {
      this.infoWindows.forEach(info => { info.close() })
      infoWindow.open(this.mapa, marker);
    });

    google.maps.event.addDomListener(marker, 'dblclick', (cors) => {
      marker.setMap(null);
    });

    google.maps.event.addDomListener(marker, 'drag', (cors) => {
      const nuevoMarcador = {
        lat: cors.latLng.lat(),
        lng: cors.latLng.lng(),
        nombre: marcador.nombre
      }
    });
  }

  esuchar() {
    this.ws.listen('marcador-nuevo').subscribe((res: Lugar) => {
      this.agregarMarcador(res);
    });
  }
}
