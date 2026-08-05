package com.taprs.infrastructure.web.websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // setAllowedOriginPatterns, not setAllowedOrigins: the SockJS client
        // sends its /ws/info XHR with credentials, and the CORS spec forbids the
        // wildcard Access-Control-Allow-Origin on a credentialed request, so
        // Spring omits the header entirely and the browser blocks the handshake.
        // Patterns make Spring echo the requesting origin instead.
        registry.addEndpoint("/ws").setAllowedOriginPatterns("*").withSockJS();
    }
}
