package com.template.app.controller;

import com.template.app.dto.ApiResponse;
import com.template.app.dto.AuthRequestDTO;
import com.template.app.dto.AuthResponseDTO;
import com.template.app.dto.UserDTO;
import com.template.app.exception.UnauthorizedException;
import com.template.app.security.UserContextHolder;
import com.template.app.security.UserPrincipal;
import com.template.app.service.AuthService;
import com.template.app.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponseDTO>> login(@Valid @RequestBody AuthRequestDTO request) {
        AuthResponseDTO response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponseDTO>> getCurrentUser() {
        UserPrincipal principal = UserContextHolder.get();
        if (principal == null) {
            throw new UnauthorizedException("Not authenticated");
        }
        AuthResponseDTO response = authService.getCurrentUser(principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/switch/{userId}")
    public ResponseEntity<ApiResponse<AuthResponseDTO>> switchUser(@PathVariable Long userId) {
        AuthResponseDTO response = authService.switchUser(userId);
        return ResponseEntity.ok(ApiResponse.ok("Switched session context", response));
    }

    @GetMapping("/users-list")
    public ResponseEntity<ApiResponse<List<UserDTO>>> getUsersListForSwitcher() {
        List<UserDTO> users = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.ok(users));
    }
}
