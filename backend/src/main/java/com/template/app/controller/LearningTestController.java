package com.template.app.controller;

import com.template.app.dto.ApiResponse;
import com.template.app.dto.LearningDtos.*;
import com.template.app.security.RequirePermission;
import com.template.app.service.LearningTestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tests")
@RequiredArgsConstructor
public class LearningTestController {
    private final LearningTestService testService;

    @GetMapping
    @RequirePermission("FN_TESTS_VIEW")
    public ResponseEntity<ApiResponse<List<TestSummary>>> list() {
        return ResponseEntity.ok(ApiResponse.success(testService.list()));
    }

    @GetMapping("/manage/{id}")
    @RequirePermission("FN_TESTS_EDIT")
    public ResponseEntity<ApiResponse<TestDetail>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(testService.get(id)));
    }

    @PostMapping
    @RequirePermission("FN_TESTS_CREATE")
    public ResponseEntity<ApiResponse<TestDetail>> create(@Valid @RequestBody TestInput input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(testService.create(input)));
    }

    @PutMapping("/{id}")
    @RequirePermission("FN_TESTS_EDIT")
    public ResponseEntity<ApiResponse<TestDetail>> update(@PathVariable Long id, @Valid @RequestBody TestInput input) {
        return ResponseEntity.ok(ApiResponse.success(testService.update(id, input)));
    }

    @PostMapping("/{id}/publish")
    @RequirePermission("FN_TESTS_PUBLISH")
    public ResponseEntity<ApiResponse<TestSummary>> publish(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(testService.publish(id)));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("FN_TESTS_DELETE")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        testService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{id}/attempts")
    @RequirePermission("FN_TESTS_ATTEMPT")
    public ResponseEntity<ApiResponse<AttemptStart>> start(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(testService.startAttempt(id)));
    }

    @PutMapping("/{testId}/attempts/{attemptId}")
    @RequirePermission("FN_TESTS_ATTEMPT")
    public ResponseEntity<ApiResponse<AttemptResult>> saveAnswers(
            @PathVariable Long testId, @PathVariable Long attemptId, @Valid @RequestBody AttemptSave input) {
        return ResponseEntity.ok(ApiResponse.success(testService.saveAnswers(testId, attemptId, input.answers())));
    }

    @PostMapping("/{testId}/attempts/{attemptId}/submit")
    @RequirePermission("FN_TESTS_ATTEMPT")
    public ResponseEntity<ApiResponse<AttemptResult>> submit(@PathVariable Long testId, @PathVariable Long attemptId) {
        return ResponseEntity.ok(ApiResponse.success(testService.submitAttempt(testId, attemptId)));
    }
}
