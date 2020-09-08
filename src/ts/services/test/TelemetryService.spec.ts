import fetchMock from "fetch-mock";

import TelemetryService from "../TelemetryService";
import { ITyperighterTelemetryEvent, TYPERIGHTER_TELEMETRY_TYPE, } from "../../interfaces/ITelemetryData";

const url = "http://endpoint";
const endpoint = `${url}/event`;
const telemetryService = new TelemetryService(url, 100);

const exampleEvent: ITyperighterTelemetryEvent = {
    app: "example-app",
    stage: "PROD",
    type: TYPERIGHTER_TELEMETRY_TYPE.TYPERIGHTER_SUGGESTION_IS_ACCEPTED,
    value: 1,
    eventTime: "2020-09-03T07:51:27.669Z",
    tags: {
        ruleId: "id",
        suggestion: "suggestion",
        matchId: "matchId",
        matchedText: "some matched text",
        matchContext: "matchContext",
        documentUrl: "documentUrl"
      },
  };

describe("TelemetryService", () => {
    afterEach(() => {
        fetchMock.reset();
    });
    
    it("should send events to a remote service", done => {
        fetchMock.post(endpoint, {
            body: JSON.stringify([exampleEvent]),
            status: 201
        });
        telemetryService.addEvent(exampleEvent);

        setTimeout(() => {
            const calls = fetchMock.calls(endpoint);
            expect(calls.length).toBe(1);
            done();
        }, 150);
    });

    it("should only send one event for each throttle window", done => {
        fetchMock.post(endpoint, {
            body: JSON.stringify([exampleEvent]),
            status: 201
        });
        telemetryService.addEvent(exampleEvent);
        telemetryService.addEvent(exampleEvent);
        telemetryService.addEvent(exampleEvent);      
        
        // Ensure no calls are sent before end of throttle window
        expect(fetchMock.calls(endpoint).length).toBe(0);

        setTimeout(() => {
            const calls = fetchMock.calls(endpoint);
            expect(calls.length).toBe(1);
            done();
        }, 150);
    });

    it("should batch events within the throttle window", done => {
        fetchMock.post(endpoint, {
            body: JSON.stringify([exampleEvent]),
            status: 201
        });
        telemetryService.addEvent(exampleEvent);

        // After the first window
        setTimeout(() => {
            const calls = fetchMock.calls(endpoint);
            expect(calls.length).toBe(1);
            telemetryService.addEvent(exampleEvent);
            telemetryService.addEvent(exampleEvent);
        }, 150);
       
        // After the second window
        setTimeout(() => {         
            const calls = fetchMock.calls(endpoint);
            expect(calls.length).toBe(2);
            done();
        }, 300);
    });

    it("should flush all events when flushEvents is called", () => {
        fetchMock.post(endpoint, {
            body: JSON.stringify([exampleEvent]),
            status: 201
        });
        
        telemetryService.addEvent(exampleEvent);
        telemetryService.flushEvents();

        const calls = fetchMock.calls(endpoint);
        expect(calls.length).toBe(1);
    });

    it("should group events into batches of 500, sending one batch per throttle window", done => {
        fetchMock.post(endpoint, {
            body: JSON.stringify([exampleEvent]),
            status: 201
        });
        Array(501)
            .fill(exampleEvent)
            .map((event, index) => ({ ...event, tags: { ...event.tags, ruleId: index.toString() }}))
            .forEach(event => telemetryService.addEvent(event));

        setTimeout(() => {
            const calls = fetchMock.calls(endpoint);
            expect(calls.length).toBe(1);
            done();
        }, 150);

        setTimeout(() => {
            const calls = fetchMock.calls(endpoint);
            expect(calls.length).toBe(2);
            done();
        }, 300);
    });

});