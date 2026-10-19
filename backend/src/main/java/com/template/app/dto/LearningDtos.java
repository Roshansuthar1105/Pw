package com.template.app.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public final class LearningDtos {
    private LearningDtos() {}

    public record CourseInput(@NotBlank @Size(max = 180) String name, @Size(max = 1000) String description) {}
    public record SubjectInput(@NotNull Long courseId, @NotBlank @Size(max = 180) String name) {}
    public record TopicInput(@NotNull Long subjectId, @NotBlank @Size(max = 180) String name) {}
    public record TopicView(Long id, String name) {}
    public record SubjectView(Long id, String name, List<TopicView> topics) {}
    public record CourseView(Long id, String name, String description, List<SubjectView> subjects) {}

    public record OptionInput(@NotBlank String key, @NotBlank String content) {}
    public record QuestionInput(
            @NotNull Long courseId,
            @NotNull Long subjectId,
            Long topicId,
            @NotBlank @Size(max = 12000) String prompt,
            @Size(max = 1500) String imageUrl,
            @Size(max = 12000) String explanation,
            @NotBlank String correctOption,
            @NotNull @Min(1) @Max(1000) Integer marks,
            @NotBlank String difficulty,
            @NotEmpty @Size(min = 2, max = 6) List<@Valid OptionInput> options) {}
    public record QuestionView(
            Long id, Long courseId, String courseName, Long subjectId, String subjectName,
            Long topicId, String topicName, String prompt, String imageUrl, String explanation,
            String correctOption, Integer marks, String difficulty, List<OptionInput> options,
            LocalDateTime createdAt) {}

    public record ResourceInput(
            @NotNull Long courseId, @NotNull Long subjectId, Long topicId,
            @NotBlank String type, @NotBlank @Size(max = 240) String title,
            @Size(max = 1500) String description, @NotBlank @Size(max = 1500) String url,
            Boolean published) {}
    public record ResourceView(
            Long id, Long courseId, String courseName, Long subjectId, String subjectName,
            Long topicId, String topicName, String type, String title, String description,
            String url, Boolean published, LocalDateTime createdAt) {}

    public record TestInput(
            @NotNull Long courseId, @NotNull Long subjectId,
            @NotBlank @Size(max = 240) String title, @Size(max = 2000) String instructions,
            @NotNull @Min(1) @Max(600) Integer durationMinutes,
            LocalDateTime availableFrom, LocalDateTime availableUntil,
            @NotEmpty List<@NotNull Long> questionIds) {}
    public record TestSummary(
            Long id, Long courseId, String courseName, Long subjectId, String subjectName,
            String title, String instructions, Integer durationMinutes,
            LocalDateTime availableFrom, LocalDateTime availableUntil,
            Boolean published, Integer questionCount, Integer totalMarks,
            String attemptStatus, Integer score) {}
    public record TestDetail(Long id, Long courseId, Long subjectId, String title, String instructions,
                             Integer durationMinutes, LocalDateTime availableFrom, LocalDateTime availableUntil,
                             Boolean published, List<Long> questionIds) {}
    public record AttemptQuestion(Long id, String prompt, String imageUrl, Integer marks, List<OptionInput> options) {}
    public record AttemptStart(
            Long attemptId, Long testId, String title, String instructions,
            Integer durationMinutes, LocalDateTime startedAt,
            List<AttemptQuestion> questions, Map<Long, String> answers) {}
    public record AttemptSave(@NotNull Map<Long, String> answers) {}
    public record AttemptResult(Long attemptId, String status, Integer score, Integer totalMarks, LocalDateTime submittedAt) {}

    public record QuestionImportDraft(
            String prompt, String imageUrl, String explanation, String correctOption,
            Integer marks, String difficulty, List<OptionInput> options,
            String source, List<String> errors) {}
    public record QuestionImportPreview(List<QuestionImportDraft> questions, List<String> errors) {}
    public record QuestionImportSaveRequest(
            @NotNull Long courseId, @NotNull Long subjectId, Long topicId,
            @NotEmpty List<@Valid QuestionImportDraft> questions) {}
}
