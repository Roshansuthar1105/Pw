package com.template.app.controller;

import com.template.app.dto.ApiResponse;
import com.template.app.dto.AuditLogDTO;
import com.template.app.model.AuditLog;
import com.template.app.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AuditLogDTO>>> getLogs(
            @RequestParam(defaultValue = "50") int limit) {
        List<AuditLog> logs = auditLogRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, Math.min(limit, 200))).getContent();

        List<AuditLogDTO> dtos = logs.stream()
                .map(l -> AuditLogDTO.builder()
                        .id(l.getId())
                        .actorId(l.getActorId())
                        .actorUsername(l.getActorUsername())
                        .action(l.getAction())
                        .entityType(l.getEntityType())
                        .entityId(l.getEntityId())
                        .entityName(l.getEntityName())
                        .details(l.getDetails())
                        .createdAt(l.getCreatedAt())
                        .build())
                .toList();

        return ResponseEntity.ok(ApiResponse.ok(dtos));
    }
}
