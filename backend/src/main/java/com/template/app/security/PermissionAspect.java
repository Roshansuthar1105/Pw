package com.template.app.security;

import com.template.app.dto.ResolvedPermissionsDTO;
import com.template.app.exception.AccessDeniedException;
import com.template.app.exception.UnauthorizedException;
import com.template.app.service.PermissionResolutionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class PermissionAspect {

    private final PermissionResolutionService permissionResolutionService;

    @Around("@annotation(requirePermission)")
    public Object checkPermission(ProceedingJoinPoint joinPoint, RequirePermission requirePermission) throws Throwable {
        UserPrincipal principal = UserContextHolder.get();
        if (principal == null) {
            throw new UnauthorizedException("Authentication required to access this resource");
        }

        // Super Admin bypasses all checks
        if (principal.isSuperAdmin()) {
            return joinPoint.proceed();
        }

        String requiredCode = requirePermission.value();
        ResolvedPermissionsDTO permissions = permissionResolutionService.resolvePermissions(principal.getId());

        if (!permissions.getFlatCodes().contains(requiredCode)) {
            log.warn("Access denied for user='{}' (id={}). Missing required permission code='{}'",
                    principal.getUsername(), principal.getId(), requiredCode);
            throw new AccessDeniedException("Access denied: missing required permission '" + requiredCode + "'");
        }

        return joinPoint.proceed();
    }
}
