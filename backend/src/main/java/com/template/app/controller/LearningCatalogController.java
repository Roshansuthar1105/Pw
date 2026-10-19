package com.template.app.controller;

import com.template.app.dto.ApiResponse;
import com.template.app.dto.LearningDtos.*;
import com.template.app.security.RequirePermission;
import com.template.app.service.LearningCatalogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/learning/taxonomy")
@RequiredArgsConstructor
public class LearningCatalogController {
    private final LearningCatalogService catalogService;

    @GetMapping
    @RequirePermission("FN_TAXONOMY_VIEW")
    public ResponseEntity<ApiResponse<List<CourseView>>> getTaxonomy() {
        return ResponseEntity.ok(ApiResponse.success(catalogService.getTaxonomy()));
    }

    @PostMapping("/courses")
    @RequirePermission("FN_TAXONOMY_MANAGE")
    public ResponseEntity<ApiResponse<CourseView>> createCourse(@Valid @RequestBody CourseInput input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(catalogService.createCourse(input)));
    }

    @PutMapping("/courses/{id}")
    @RequirePermission("FN_TAXONOMY_MANAGE")
    public ResponseEntity<ApiResponse<CourseView>> updateCourse(@PathVariable Long id, @Valid @RequestBody CourseInput input) {
        return ResponseEntity.ok(ApiResponse.success(catalogService.updateCourse(id, input)));
    }

    @DeleteMapping("/courses/{id}")
    @RequirePermission("FN_TAXONOMY_MANAGE")
    public ResponseEntity<ApiResponse<Void>> archiveCourse(@PathVariable Long id) {
        catalogService.archiveCourse(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/subjects")
    @RequirePermission("FN_TAXONOMY_MANAGE")
    public ResponseEntity<ApiResponse<SubjectView>> createSubject(@Valid @RequestBody SubjectInput input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(catalogService.createSubject(input)));
    }

    @PutMapping("/subjects/{id}")
    @RequirePermission("FN_TAXONOMY_MANAGE")
    public ResponseEntity<ApiResponse<SubjectView>> updateSubject(@PathVariable Long id, @Valid @RequestBody SubjectInput input) {
        return ResponseEntity.ok(ApiResponse.success(catalogService.updateSubject(id, input)));
    }

    @DeleteMapping("/subjects/{id}")
    @RequirePermission("FN_TAXONOMY_MANAGE")
    public ResponseEntity<ApiResponse<Void>> archiveSubject(@PathVariable Long id) {
        catalogService.archiveSubject(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/topics")
    @RequirePermission("FN_TAXONOMY_MANAGE")
    public ResponseEntity<ApiResponse<TopicView>> createTopic(@Valid @RequestBody TopicInput input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(catalogService.createTopic(input)));
    }

    @PutMapping("/topics/{id}")
    @RequirePermission("FN_TAXONOMY_MANAGE")
    public ResponseEntity<ApiResponse<TopicView>> updateTopic(@PathVariable Long id, @Valid @RequestBody TopicInput input) {
        return ResponseEntity.ok(ApiResponse.success(catalogService.updateTopic(id, input)));
    }

    @DeleteMapping("/topics/{id}")
    @RequirePermission("FN_TAXONOMY_MANAGE")
    public ResponseEntity<ApiResponse<Void>> archiveTopic(@PathVariable Long id) {
        catalogService.archiveTopic(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
