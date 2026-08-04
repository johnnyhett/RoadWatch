package org.springframework.web.socket; public interface WebSocketSession { String getId(); void sendMessage(TextMessage message) throws java.io.IOException; }
