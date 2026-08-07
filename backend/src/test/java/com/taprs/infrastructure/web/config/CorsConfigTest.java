package com.taprs.infrastructure.web.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Exercised through MockMvc rather than a live port: {@code Origin} is a
 * restricted header for {@code HttpURLConnection}, so a real-port client
 * silently drops it and the request stops being a CORS request at all.
 */
@SpringBootTest
@AutoConfigureMockMvc
class CorsConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("a preflight from the web client origin is allowed")
    void preflightFromWebClientIsAllowed() throws Exception {
        mockMvc.perform(options("/api/v1/incidents/")
                .header("Origin", "http://localhost:3000")
                .header("Access-Control-Request-Method", "GET"))
            .andExpect(status().isOk())
            .andExpect(header().exists("Access-Control-Allow-Origin"));
    }

    @Test
    @DisplayName("a simple cross-origin GET carries the allow-origin header")
    void simpleCrossOriginRequestIsAllowed() throws Exception {
        mockMvc.perform(get("/api/v1/incidents/stats")
                .header("Origin", "http://localhost:3000"))
            .andExpect(status().isOk())
            .andExpect(header().exists("Access-Control-Allow-Origin"));
    }

    @Test
    @DisplayName("an unlisted origin is refused")
    void unlistedOriginIsRefused() throws Exception {
        // Wildcard origin patterns combined with allowCredentials would echo any
        // Origin back and permit cookies with it, letting any site on the
        // internet read this API on a visitor's behalf (CWE-942).
        mockMvc.perform(options("/api/v1/incidents/")
                .header("Origin", "https://evil.example.com")
                .header("Access-Control-Request-Method", "GET"))
            .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/incidents/stats")
                .header("Origin", "https://evil.example.com"))
            .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }

    @Test
    @DisplayName("a same-origin request receives no CORS headers")
    void sameOriginRequestHasNoCorsHeaders() throws Exception {
        // Without an Origin header this is not a CORS request, and the spec
        // requires the Access-Control-* headers to be omitted.
        mockMvc.perform(get("/api/v1/incidents/stats"))
            .andExpect(status().isOk())
            .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }
}
