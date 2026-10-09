package com.template.app.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Root Controller.
 * Provides application info and links when accessing base URL: /api or /api/
 */
@RestController
public class RootController {

    @Value("${spring.application.name}")
    private String applicationName;

    @Value("${spring.profiles.active:default}")
    private String activeProfile;

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> root() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("service", applicationName);
        response.put("status", "UP");
        response.put("profile", activeProfile);
        response.put("timestamp", Instant.now().toString());

        Map<String, String> endpoints = new LinkedHashMap<>();
        endpoints.put("health", "/api/health");
        endpoints.put("items", "/api/items");
        endpoints.put("actuator_health", "/api/actuator/health");
        response.put("endpoints", endpoints);

        return ResponseEntity.ok(response);
    }
}
