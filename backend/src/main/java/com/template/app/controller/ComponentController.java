package com.template.app.controller;

import com.template.app.dto.ApiResponse;
import com.template.app.dto.ComponentDTO;
import com.template.app.dto.CreateComponentDTO;
import com.template.app.dto.UpdateComponentDTO;
import com.template.app.security.RequirePermission;
import com.template.app.service.ComponentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/components")
@RequiredArgsConstructor
public class ComponentController {

    private final ComponentService componentService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ComponentDTO>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(componentService.getAllComponents()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ComponentDTO>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(componentService.getComponentById(id)));
    }

    @PostMapping
    @RequirePermission("FN_COMPONENTS_MANAGE")
    public ResponseEntity<ApiResponse<ComponentDTO>> create(@Valid @RequestBody CreateComponentDTO dto) {
        ComponentDTO created = componentService.createComponent(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Component registered successfully", created));
    }

    @PutMapping("/{id}")
    @RequirePermission("FN_COMPONENTS_MANAGE")
    public ResponseEntity<ApiResponse<ComponentDTO>> update(@PathVariable Long id, @Valid @RequestBody UpdateComponentDTO dto) {
        ComponentDTO updated = componentService.updateComponent(id, dto);
        return ResponseEntity.ok(ApiResponse.ok("Component updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("FN_COMPONENTS_MANAGE")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        componentService.deleteComponent(id);
        return ResponseEntity.ok(ApiResponse.ok("Component deleted successfully", null));
    }

    @PostMapping("/init-defaults")
    public ResponseEntity<ApiResponse<Void>> initDefaults() {
        componentService.bootstrapDefaultPlatformComponents();
        return ResponseEntity.ok(ApiResponse.ok("Default platform components initialized", null));
    }
}
