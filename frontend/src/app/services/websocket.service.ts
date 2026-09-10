import { Injectable, signal } from '@angular/core';


export interface EventoWebSocket<T = any> {
  type: 'PEDIDO_CREADO' | 'PEDIDO_ESTADO_CAMBIADO' | 'MESA_CAMBIO_ESTADO' | 'NOTIFICACION_CAJA';
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private socket?: WebSocket
  private readonly wsUrl = 'ws://localhost:8000/ws/pedidos/'; //url de django channels
  private intencionalDesconexion = false;

  //signal para exponer el ultimo evento recibido a la app
  public ultimoEvento = signal<EventoWebSocket | null>(null)
  public conectado = signal<boolean>(false)

  conectar(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) return

    this.intencionalDesconexion = false
    this.socket = new WebSocket(this.wsUrl)

    this.socket.onopen = () => {
      console.log('WebSocket conectado')
      this.conectado.set(true)
    }

    this.socket.onmessage = (event) => {
      try {
        const mensaje: EventoWebSocket = JSON.parse(event.data)
        //Actauliza la Signal global para avisar a componentes q hay datso nvos
        this.ultimoEvento.set(mensaje)
      } catch (err) {
        console.error('Error al parsear mensaje WS:', err)
      }
    }

    this.socket.onclose = () => {
      this.conectado.set(false)
      //solo intenta reconectar si no fue una desconeccion intencinal
      if (!this.intencionalDesconexion) {
        console.log('WebSocket desconectado. Reintentando...')
        setTimeout(() => this.conectar(), 3000)//reconexion automatica
      } else {
        console.log('WebSocket desconectado por el usuario')
      }

    }

    this.socket.onerror = (error) => {
      console.error('Error WebSocket:', error)
    }
  }

  desconectar(): void {
    this.intencionalDesconexion = true
    this.socket?.close()
  }

}
