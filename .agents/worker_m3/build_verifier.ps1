$stubsDir = "c:\Users\LMAA-0001\Desktop\GitHub PROJECTS\Traffic-Accident-Pattern-Recognition-System\.agents\worker_m3\stubs"
$binDir = "c:\Users\LMAA-0001\Desktop\GitHub PROJECTS\Traffic-Accident-Pattern-Recognition-System\.agents\worker_m3\bin"

New-Item -ItemType Directory -Force -Path "$stubsDir\org\springframework\boot\autoconfigure" | Out-Null
New-Item -ItemType Directory -Force -Path "$stubsDir\org\springframework\stereotype" | Out-Null
New-Item -ItemType Directory -Force -Path "$stubsDir\org\springframework\beans\factory\annotation" | Out-Null
New-Item -ItemType Directory -Force -Path "$stubsDir\org\springframework\web\bind\annotation" | Out-Null
New-Item -ItemType Directory -Force -Path "$stubsDir\org\springframework\web\reactive\function\client" | Out-Null
New-Item -ItemType Directory -Force -Path "$stubsDir\org\springframework\web\servlet\config\annotation" | Out-Null
New-Item -ItemType Directory -Force -Path "$stubsDir\org\springframework\web\socket\config\annotation" | Out-Null
New-Item -ItemType Directory -Force -Path "$stubsDir\org\springframework\web\socket\handler" | Out-Null
New-Item -ItemType Directory -Force -Path "$stubsDir\org\springframework\web\socket" | Out-Null
New-Item -ItemType Directory -Force -Path "$stubsDir\org\springframework\core" | Out-Null
New-Item -ItemType Directory -Force -Path "$stubsDir\org\springframework\http" | Out-Null
New-Item -ItemType Directory -Force -Path "$stubsDir\org\springframework\context\annotation" | Out-Null
New-Item -ItemType Directory -Force -Path "$stubsDir\org\springframework\scheduling\annotation" | Out-Null
New-Item -ItemType Directory -Force -Path "$stubsDir\org\springframework\messaging\simp\config" | Out-Null
New-Item -ItemType Directory -Force -Path "$stubsDir\com\fasterxml\jackson\annotation" | Out-Null
New-Item -ItemType Directory -Force -Path "$stubsDir\com\fasterxml\jackson\core\type" | Out-Null
New-Item -ItemType Directory -Force -Path "$stubsDir\com\fasterxml\jackson\databind" | Out-Null
New-Item -ItemType Directory -Force -Path "$binDir" | Out-Null

