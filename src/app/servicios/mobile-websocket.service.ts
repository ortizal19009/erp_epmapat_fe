import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface MobileSocketEvent {
  type?: string;
  message?: string;
  ts?: number;
  idemision?: number | null;
  idrutaxemision?: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class MobileWebsocketService {
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private currentUserId: number | null = null;
  readonly events$ = new Subject<MobileSocketEvent>();

  connect(userId?: number | null) {
    this.currentUserId = userId ?? null;
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const apiUrl = environment.API_URL.replace(/^http/, 'ws');
    const query = this.currentUserId ? `?userId=${this.currentUserId}` : '';
    this.socket = new WebSocket(`${apiUrl}/ws/mobile${query}`);

    this.socket.onmessage = (event) => {
      try {
        this.events$.next(JSON.parse(event.data));
      } catch {
        this.events$.next({ type: 'raw', message: event.data });
      }
    };

    this.socket.onclose = () => {
      this.socket = null;
      this.scheduleReconnect();
    };

    this.socket.onerror = () => {
      this.socket?.close();
    };
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.socket?.close();
    this.socket = null;
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.reconnectTimer = setTimeout(() => this.connect(this.currentUserId), 5000);
  }
}
