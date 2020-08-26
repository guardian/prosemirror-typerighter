import { createContext } from 'react';
import TelemetryService from '../services/TelemetryService';

const TelemetryContext = createContext({
    telemetryService: undefined as TelemetryService | undefined
});

export default TelemetryContext