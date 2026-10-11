package com.template.app.service;

import com.template.app.dto.AuthRequestDTO;
import com.template.app.dto.AuthResponseDTO;
import com.template.app.dto.ResolvedPermissionsDTO;
import com.template.app.dto.UserDTO;
import com.template.app.exception.ResourceNotFoundException;
import com.template.app.exception.UnauthorizedException;
import com.template.app.model.Group;
import com.template.app.model.User;
import com.template.app.repository.UserRepository;
import com.template.app.security.JwtTokenProvider;
import com.template.app.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final PermissionResolutionService permissionResolutionService;

    @Transactional(readOnly = true)
    public AuthResponseDTO login(AuthRequestDTO request) {
        User user = userRepository.findByUsernameWithGroups(request.getUsername())
                .orElseThrow(() -> new UnauthorizedException("Invalid username or password"));

        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new UnauthorizedException("User account is inactive");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid username or password");
        }

        UserPrincipal principal = UserPrincipal.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .userType(user.getUserType())
                .superAdmin(Boolean.TRUE.equals(user.getIsSuperAdmin()))
                .build();

        String token = tokenProvider.generateToken(principal);
        ResolvedPermissionsDTO permissions = permissionResolutionService.resolvePermissions(user.getId());

        return AuthResponseDTO.builder()
                .token(token)
                .user(toUserDTO(user))
                .permissions(permissions)
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponseDTO getCurrentUser(Long userId) {
        User user = userRepository.findByIdWithGroups(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        UserPrincipal principal = UserPrincipal.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .userType(user.getUserType())
                .superAdmin(Boolean.TRUE.equals(user.getIsSuperAdmin()))
                .build();

        String token = tokenProvider.generateToken(principal);
        ResolvedPermissionsDTO permissions = permissionResolutionService.resolvePermissions(user.getId());

        return AuthResponseDTO.builder()
                .token(token)
                .user(toUserDTO(user))
                .permissions(permissions)
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponseDTO switchUser(Long targetUserId) {
        log.info("Switching session context to user id={}", targetUserId);
        return getCurrentUser(targetUserId);
    }

    private UserDTO toUserDTO(User u) {
        return UserDTO.builder()
                .id(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .userType(u.getUserType())
                .isSuperAdmin(u.getIsSuperAdmin())
                .active(u.getActive())
                .groupIds(u.getGroups() != null ? u.getGroups().stream().map(Group::getId).toList() : java.util.List.of())
                .groupNames(u.getGroups() != null ? u.getGroups().stream().map(Group::getName).toList() : java.util.List.of())
                .createdAt(u.getCreatedAt())
                .build();
    }
}