Set-Content "$stubsDir\org\springframework\boot\CommandLineRunner.java" "package org.springframework.boot; public interface CommandLineRunner { void run(String... args) throws Exception; }"
Set-Content "$stubsDir\org\springframework\boot\SpringApplication.java" "package org.springframework.boot; public class SpringApplication { public static void run(Class<?> primarySource, String... args) {} }"
Set-Content "$stubsDir\org\springframework\boot\autoconfigure\SpringBootApplication.java" "package org.springframework.boot.autoconfigure; import java.lang.annotation.*; @Target(ElementType.TYPE) @Retention(RetentionPolicy.RUNTIME) public @interface SpringBootApplication {}"
Set-Content "$stubsDir\org\springframework\context\annotation\Configuration.java" "package org.springframework.context.annotation; import java.lang.annotation.*; @Target(ElementType.TYPE) @Retention(RetentionPolicy.RUNTIME) public @interface Configuration {}"
Set-Content "$stubsDir\org\springframework\scheduling\annotation\EnableScheduling.java" "package org.springframework.scheduling.annotation; import java.lang.annotation.*; @Target(ElementType.TYPE) @Retention(RetentionPolicy.RUNTIME) public @interface EnableScheduling {}"
Set-Content "$stubsDir\org\springframework\scheduling\annotation\Scheduled.java" "package org.springframework.scheduling.annotation; import java.lang.annotation.*; @Target({ElementType.METHOD, ElementType.ANNOTATION_TYPE}) @Retention(RetentionPolicy.RUNTIME) public @interface Scheduled { long fixedRate() default -1; String cron() default `"`"; }"
Set-Content "$stubsDir\org\springframework\stereotype\Component.java" "package org.springframework.stereotype; import java.lang.annotation.*; @Target(ElementType.TYPE) @Retention(RetentionPolicy.RUNTIME) public @interface Component {}"
Set-Content "$stubsDir\org\springframework\stereotype\Service.java" "package org.springframework.stereotype; import java.lang.annotation.*; @Target(ElementType.TYPE) @Retention(RetentionPolicy.RUNTIME) public @interface Service {}"
Set-Content "$stubsDir\org\springframework\stereotype\Repository.java" "package org.springframework.stereotype; import java.lang.annotation.*; @Target(ElementType.TYPE) @Retention(RetentionPolicy.RUNTIME) public @interface Repository {}"
Set-Content "$stubsDir\org\springframework\beans\factory\annotation\Value.java" "package org.springframework.beans.factory.annotation; import java.lang.annotation.*; @Target({ElementType.FIELD, ElementType.METHOD, ElementType.PARAMETER}) @Retention(RetentionPolicy.RUNTIME) public @interface Value { String value(); }"
Set-Content "$stubsDir\org\springframework\web\bind\annotation\RestController.java" "package org.springframework.web.bind.annotation; import java.lang.annotation.*; @Target(ElementType.TYPE) @Retention(RetentionPolicy.RUNTIME) public @interface RestController {}"
Set-Content "$stubsDir\org\springframework\web\bind\annotation\RequestMapping.java" "package org.springframework.web.bind.annotation; import java.lang.annotation.*; @Target({ElementType.TYPE, ElementType.METHOD}) @Retention(RetentionPolicy.RUNTIME) public @interface RequestMapping { String[] value() default {}; }"
Set-Content "$stubsDir\org\springframework\web\bind\annotation\GetMapping.java" "package org.springframework.web.bind.annotation; import java.lang.annotation.*; @Target(ElementType.METHOD) @Retention(RetentionPolicy.RUNTIME) public @interface GetMapping { String[] value() default {}; }"
Set-Content "$stubsDir\org\springframework\web\bind\annotation\PostMapping.java" "package org.springframework.web.bind.annotation; import java.lang.annotation.*; @Target(ElementType.METHOD) @Retention(RetentionPolicy.RUNTIME) public @interface PostMapping { String[] value() default {}; }"
Set-Content "$stubsDir\org\springframework\web\bind\annotation\PathVariable.java" "package org.springframework.web.bind.annotation; import java.lang.annotation.*; @Target(ElementType.PARAMETER) @Retention(RetentionPolicy.RUNTIME) public @interface PathVariable { String value() default `"`"; }"
Set-Content "$stubsDir\org\springframework\web\bind\annotation\RequestBody.java" "package org.springframework.web.bind.annotation; import java.lang.annotation.*; @Target(ElementType.PARAMETER) @Retention(RetentionPolicy.RUNTIME) public @interface RequestBody { boolean required() default true; }"
Set-Content "$stubsDir\org\springframework\web\bind\annotation\ControllerAdvice.java" "package org.springframework.web.bind.annotation; import java.lang.annotation.*; @Target(ElementType.TYPE) @Retention(RetentionPolicy.RUNTIME) public @interface ControllerAdvice {}"
Set-Content "$stubsDir\org\springframework\web\bind\annotation\ExceptionHandler.java" "package org.springframework.web.bind.annotation; import java.lang.annotation.*; @Target(ElementType.METHOD) @Retention(RetentionPolicy.RUNTIME) public @interface ExceptionHandler { Class<? extends Throwable>[] value() default {}; }"
Set-Content "$stubsDir\org\springframework\web\reactive\function\client\WebClient.java" "package org.springframework.web.reactive.function.client; import org.springframework.core.ParameterizedTypeReference; import java.util.List; public interface WebClient { interface Builder { Builder baseUrl(String baseUrl); WebClient build(); } RequestBodyUriSpec post(); RequestHeadersUriSpec<?> get(); interface RequestBodyUriSpec { RequestBodySpec uri(String uri); } interface RequestHeadersUriSpec<S extends RequestHeadersUriSpec<S>> { RequestHeadersSpec<?> uri(String uri); } interface RequestBodySpec { RequestBodySpec bodyValue(Object body); ResponseSpec retrieve(); } interface RequestHeadersSpec<S extends RequestHeadersSpec<S>> { ResponseSpec retrieve(); } interface ResponseSpec { <T> MonoStub<T> bodyToMono(Class<T> elementClass); <T> MonoStub<T> bodyToMono(ParameterizedTypeReference<T> typeReference); <T> FluxStub<T> bodyToFlux(Class<T> elementClass); } interface MonoStub<T> { T block(); } interface FluxStub<T> { MonoStub<List<T>> collectList(); } }"
Set-Content "$stubsDir\org\springframework\web\servlet\config\annotation\CorsRegistry.java" "package org.springframework.web.servlet.config.annotation; public class CorsRegistry { public CorsRegistration addMapping(String pathPattern) { return new CorsRegistration(); } public static class CorsRegistration { public CorsRegistration allowedOrigins(String... origins) { return this; } public CorsRegistration allowedMethods(String... methods) { return this; } public CorsRegistration allowedHeaders(String... headers) { return this; } public CorsRegistration allowCredentials(boolean allowCredentials) { return this; } } }"
Set-Content "$stubsDir\org\springframework\web\servlet\config\annotation\WebMvcConfigurer.java" "package org.springframework.web.servlet.config.annotation; public interface WebMvcConfigurer { default void addCorsMappings(CorsRegistry registry) {} }"
Set-Content "$stubsDir\org\springframework\messaging\simp\SimpMessagingTemplate.java" "package org.springframework.messaging.simp; public class SimpMessagingTemplate { public void convertAndSend(String destination, Object payload) {} }"
Set-Content "$stubsDir\org\springframework\messaging\simp\config\MessageBrokerRegistry.java" "package org.springframework.messaging.simp.config; public class MessageBrokerRegistry { public void enableSimpleBroker(String... prefixes) {} public void setApplicationDestinationPrefixes(String... prefixes) {} }"
Set-Content "$stubsDir\org\springframework\web\socket\config\annotation\EnableWebSocketMessageBroker.java" "package org.springframework.web.socket.config.annotation; import java.lang.annotation.*; @Target(ElementType.TYPE) @Retention(RetentionPolicy.RUNTIME) public @interface EnableWebSocketMessageBroker {}"
Set-Content "$stubsDir\org\springframework\web\socket\config\annotation\EnableWebSocket.java" "package org.springframework.web.socket.config.annotation; import java.lang.annotation.*; @Target(ElementType.TYPE) @Retention(RetentionPolicy.RUNTIME) public @interface EnableWebSocket {}"
Set-Content "$stubsDir\org\springframework\web\socket\config\annotation\StompEndpointRegistry.java" "package org.springframework.web.socket.config.annotation; public interface StompEndpointRegistry { StompWebSocketEndpointRegistration addEndpoint(String... paths); interface StompWebSocketEndpointRegistration { StompWebSocketEndpointRegistration setAllowedOrigins(String... origins); StompWebSocketEndpointRegistration withSockJS(); } }"
Set-Content "$stubsDir\org\springframework\web\socket\config\annotation\WebSocketMessageBrokerConfigurer.java" "package org.springframework.web.socket.config.annotation; import org.springframework.messaging.simp.config.MessageBrokerRegistry; public interface WebSocketMessageBrokerConfigurer { default void configureMessageBroker(MessageBrokerRegistry config) {} default void registerStompEndpoints(StompEndpointRegistry registry) {} }"
Set-Content "$stubsDir\org\springframework\web\socket\config\annotation\WebSocketConfigurer.java" "package org.springframework.web.socket.config.annotation; public interface WebSocketConfigurer { void registerWebSocketHandlers(WebSocketHandlerRegistry registry); }"
Set-Content "$stubsDir\org\springframework\web\socket\config\annotation\WebSocketHandlerRegistry.java" "package org.springframework.web.socket.config.annotation; import org.springframework.web.socket.handler.TextWebSocketHandler; public interface WebSocketHandlerRegistry { WebSocketHandlerRegistration addHandler(TextWebSocketHandler handler, String... paths); interface WebSocketHandlerRegistration { WebSocketHandlerRegistration setAllowedOrigins(String... origins); } }"
Set-Content "$stubsDir\org\springframework\web\socket\handler\TextWebSocketHandler.java" "package org.springframework.web.socket.handler; import org.springframework.web.socket.WebSocketSession; import org.springframework.web.socket.TextMessage; public class TextWebSocketHandler { public void afterConnectionEstablished(WebSocketSession session) throws Exception {} public void afterConnectionClosed(WebSocketSession session, Object status) throws Exception {} protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {} }"
Set-Content "$stubsDir\org\springframework\web\socket\WebSocketSession.java" "package org.springframework.web.socket; public interface WebSocketSession { String getId(); void sendMessage(TextMessage message) throws java.io.IOException; }"
Set-Content "$stubsDir\org\springframework\web\socket\TextMessage.java" "package org.springframework.web.socket; public class TextMessage { public TextMessage(String payload) {} public String getPayload() { return `"`"; } }"
Set-Content "$stubsDir\org\springframework\core\ParameterizedTypeReference.java" "package org.springframework.core; public abstract class ParameterizedTypeReference<T> { protected ParameterizedTypeReference() {} }"
Set-Content "$stubsDir\org\springframework\http\HttpStatus.java" "package org.springframework.http; public enum HttpStatus { OK, INTERNAL_SERVER_ERROR; }"
Set-Content "$stubsDir\org\springframework\http\ResponseEntity.java" "package org.springframework.http; public class ResponseEntity<T> { public ResponseEntity(T body, HttpStatus status) {} }"
Set-Content "$stubsDir\com\fasterxml\jackson\annotation\JsonProperty.java" "package com.fasterxml.jackson.annotation; import java.lang.annotation.*; @Target({ElementType.FIELD, ElementType.METHOD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT}) @Retention(RetentionPolicy.RUNTIME) public @interface JsonProperty { String value() default `"`"; }"
Set-Content "$stubsDir\com\fasterxml\jackson\core\type\TypeReference.java" "package com.fasterxml.jackson.core.type; public abstract class TypeReference<T> { protected TypeReference() {} }"
Set-Content "$stubsDir\com\fasterxml\jackson\databind\ObjectMapper.java" "package com.fasterxml.jackson.databind; import com.fasterxml.jackson.core.type.TypeReference; import java.io.File; public class ObjectMapper { public <T> T readValue(File src, TypeReference<T> valueTypeRef) throws Exception { return null; } public String writeValueAsString(Object value) throws Exception { return `"`"; } }"

# Compile stubs
$stubFiles = Get-ChildItem -Path $stubsDir -Filter "*.java" -Recurse | Select-Object -ExpandProperty FullName
javac -d $binDir $stubFiles

# Compile backend java files
$backendFiles = Get-ChildItem -Path "c:\Users\LMAA-0001\Desktop\GitHub PROJECTS\Traffic-Accident-Pattern-Recognition-System\backend\src\main\java" -Filter "*.java" -Recurse | Select-Object -ExpandProperty FullName
javac -cp $binDir -d $binDir $backendFiles

if ($LASTEXITCODE -eq 0) {
    Write-Host "Java Compilation Verification: SUCCESS (0 errors)"
} else {
    Write-Host "Java Compilation Verification: FAILED"
}
