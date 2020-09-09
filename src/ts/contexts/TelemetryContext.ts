import { createContext } from 'react';
import TyperighterTelemetryAdapter from '../services/TyperighterTelemetryAdapter';

const TelemetryContext = createContext({
    telemetryAdapter: undefined as TyperighterTelemetryAdapter | undefined
});

export default TelemetryContext
