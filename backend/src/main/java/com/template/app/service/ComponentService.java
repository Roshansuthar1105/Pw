package com.template.app.service;

import com.template.app.dto.ComponentDTO;
import com.template.app.dto.CreateComponentDTO;
import com.template.app.dto.UpdateComponentDTO;
import com.template.app.exception.ResourceNotFoundException;
import com.template.app.model.Component;
import com.template.app.model.ComponentLevel;
import com.template.app.repository.ComponentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ComponentService {

    private final ComponentRepository componentRepository;
    private final PermissionResolutionService permissionResolutionService;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<ComponentDTO> getAllComponents() {
        return componentRepository.findAll().stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public ComponentDTO getComponentById(Long id) {
        return componentRepository.findById(id)
                .map(this::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Component not found with id: " + id));
    }

    @Transactional
    public ComponentDTO createComponent(CreateComponentDTO dto) {
        if (componentRepository.existsByCode(dto.getCode())) {
            throw new IllegalArgumentException("Component with code '" + dto.getCode() + "' already exists");
        }

        Component parent = null;
        if (dto.getLevel() == ComponentLevel.MENU) {
            if (dto.getParentId() != null) {
                throw new IllegalArgumentException("MENU components cannot have a parent");
            }
        } else if (dto.getLevel() == ComponentLevel.SUBMENU) {
            if (dto.getParentId() == null) {
                throw new IllegalArgumentException("SUBMENU components must have a parent MENU");
            }
            parent = componentRepository.findById(dto.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent component not found with id: " + dto.getParentId()));
            if (parent.getLevel() != ComponentLevel.MENU) {
                throw new IllegalArgumentException("SUBMENU parent must be a MENU component");
            }
        } else if (dto.getLevel() == ComponentLevel.FUNCTIONALITY) {
            if (dto.getParentId() == null) {
                throw new IllegalArgumentException("FUNCTIONALITY components must have a parent SUBMENU");
            }
            parent = componentRepository.findById(dto.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent component not found with id: " + dto.getParentId()));
            if (parent.getLevel() != ComponentLevel.SUBMENU) {
                throw new IllegalArgumentException("FUNCTIONALITY parent must be a SUBMENU component");
            }
        }

        Component component = Component.builder()
                .level(dto.getLevel())
                .parent(parent)
                .code(dto.getCode().trim().toUpperCase())
                .name(dto.getName().trim())
                .icon(dto.getIcon())
                .route(dto.getRoute())
                .helpText(dto.getHelpText())
                .elementType(dto.getElementType())
                .sortOrder(dto.getSortOrder() != null ? dto.getSortOrder() : 0)
                .active(true)
                .build();

        Component saved = componentRepository.save(component);
        permissionResolutionService.invalidateAll();

        auditLogService.logAction(
                "CREATE",
                "COMPONENT",
                String.valueOf(saved.getId()),
                saved.getName(),
                "Created " + saved.getLevel() + " with code=" + saved.getCode()
        );

        return toDTO(saved);
    }

    @Transactional
    public ComponentDTO updateComponent(Long id, UpdateComponentDTO dto) {
        Component component = componentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Component not found with id: " + id));

        component.setName(dto.getName().trim());
        component.setIcon(dto.getIcon());
        component.setRoute(dto.getRoute());
        component.setHelpText(dto.getHelpText());
        component.setElementType(dto.getElementType());
        if (dto.getSortOrder() != null) {
            component.setSortOrder(dto.getSortOrder());
        }
        if (dto.getActive() != null) {
            component.setActive(dto.getActive());
        }

        Component saved = componentRepository.save(component);
        permissionResolutionService.invalidateAll();

        auditLogService.logAction(
                "UPDATE",
                "COMPONENT",
                String.valueOf(saved.getId()),
                saved.getName(),
                "Updated component: name=" + saved.getName() + " active=" + saved.getActive()
        );

        return toDTO(saved);
    }

    @Transactional
    public void deleteComponent(Long id) {
        Component component = componentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Component not found with id: " + id));

        componentRepository.delete(component);
        permissionResolutionService.invalidateAll();

        auditLogService.logAction(
                "DELETE",
                "COMPONENT",
                String.valueOf(id),
                component.getName(),
                "Deleted component with code=" + component.getCode()
        );
    }

    @Transactional
    public void bootstrapDefaultPlatformComponents() {
        if (!componentRepository.findAll().isEmpty()) {
            return;
        }

        log.info("Bootstrapping default platform components...");

        // 1. Dashboard Menu
        Component menuDash = componentRepository.save(Component.builder()
                .level(ComponentLevel.MENU)
                .code("MENU_DASHBOARD")
                .name("Dashboard")
                .icon("layout-dashboard")
                .sortOrder(1)
                .active(true)
                .build());

        Component subDash = componentRepository.save(Component.builder()
                .level(ComponentLevel.SUBMENU)
                .parent(menuDash)
                .code("SUBMENU_DASHBOARD_OVERVIEW")
                .name("Overview")
                .route("/")
                .helpText("Platform overview and status metrics")
                .sortOrder(1)
                .active(true)
                .build());

        componentRepository.save(Component.builder()
                .level(ComponentLevel.FUNCTIONALITY)
                .parent(subDash)
                .code("FN_DASHBOARD_REFRESH")
                .name("Refresh Status")
                .elementType("BUTTON")
                .sortOrder(1)
                .active(true)
                .build());

        // 2. Items Menu
        Component menuItems = componentRepository.save(Component.builder()
                .level(ComponentLevel.MENU)
                .code("MENU_ITEMS")
                .name("Course Materials")
                .icon("package")
                .sortOrder(2)
                .active(true)
                .build());

        Component subItems = componentRepository.save(Component.builder()
                .level(ComponentLevel.SUBMENU)
                .parent(menuItems)
                .code("SUBMENU_ITEMS_LIST")
                .name("Items Catalog")
                .route("/items")
                .helpText("Course workbook and catalog management")
                .sortOrder(1)
                .active(true)
                .build());

        componentRepository.save(Component.builder()
                .level(ComponentLevel.FUNCTIONALITY)
                .parent(subItems)
                .code("FN_ITEMS_CREATE")
                .name("Create Item")
                .elementType("BUTTON")
                .sortOrder(1)
                .active(true)
                .build());

        componentRepository.save(Component.builder()
                .level(ComponentLevel.FUNCTIONALITY)
                .parent(subItems)
                .code("FN_ITEMS_EDIT")
                .name("Edit Item")
                .elementType("BUTTON")
                .sortOrder(2)
                .active(true)
                .build());

        componentRepository.save(Component.builder()
                .level(ComponentLevel.FUNCTIONALITY)
                .parent(subItems)
                .code("FN_ITEMS_DELETE")
                .name("Delete Item")
                .elementType("BUTTON")
                .sortOrder(3)
                .active(true)
                .build());

        // 3. Admin Control Panel Menu
        Component menuAdmin = componentRepository.save(Component.builder()
                .level(ComponentLevel.MENU)
                .code("MENU_ADMIN")
                .name("Access Control")
                .icon("shield")
                .sortOrder(3)
                .active(true)
                .build());

        Component subComponents = componentRepository.save(Component.builder()
                .level(ComponentLevel.SUBMENU)
                .parent(menuAdmin)
                .code("SUBMENU_ADMIN_COMPONENTS")
                .name("Component Manager")
                .route("/admin/components")
                .helpText("Register and organize menus, submenus, and functionalities")
                .sortOrder(1)
                .active(true)
                .build());

        componentRepository.save(Component.builder()
                .level(ComponentLevel.FUNCTIONALITY)
                .parent(subComponents)
                .code("FN_COMPONENTS_MANAGE")
                .name("Manage Components")
                .elementType("BUTTON")
                .sortOrder(1)
                .active(true)
                .build());

        Component subRoles = componentRepository.save(Component.builder()
                .level(ComponentLevel.SUBMENU)
                .parent(menuAdmin)
                .code("SUBMENU_ADMIN_ROLES")
                .name("Role Builder")
                .route("/admin/roles")
                .helpText("Create roles and assign component permission bundles")
                .sortOrder(2)
                .active(true)
                .build());

        componentRepository.save(Component.builder()
                .level(ComponentLevel.FUNCTIONALITY)
                .parent(subRoles)
                .code("FN_ROLES_MANAGE")
                .name("Manage Roles")
                .elementType("BUTTON")
                .sortOrder(1)
                .active(true)
                .build());

        Component subGroups = componentRepository.save(Component.builder()
                .level(ComponentLevel.SUBMENU)
                .parent(menuAdmin)
                .code("SUBMENU_ADMIN_GROUPS")
                .name("Group Manager")
                .route("/admin/groups")
                .helpText("Organize users into cohorts and assign permission roles")
                .sortOrder(3)
                .active(true)
                .build());

        componentRepository.save(Component.builder()
                .level(ComponentLevel.FUNCTIONALITY)
                .parent(subGroups)
                .code("FN_GROUPS_MANAGE")
                .name("Manage Groups")
                .elementType("BUTTON")
                .sortOrder(1)
                .active(true)
                .build());

        Component subUsers = componentRepository.save(Component.builder()
                .level(ComponentLevel.SUBMENU)
                .parent(menuAdmin)
                .code("SUBMENU_ADMIN_USERS")
                .name("User Manager")
                .route("/admin/users")
                .helpText("Manage user accounts, domain identity, and group assignments")
                .sortOrder(4)
                .active(true)
                .build());

        componentRepository.save(Component.builder()
                .level(ComponentLevel.FUNCTIONALITY)
                .parent(subUsers)
                .code("FN_USERS_MANAGE")
                .name("Manage Users")
                .elementType("BUTTON")
                .sortOrder(1)
                .active(true)
                .build());

        Component subAudit = componentRepository.save(Component.builder()
                .level(ComponentLevel.SUBMENU)
                .parent(menuAdmin)
                .code("SUBMENU_ADMIN_AUDIT")
                .name("Audit Logs")
                .route("/admin/audit-logs")
                .helpText("Review security audit trail and configuration changes")
                .sortOrder(5)
                .active(true)
                .build());

        permissionResolutionService.invalidateAll();
        log.info("Default platform components bootstrap complete.");
    }

    private ComponentDTO toDTO(Component c) {
        return ComponentDTO.builder()
                .id(c.getId())
                .level(c.getLevel())
                .parentId(c.getParent() != null ? c.getParent().getId() : null)
                .parentName(c.getParent() != null ? c.getParent().getName() : null)
                .code(c.getCode())
                .name(c.getName())
                .icon(c.getIcon())
                .route(c.getRoute())
                .helpText(c.getHelpText())
                .elementType(c.getElementType())
                .sortOrder(c.getSortOrder())
                .active(c.getActive())
                .build();
    }
}
