package com.taprs.infrastructure.web.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Cross-origin policy for the web client.
 *
 * <p>Deliberately an allow-list rather than a wildcard. Pairing
 * {@code allowedOriginPatterns("*")} with {@code allowCredentials(true)} makes
 * the server echo whatever {@code Origin} it is sent and permit cookies with
 * it, so any page on the internet could issue credentialed requests to this API
 * and read the responses (CWE-942). Configure {@code roadwatch.cors.allowed-origins}
 * for additional deployment origins.
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    private final String[] allowedOrigins;

    public CorsConfig(@Value("${roadwatch.cors.allowed-origins}") String[] allowedOrigins) {
        this.allowedOrigins = allowedOrigins;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns(allowedOrigins)
                .allowedMethods("GET", "POST", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(1800);
    }
}
