package com.template.app.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogDTO {
    private Long id;
    private Long actorId;
    private String actorUsername;
    private String action;
    private String entityType;
    private String entityId;
    private String entityName;
    private String details;
    private LocalDateTime createdAt;
}
