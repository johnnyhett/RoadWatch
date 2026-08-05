package com.taprs.infrastructure.web.controller;

import com.taprs.application.port.out.MlEngineUnavailableException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Central error handling.
 *
 * <p>Extends {@link ResponseEntityExceptionHandler} so the framework's own
 * exceptions keep their intended status codes. A bare
 * {@code @ExceptionHandler(Exception.class)} advice would also catch those --
 * including {@code NoResourceFoundException} for an unmapped path and
 * {@code HttpMessageNotReadableException} for a malformed body -- and report
 * every one of them as 500, so genuine client errors were indistinguishable
 * from server faults.
 */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static Map<String, Object> body(HttpStatusCode status, String error) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", status.value());
        response.put("error", error);
        response.put("timestamp", Instant.now().toString());
        return response;
    }

    /** Preserves the status carried by explicitly thrown status exceptions. */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatus(ResponseStatusException ex) {
        String reason = ex.getReason();
        return ResponseEntity.status(ex.getStatusCode())
                .body(body(ex.getStatusCode(), reason == null ? ex.getClass().getSimpleName() : reason));
    }

    /** Bad input from the caller is a 400, not a server fault. */
    @ExceptionHandler({IllegalArgumentException.class, NumberFormatException.class})
    public ResponseEntity<Map<String, Object>> handleBadRequest(RuntimeException ex) {
        String message = ex.getMessage();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(body(HttpStatus.BAD_REQUEST, message == null ? ex.getClass().getSimpleName() : message));
    }

    /** A downstream analytics outage is 503, not a fault in this service. */
    @ExceptionHandler(MlEngineUnavailableException.class)
    public ResponseEntity<Map<String, Object>> handleMlEngineUnavailable(MlEngineUnavailableException ex) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(body(HttpStatus.SERVICE_UNAVAILABLE, ex.getMessage()));
    }

    /** Genuine unexpected faults. */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleAllExceptions(Exception ex) {
        // getMessage() is null for many exception types (e.g. NullPointerException),
        // which would serialize an error body with no usable detail.
        String message = ex.getMessage();
        String detail = (message == null || message.isBlank()) ? ex.getClass().getSimpleName() : message;
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(body(HttpStatus.INTERNAL_SERVER_ERROR, detail));
    }

    /**
     * Gives the framework's own exceptions a JSON body in the same shape as the
     * handlers above, instead of the empty body the base class returns.
     */
    @Override
    protected ResponseEntity<Object> handleExceptionInternal(Exception ex, Object providedBody,
                                                             HttpHeaders headers, HttpStatusCode status,
                                                             WebRequest request) {
        if (providedBody == null) {
            String message = ex.getMessage();
            String detail = (message == null || message.isBlank()) ? ex.getClass().getSimpleName() : message;
            return ResponseEntity.status(status).headers(headers).body(body(status, detail));
        }
        return super.handleExceptionInternal(ex, providedBody, headers, status, request);
    }
}
