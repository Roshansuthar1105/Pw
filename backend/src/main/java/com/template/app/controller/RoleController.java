package com.template.app.controller;

import com.template.app.dto.ApiResponse;
import com.template.app.dto.CreateRoleDTO;
import com.template.app.dto.RoleDTO;
import com.template.app.dto.UpdateRoleDTO;
import com.template.app.security.RequirePermission;
import com.template.app.service.RoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<RoleDTO>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(roleService.getAllRoles()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RoleDTO>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(roleService.getRoleById(id)));
    }

    @PostMapping
    @RequirePermission("FN_ROLES_MANAGE")
    public ResponseEntity<ApiResponse<RoleDTO>> create(@Valid @RequestBody CreateRoleDTO dto) {
        RoleDTO created = roleService.createRole(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Role created successfully", created));
    }

    @PutMapping("/{id}")
    @RequirePermission("FN_ROLES_MANAGE")
    public ResponseEntity<ApiResponse<RoleDTO>> update(@PathVariable Long id, @Valid @RequestBody UpdateRoleDTO dto) {
        RoleDTO updated = roleService.updateRole(id, dto);
        return ResponseEntity.ok(ApiResponse.ok("Role updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("FN_ROLES_MANAGE")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        roleService.deleteRole(id);
        return ResponseEntity.ok(ApiResponse.ok("Role deleted successfully", null));
    }
}
