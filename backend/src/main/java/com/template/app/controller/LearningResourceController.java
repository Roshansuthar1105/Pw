package com.template.app.controller;

import com.template.app.dto.ApiResponse;
import com.template.app.dto.LearningDtos.ResourceInput;
import com.template.app.dto.LearningDtos.ResourceView;
import com.template.app.security.RequirePermission;
import com.template.app.service.LearningResourceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/resources")
@RequiredArgsConstructor
public class LearningResourceController {
    private final LearningResourceService resourceService;

    @GetMapping
    @RequirePermission("FN_RESOURCES_VIEW")
    public ResponseEntity<ApiResponse<List<ResourceView>>> list(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(ApiResponse.success(resourceService.list(type, courseId, subjectId, q)));
    }

    @PostMapping
    @RequirePermission("FN_RESOURCES_CREATE")
    public ResponseEntity<ApiResponse<ResourceView>> create(@Valid @RequestBody ResourceInput input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(resourceService.create(input)));
    }

    @PutMapping("/{id}")
    @RequirePermission("FN_RESOURCES_EDIT")
    public ResponseEntity<ApiResponse<ResourceView>> update(@PathVariable Long id, @Valid @RequestBody ResourceInput input) {
        return ResponseEntity.ok(ApiResponse.success(resourceService.update(id, input)));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("FN_RESOURCES_DELETE")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        resourceService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
