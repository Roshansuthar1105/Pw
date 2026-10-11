package com.template.app.service;

import com.template.app.dto.CreateRoleDTO;
import com.template.app.dto.RoleDTO;
import com.template.app.dto.UpdateRoleDTO;
import com.template.app.exception.ResourceNotFoundException;
import com.template.app.model.Component;
import com.template.app.model.Role;
import com.template.app.repository.ComponentRepository;
import com.template.app.repository.RoleRepository;
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
public class RoleService {

    private final RoleRepository roleRepository;
    private final ComponentRepository componentRepository;
    private final PermissionResolutionService permissionResolutionService;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<RoleDTO> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public RoleDTO getRoleById(Long id) {
        return roleRepository.findById(id)
                .map(this::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id: " + id));
    }

    @Transactional
    public RoleDTO createRole(CreateRoleDTO dto) {
        if (roleRepository.existsByCode(dto.getCode())) {
            throw new IllegalArgumentException("Role with code '" + dto.getCode() + "' already exists");
        }
        if (roleRepository.existsByName(dto.getName())) {
            throw new IllegalArgumentException("Role with name '" + dto.getName() + "' already exists");
        }

        Set<Component> components = new HashSet<>();
        if (dto.getComponentIds() != null && !dto.getComponentIds().isEmpty()) {
            components.addAll(componentRepository.findAllById(dto.getComponentIds()));
        }

        Role role = Role.builder()
                .name(dto.getName().trim())
                .code(dto.getCode().trim().toUpperCase())
                .description(dto.getDescription())
                .isSystem(false)
                .components(components)
                .build();

        Role saved = roleRepository.save(role);
        permissionResolutionService.invalidateAll();

        auditLogService.logAction(
                "CREATE",
                "ROLE",
                String.valueOf(saved.getId()),
                saved.getName(),
                "Created role with " + components.size() + " components assigned"
        );

        return toDTO(saved);
    }

    @Transactional
    public RoleDTO updateRole(Long id, UpdateRoleDTO dto) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id: " + id));

        role.setName(dto.getName().trim());
        role.setDescription(dto.getDescription());

        if (dto.getComponentIds() != null) {
            Set<Component> components = new HashSet<>(componentRepository.findAllById(dto.getComponentIds()));
            role.setComponents(components);
        }

        Role saved = roleRepository.save(role);
        permissionResolutionService.invalidateAll();

        auditLogService.logAction(
                "UPDATE",
                "ROLE",
                String.valueOf(saved.getId()),
                saved.getName(),
                "Updated role components: count=" + saved.getComponents().size()
        );

        return toDTO(saved);
    }

    @Transactional
    public void deleteRole(Long id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id: " + id));

        if (Boolean.TRUE.equals(role.getIsSystem())) {
            throw new IllegalArgumentException("System protected roles cannot be deleted");
        }

        roleRepository.delete(role);
        permissionResolutionService.invalidateAll();

        auditLogService.logAction(
                "DELETE",
                "ROLE",
                String.valueOf(id),
                role.getName(),
                "Deleted role with code=" + role.getCode()
        );
    }

    private RoleDTO toDTO(Role r) {
        return RoleDTO.builder()
                .id(r.getId())
                .name(r.getName())
                .code(r.getCode())
                .description(r.getDescription())
                .isSystem(r.getIsSystem())
                .componentIds(r.getComponents().stream().map(Component::getId).toList())
                .componentCount(r.getComponents().size())
                .build();
    }
}
