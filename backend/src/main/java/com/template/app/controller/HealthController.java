package com.template.app.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Health Check Controller.
 *
 * Provides a simple custom /health endpoint (in addition to the Actuator /actuator/health).
 * This is useful for load balancers, container readiness probes, or frontend status checks.
 *
 * GET /api/health  → returns { status, timestamp, service, profile }
 */
@RestController
@RequestMapping("/health")
public class HealthController {

    @Value("${spring.application.name}")
    private String applicationName;

    @Value("${spring.profiles.active:default}")
    private String activeProfile;

    /**
     * Basic health check endpoint.
     *
     * @return 200 OK with application status metadata
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", "UP");
        response.put("service", applicationName);
        response.put("profile", activeProfile);
        response.put("timestamp", Instant.now().toString());

        return ResponseEntity.ok(response);
    }
}
