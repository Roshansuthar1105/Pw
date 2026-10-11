package com.template.app.service;

import com.template.app.dto.FunctionalityTreeDTO;
import com.template.app.dto.MenuTreeDTO;
import com.template.app.dto.ResolvedPermissionsDTO;
import com.template.app.dto.SubmenuTreeDTO;
import com.template.app.exception.ResourceNotFoundException;
import com.template.app.model.*;
import com.template.app.repository.ComponentRepository;
import com.template.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PermissionResolutionService {

    private final UserRepository userRepository;
    private final ComponentRepository componentRepository;

    private static final long CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL

    private record CachedPermissions(ResolvedPermissionsDTO permissions, long timestamp) {}

    private final Map<Long, CachedPermissions> cache = new ConcurrentHashMap<>();

    @Transactional(readOnly = true)
    public ResolvedPermissionsDTO resolvePermissions(Long userId) {
        long now = System.currentTimeMillis();
        CachedPermissions cached = cache.get(userId);
        if (cached != null && (now - cached.timestamp()) < CACHE_TTL_MS) {
            log.debug("Returning cached permissions for userId={}", userId);
            return cached.permissions();
        }

        User user = userRepository.findByIdWithGroups(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        ResolvedPermissionsDTO resolved;
        if (Boolean.TRUE.equals(user.getIsSuperAdmin())) {
            log.debug("User id={} is Super Admin. Granting bypass access to all components.", userId);
            resolved = resolveSuperAdminPermissions();
        } else {
            resolved = resolveStandardUserPermissions(user);
        }

        cache.put(userId, new CachedPermissions(resolved, now));
        return resolved;
    }

    private ResolvedPermissionsDTO resolveSuperAdminPermissions() {
        List<Component> allActive = componentRepository.findByActiveTrueOrderBySortOrderAscNameAsc();
        Set<String> flatCodes = allActive.stream()
                .map(Component::getCode)
                .collect(Collectors.toSet());

        List<MenuTreeDTO> tree = buildTreeFromComponents(allActive, flatCodes);
        return ResolvedPermissionsDTO.builder()
                .flatCodes(flatCodes)
                .tree(tree)
                .build();
    }

    private ResolvedPermissionsDTO resolveStandardUserPermissions(User user) {
        Set<Component> userComponents = new HashSet<>();

        // Full additive traversal: User -> Groups -> Roles -> Components
        for (Group group : user.getGroups()) {
            for (Role role : group.getRoles()) {
                for (Component component : role.getComponents()) {
                    if (Boolean.TRUE.equals(component.getActive())) {
                        userComponents.add(component);
                    }
                }
            }
        }

        Set<String> flatCodes = userComponents.stream()
                .map(Component::getCode)
                .collect(Collectors.toSet());

        // Include ancestor components so the tree renders properly
        Set<Component> allVisibleComponents = new HashSet<>(userComponents);
        for (Component c : userComponents) {
            Component curr = c.getParent();
            while (curr != null && Boolean.TRUE.equals(curr.getActive())) {
                allVisibleComponents.add(curr);
                flatCodes.add(curr.getCode());
                curr = curr.getParent();
            }
        }

        List<MenuTreeDTO> tree = buildTreeFromComponents(new ArrayList<>(allVisibleComponents), flatCodes);

        return ResolvedPermissionsDTO.builder()
                .flatCodes(flatCodes)
                .tree(tree)
                .build();
    }

    private List<MenuTreeDTO> buildTreeFromComponents(List<Component> components, Set<String> permittedCodes) {
        List<Component> menus = components.stream()
                .filter(c -> c.getLevel() == ComponentLevel.MENU && permittedCodes.contains(c.getCode()))
                .sorted(Comparator.comparingInt(Component::getSortOrder).thenComparing(Component::getName))
                .toList();

        List<Component> submenus = components.stream()
                .filter(c -> c.getLevel() == ComponentLevel.SUBMENU && permittedCodes.contains(c.getCode()))
                .sorted(Comparator.comparingInt(Component::getSortOrder).thenComparing(Component::getName))
                .toList();

        List<Component> functionalities = components.stream()
                .filter(c -> c.getLevel() == ComponentLevel.FUNCTIONALITY && permittedCodes.contains(c.getCode()))
                .sorted(Comparator.comparingInt(Component::getSortOrder).thenComparing(Component::getName))
                .toList();

        Map<Long, List<FunctionalityTreeDTO>> funcsBySubmenu = new HashMap<>();
        for (Component f : functionalities) {
            if (f.getParent() != null) {
                funcsBySubmenu.computeIfAbsent(f.getParent().getId(), k -> new ArrayList<>())
                        .add(FunctionalityTreeDTO.builder()
                                .id(f.getId())
                                .code(f.getCode())
                                .name(f.getName())
                                .elementType(f.getElementType())
                                .sortOrder(f.getSortOrder())
                                .build());
            }
        }

        Map<Long, List<SubmenuTreeDTO>> subsByMenu = new HashMap<>();
        for (Component s : submenus) {
            if (s.getParent() != null) {
                List<FunctionalityTreeDTO> fnList = funcsBySubmenu.getOrDefault(s.getId(), Collections.emptyList());
                subsByMenu.computeIfAbsent(s.getParent().getId(), k -> new ArrayList<>())
                        .add(SubmenuTreeDTO.builder()
                                .id(s.getId())
                                .code(s.getCode())
                                .name(s.getName())
                                .route(s.getRoute())
                                .helpText(s.getHelpText())
                                .sortOrder(s.getSortOrder())
                                .functionalities(fnList)
                                .build());
            }
        }

        List<MenuTreeDTO> tree = new ArrayList<>();
        for (Component m : menus) {
            List<SubmenuTreeDTO> subList = subsByMenu.getOrDefault(m.getId(), Collections.emptyList());
            tree.add(MenuTreeDTO.builder()
                    .id(m.getId())
                    .code(m.getCode())
                    .name(m.getName())
                    .icon(m.getIcon())
                    .sortOrder(m.getSortOrder())
                    .submenus(subList)
                    .build());
        }

        return tree;
    }

    public void invalidateUser(Long userId) {
        cache.remove(userId);
    }

    public void invalidateAll() {
        log.info("Invalidating entire permissions cache due to RBAC configuration mutation.");
        cache.clear();
    }
}
