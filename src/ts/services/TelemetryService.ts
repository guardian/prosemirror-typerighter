import throttle from 'lodash/throttle';
import chunk from 'lodash/chunk';

import { ITyperighterTelemetryEvent } from "../interfaces/ITelemetryData";

class UserTelemetryEventSender {
    private postEventLimit = 500;
    private eventBuffer: ITyperighterTelemetryEvent[] = [];
    
    public constructor(private telemetryUrl: string, private throttleDelay: number) {};

    private async sendEvents(): Promise<void> {
        const [firstChunk, ...subsequentChunks] = chunk(this.eventBuffer, this.postEventLimit);
        if (!firstChunk) {
          return Promise.resolve();
        }

        const jsonEventBuffer = JSON.stringify(firstChunk);

        // Push the remaining events back into the buffer
        this.eventBuffer = subsequentChunks.flat();

        await fetch(`${this.telemetryUrl}/event`, {
            method: "POST",
            credentials: "include",
            headers: new Headers({
              "Content-Type": "application/json"
            }),
            body: jsonEventBuffer
          });
  
        if (this.eventBuffer.length) {
          this.throttledSendEvents();
        }
    }
    
    private throttledSendEvents = throttle(this.sendEvents, this.throttleDelay, { trailing: true, leading: false })

    public addEvent(event: ITyperighterTelemetryEvent): void {
      this.eventBuffer.push(event);
      this.throttledSendEvents();
    }

    public flushEvents(): Promise<void> {
        return this.sendEvents();
    }
}

export default UserTelemetryEventSender;