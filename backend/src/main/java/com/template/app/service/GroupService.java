package com.template.app.service;

import com.template.app.dto.CreateGroupDTO;
import com.template.app.dto.GroupDTO;
import com.template.app.dto.UpdateGroupDTO;
import com.template.app.dto.UserDTO;
import com.template.app.exception.ResourceNotFoundException;
import com.template.app.model.Group;
import com.template.app.model.Role;
import com.template.app.repository.GroupRepository;
import com.template.app.repository.RoleRepository;
import com.template.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class GroupService {

    private final GroupRepository groupRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PermissionResolutionService permissionResolutionService;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<GroupDTO> getAllGroups() {
        return groupRepository.findAll().stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public GroupDTO getGroupById(Long id) {
        return groupRepository.findById(id)
                .map(this::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public List<UserDTO> getUsersByGroup(Long groupId) {
        if (!groupRepository.existsById(groupId)) {
            throw new ResourceNotFoundException("Group not found with id: " + groupId);
        }
        return userRepository.findByGroupId(groupId).stream()
                .map(u -> UserDTO.builder()
                        .id(u.getId())
                        .username(u.getUsername())
                        .email(u.getEmail())
                        .userType(u.getUserType())
                        .isSuperAdmin(u.getIsSuperAdmin())
                        .active(u.getActive())
                        .createdAt(u.getCreatedAt())
                        .build())
                .toList();
    }

    @Transactional
    public GroupDTO createGroup(CreateGroupDTO dto) {
        if (groupRepository.existsByCode(dto.getCode())) {
            throw new IllegalArgumentException("Group with code '" + dto.getCode() + "' already exists");
        }
        if (groupRepository.existsByName(dto.getName())) {
            throw new IllegalArgumentException("Group with name '" + dto.getName() + "' already exists");
        }

        Set<Role> roles = new HashSet<>();
        if (dto.getRoleIds() != null && !dto.getRoleIds().isEmpty()) {
            roles.addAll(roleRepository.findAllById(dto.getRoleIds()));
        }

        Group group = Group.builder()
                .name(dto.getName().trim())
                .code(dto.getCode().trim().toUpperCase())
                .description(dto.getDescription())
                .isSystem(false)
                .isDefault(false)
                .roles(roles)
                .build();

        Group saved = groupRepository.save(group);
        permissionResolutionService.invalidateAll();

        auditLogService.logAction(
                "CREATE",
                "GROUP",
                String.valueOf(saved.getId()),
                saved.getName(),
                "Created group with code=" + saved.getCode()
        );

        return toDTO(saved);
    }

    @Transactional
    public GroupDTO updateGroup(Long id, UpdateGroupDTO dto) {
        Group group = groupRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found with id: " + id));

        // Protected system groups cannot be renamed
        if (Boolean.TRUE.equals(group.getIsSystem()) || Boolean.TRUE.equals(group.getIsDefault())) {
            if (!group.getName().equalsIgnoreCase(dto.getName().trim())) {
                throw new IllegalArgumentException("Default system groups cannot be renamed");
            }
        } else {
            group.setName(dto.getName().trim());
        }

        group.setDescription(dto.getDescription());

        if (dto.getRoleIds() != null) {
            Set<Role> roles = new HashSet<>(roleRepository.findAllById(dto.getRoleIds()));
            group.setRoles(roles);
        }

        Group saved = groupRepository.save(group);
        permissionResolutionService.invalidateAll();

        auditLogService.logAction(
                "UPDATE",
                "GROUP",
                String.valueOf(saved.getId()),
                saved.getName(),
                "Updated group roles count: " + saved.getRoles().size()
        );

        return toDTO(saved);
    }

    @Transactional
    public void deleteGroup(Long id) {
        Group group = groupRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found with id: " + id));

        if (Boolean.TRUE.equals(group.getIsSystem()) || Boolean.TRUE.equals(group.getIsDefault())) {
            throw new IllegalArgumentException("Default system groups are protected and cannot be deleted");
        }

        groupRepository.delete(group);
        permissionResolutionService.invalidateAll();

        auditLogService.logAction(
                "DELETE",
                "GROUP",
                String.valueOf(id),
                group.getName(),
                "Deleted group with code=" + group.getCode()
        );
    }

    private GroupDTO toDTO(Group g) {
        return GroupDTO.builder()
                .id(g.getId())
                .name(g.getName())
                .code(g.getCode())
                .description(g.getDescription())
                .isSystem(g.getIsSystem())
                .isDefault(g.getIsDefault())
                .defaultForUserType(g.getDefaultForUserType())
                .roleIds(g.getRoles().stream().map(Role::getId).toList())
                .roleNames(g.getRoles().stream().map(Role::getName).toList())
                .userCount(g.getUsers() != null ? g.getUsers().size() : 0)
                .build();
    }
}
