package com.template.app.controller;

import com.template.app.dto.ApiResponse;
import com.template.app.dto.LearningDtos.*;
import com.template.app.security.RequirePermission;
import com.template.app.service.QuestionImportService;
import com.template.app.service.QuestionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/questions")
@RequiredArgsConstructor
public class QuestionController {
    private final QuestionService questionService;
    private final QuestionImportService importService;

    @GetMapping
    @RequirePermission("FN_QUESTIONS_VIEW")
    public ResponseEntity<ApiResponse<List<QuestionView>>> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) Long topicId) {
        return ResponseEntity.ok(ApiResponse.success(questionService.list(q, courseId, subjectId, topicId)));
    }

    @GetMapping("/{id}")
    @RequirePermission("FN_QUESTIONS_VIEW")
    public ResponseEntity<ApiResponse<QuestionView>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(questionService.get(id)));
    }

    @PostMapping
    @RequirePermission("FN_QUESTIONS_CREATE")
    public ResponseEntity<ApiResponse<QuestionView>> create(@Valid @RequestBody QuestionInput input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(questionService.create(input)));
    }

    @PutMapping("/{id}")
    @RequirePermission("FN_QUESTIONS_EDIT")
    public ResponseEntity<ApiResponse<QuestionView>> update(@PathVariable Long id, @Valid @RequestBody QuestionInput input) {
        return ResponseEntity.ok(ApiResponse.success(questionService.update(id, input)));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("FN_QUESTIONS_DELETE")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        questionService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping(value = "/import/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @RequirePermission("FN_QUESTIONS_IMPORT")
    public ResponseEntity<ApiResponse<QuestionImportPreview>> preview(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.success(importService.preview(file)));
    }

    @PostMapping("/import/save")
    @RequirePermission("FN_QUESTIONS_IMPORT")
    public ResponseEntity<ApiResponse<List<QuestionView>>> saveImport(@Valid @RequestBody QuestionImportSaveRequest input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(questionService.saveImported(input)));
    }
}
