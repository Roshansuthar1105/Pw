package com.template.app.controller;

import com.template.app.dto.ApiResponse;
import com.template.app.dto.CreateUserDTO;
import com.template.app.dto.ResolvedPermissionsDTO;
import com.template.app.dto.UpdateUserDTO;
import com.template.app.dto.UserDTO;
import com.template.app.security.RequirePermission;
import com.template.app.service.PermissionResolutionService;
import com.template.app.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final PermissionResolutionService permissionResolutionService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserDTO>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(userService.getAllUsers()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDTO>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getUserById(id)));
    }

    @GetMapping("/{id}/permissions")
    public ResponseEntity<ApiResponse<ResolvedPermissionsDTO>> getResolvedPermissions(@PathVariable Long id) {
        ResolvedPermissionsDTO permissions = permissionResolutionService.resolvePermissions(id);
        return ResponseEntity.ok(ApiResponse.ok(permissions));
    }

    @PostMapping
    @RequirePermission("FN_USERS_MANAGE")
    public ResponseEntity<ApiResponse<UserDTO>> create(@Valid @RequestBody CreateUserDTO dto) {
        UserDTO created = userService.createUser(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("User created successfully", created));
    }

    @PutMapping("/{id}")
    @RequirePermission("FN_USERS_MANAGE")
    public ResponseEntity<ApiResponse<UserDTO>> update(@PathVariable Long id, @Valid @RequestBody UpdateUserDTO dto) {
        UserDTO updated = userService.updateUser(id, dto);
        return ResponseEntity.ok(ApiResponse.ok("User updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("FN_USERS_MANAGE")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.ok("User deleted successfully", null));
    }
}
