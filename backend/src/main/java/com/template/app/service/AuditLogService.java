package com.template.app.service;

import com.template.app.model.AuditLog;
import com.template.app.repository.AuditLogRepository;
import com.template.app.security.UserContextHolder;
import com.template.app.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAction(String action, String entityType, String entityId, String entityName, String details) {
        try {
            UserPrincipal principal = UserContextHolder.get();
            Long actorId = principal != null ? principal.getId() : null;
            String actorUsername = principal != null ? principal.getUsername() : "system";

            AuditLog logEntry = AuditLog.builder()
                    .actorId(actorId)
                    .actorUsername(actorUsername)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .entityName(entityName)
                    .details(details)
                    .build();

            auditLogRepository.save(logEntry);
            log.info("Audit: actor={} action={} entityType={} entityId={}", actorUsername, action, entityType, entityId);
        } catch (Exception e) {
            log.error("Failed to write audit log: {}", e.getMessage());
        }
    }
}
