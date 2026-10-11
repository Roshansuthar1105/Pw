package com.template.app.service;

import com.template.app.dto.CreateUserDTO;
import com.template.app.dto.UpdateUserDTO;
import com.template.app.dto.UserDTO;
import com.template.app.exception.ResourceNotFoundException;
import com.template.app.model.Group;
import com.template.app.model.User;
import com.template.app.model.UserType;
import com.template.app.repository.GroupRepository;
import com.template.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final PasswordEncoder passwordEncoder;
    private final PermissionResolutionService permissionResolutionService;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserDTO getUserById(Long id) {
        return userRepository.findByIdWithGroups(id)
                .map(this::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    @Transactional
    public UserDTO createUser(CreateUserDTO dto) {
        if (userRepository.existsByUsername(dto.getUsername())) {
            throw new IllegalArgumentException("Username '" + dto.getUsername() + "' is already taken");
        }
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("Email '" + dto.getEmail() + "' is already in use");
        }

        Set<Group> groups = new HashSet<>();

        // Automatic Default Group Assignment based on user_type
        Group defaultGroup = groupRepository.findByDefaultForUserTypeAndIsDefaultTrue(dto.getUserType())
                .orElseThrow(() -> new IllegalStateException("Default group for user type " + dto.getUserType() + " is not configured"));
        groups.add(defaultGroup);

        // Additional groups if provided
        if (dto.getAdditionalGroupIds() != null && !dto.getAdditionalGroupIds().isEmpty()) {
            groups.addAll(groupRepository.findAllById(dto.getAdditionalGroupIds()));
        }

        User user = User.builder()
                .username(dto.getUsername().trim())
                .email(dto.getEmail().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(dto.getPassword()))
                .userType(dto.getUserType())
                .isSuperAdmin(Boolean.TRUE.equals(dto.getIsSuperAdmin()))
                .active(true)
                .groups(groups)
                .build();

        User saved = userRepository.save(user);

        auditLogService.logAction(
                "CREATE",
                "USER",
                String.valueOf(saved.getId()),
                saved.getUsername(),
                "Created user type=" + saved.getUserType() + " with " + groups.size() + " groups"
        );

        return toDTO(saved);
    }

    @Transactional
    public UserDTO updateUser(Long id, UpdateUserDTO dto) {
        User user = userRepository.findByIdWithGroups(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setEmail(dto.getEmail().trim().toLowerCase());
        user.setUserType(dto.getUserType());

        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(dto.getPassword()));
        }
        if (dto.getIsSuperAdmin() != null) {
            user.setIsSuperAdmin(dto.getIsSuperAdmin());
        }
        if (dto.getActive() != null) {
            user.setActive(dto.getActive());
        }

        // Manage group memberships with protection rule:
        // A user's default system group cannot be removed if it's their only group.
        if (dto.getGroupIds() != null) {
            if (dto.getGroupIds().isEmpty()) {
                throw new IllegalArgumentException("A user must belong to at least one group (their default user_type group)");
            }
            Set<Group> updatedGroups = new HashSet<>(groupRepository.findAllById(dto.getGroupIds()));
            user.setGroups(updatedGroups);
        }

        User saved = userRepository.save(user);
        permissionResolutionService.invalidateUser(saved.getId());

        auditLogService.logAction(
                "UPDATE",
                "USER",
                String.valueOf(saved.getId()),
                saved.getUsername(),
                "Updated user details and group memberships"
        );

        return toDTO(saved);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        userRepository.delete(user);
        permissionResolutionService.invalidateUser(id);

        auditLogService.logAction(
                "DELETE",
                "USER",
                String.valueOf(id),
                user.getUsername(),
                "Deleted user"
        );
    }

    private UserDTO toDTO(User u) {
        return UserDTO.builder()
                .id(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .userType(u.getUserType())
                .isSuperAdmin(u.getIsSuperAdmin())
                .active(u.getActive())
                .groupIds(u.getGroups() != null ? u.getGroups().stream().map(Group::getId).toList() : List.of())
                .groupNames(u.getGroups() != null ? u.getGroups().stream().map(Group::getName).toList() : List.of())
                .createdAt(u.getCreatedAt())
                .build();
    }
}
