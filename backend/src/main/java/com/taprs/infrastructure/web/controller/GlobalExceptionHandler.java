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

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

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

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

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

    /**
     * A downstream analytics outage is 503, not a fault in this service. The
     * message carries the upstream URL and failure cause, so it stays in the log.
     */
    @ExceptionHandler(MlEngineUnavailableException.class)
    public ResponseEntity<Map<String, Object>> handleMlEngineUnavailable(MlEngineUnavailableException ex) {
        log.warn("ML engine unavailable: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(body(HttpStatus.SERVICE_UNAVAILABLE, "Analytics engine unavailable"));
    }

    /**
     * Genuine unexpected faults.
     *
     * <p>The detail is logged, not returned. Echoing {@code ex.getMessage()} to
     * the caller discloses internals -- absolute paths, driver and library
     * messages, upstream URLs -- to anyone able to trigger a fault.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleAllExceptions(Exception ex) {
        log.error("Unhandled exception serving request", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(body(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error"));
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
            // 4xx detail describes what the caller got wrong and is safe to
            // return; 5xx detail describes this service and is not.
            String detail;
            if (status.is5xxServerError()) {
                log.error("Framework exception serving request", ex);
                detail = "Internal server error";
            } else {
                String message = ex.getMessage();
                detail = (message == null || message.isBlank()) ? ex.getClass().getSimpleName() : message;
            }
            return ResponseEntity.status(status).headers(headers).body(body(status, detail));
        }
        return super.handleExceptionInternal(ex, providedBody, headers, status, request);
    }
}
