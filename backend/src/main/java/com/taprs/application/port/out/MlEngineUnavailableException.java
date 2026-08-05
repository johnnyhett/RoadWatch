package com.taprs.application.port.out;

/**
 * Raised when the analytical ML engine cannot be reached or does not answer
 * within the configured timeout. Surfaces to clients as 503 rather than 500,
 * so a downstream outage is distinguishable from a fault in this service.
 */
public class MlEngineUnavailableException extends RuntimeException {

    public MlEngineUnavailableException(String operation, Throwable cause) {
        super("ML engine unavailable while performing '" + operation + "': " + cause.getMessage(), cause);
    }
}
