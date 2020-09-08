import { createContext } from 'react';
import TyperighterTelemetryAdapter from '../services/TyperighterTelemetryAdapter';

const TelemetryContext = createContext({
    telemetryService: undefined as TyperighterTelemetryAdapter | undefined
});

export default TelemetryContext