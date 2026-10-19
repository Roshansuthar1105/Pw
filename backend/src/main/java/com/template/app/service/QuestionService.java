package com.template.app.service;

import com.template.app.dto.LearningDtos.*;
import com.template.app.exception.ResourceNotFoundException;
import com.template.app.model.*;
import com.template.app.repository.LearningTestRepository;
import com.template.app.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.util.*;

@Service
@RequiredArgsConstructor
public class QuestionService {
    private static final List<String> OPTION_KEYS = List.of("A", "B", "C", "D", "E", "F");
    private static final Set<String> DIFFICULTIES = Set.of("EASY", "MEDIUM", "HARD");

    private final QuestionRepository questionRepository;
    private final LearningTestRepository testRepository;
    private final LearningCatalogService catalogService;

    @Transactional(readOnly = true)
    public List<QuestionView> list(String query, Long courseId, Long subjectId, Long topicId) {
        String search = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        return questionRepository.findAllByActiveTrueOrderByCreatedAtDesc().stream()
                .filter(q -> courseId == null || q.getCourse().getId().equals(courseId))
                .filter(q -> subjectId == null || q.getSubject().getId().equals(subjectId))
                .filter(q -> topicId == null || (q.getTopic() != null && q.getTopic().getId().equals(topicId)))
                .filter(q -> search.isEmpty() || q.getPrompt().toLowerCase(Locale.ROOT).contains(search)
                        || (q.getExplanation() != null && q.getExplanation().toLowerCase(Locale.ROOT).contains(search)))
                .map(this::toView).toList();
    }

    @Transactional(readOnly = true)
    public QuestionView get(Long id) { return toView(requireQuestion(id)); }

    @Transactional
    public QuestionView create(QuestionInput input) {
        Question q = new Question();
        apply(q, input);
        q.setCreatedBy(com.template.app.security.UserContextHolder.getCurrentUserId());
        return toView(questionRepository.save(q));
    }

    @Transactional
    public QuestionView update(Long id, QuestionInput input) {
        Question q = requireQuestion(id);
        if (testRepository.existsByQuestions_IdAndPublishedTrue(id)) {
            throw new IllegalArgumentException("This question belongs to a published test and cannot be edited.");
        }
        apply(q, input);
        return toView(q);
    }

    @Transactional
    public void delete(Long id) {
        Question q = requireQuestion(id);
        if (testRepository.existsByQuestions_Id(id)) {
            throw new IllegalArgumentException("Remove this question from its tests before deleting it.");
        }
        questionRepository.delete(q);
    }

    @Transactional
    public List<QuestionView> saveImported(QuestionImportSaveRequest request) {
        catalogService.validateTaxonomy(request.courseId(), request.subjectId(), request.topicId());
        if (request.questions().size() > 500) throw new IllegalArgumentException("A single import can contain at most 500 questions.");
        List<QuestionView> saved = new ArrayList<>();
        for (QuestionImportDraft draft : request.questions()) {
            if (draft.errors() != null && !draft.errors().isEmpty()) {
                throw new IllegalArgumentException("Correct the import preview errors before saving.");
            }
            QuestionInput input = new QuestionInput(request.courseId(), request.subjectId(), request.topicId(),
                    draft.prompt(), draft.imageUrl(), draft.explanation(), draft.correctOption(),
                    draft.marks() == null ? 1 : draft.marks(),
                    draft.difficulty() == null || draft.difficulty().isBlank() ? "MEDIUM" : draft.difficulty(),
                    draft.options());
            Question q = new Question();
            apply(q, input);
            q.setCreatedBy(com.template.app.security.UserContextHolder.getCurrentUserId());
            saved.add(toView(questionRepository.save(q)));
        }
        return saved;
    }

    Question requireQuestion(Long id) {
        return questionRepository.findById(id).filter(q -> Boolean.TRUE.equals(q.getActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Question not found."));
    }

    private void apply(Question q, QuestionInput input) {
        catalogService.validateTaxonomy(input.courseId(), input.subjectId(), input.topicId());
        String prompt = input.prompt() == null ? "" : input.prompt().trim();
        if (prompt.isEmpty()) throw new IllegalArgumentException("Question text is required.");
        if (input.options() == null || input.options().size() < 2 || input.options().size() > 6) {
            throw new IllegalArgumentException("A question must have between 2 and 6 options.");
        }
        String correct = normalizeKey(input.correctOption());
        List<QuestionOption> options = new ArrayList<>();
        Set<String> keys = new HashSet<>();
        for (int index = 0; index < input.options().size(); index++) {
            OptionInput option = input.options().get(index);
            String key = normalizeKey(option.key());
            String content = option.content() == null ? "" : option.content().trim();
            if (!OPTION_KEYS.contains(key) || content.isEmpty() || !keys.add(key)) {
                throw new IllegalArgumentException("Options need unique labels A–F and non-empty text.");
            }
            options.add(QuestionOption.builder().key(key).content(content).build());
        }
        if (!keys.contains(correct)) throw new IllegalArgumentException("The correct answer must match one of the options.");
        String difficulty = input.difficulty() == null ? "" : input.difficulty().trim().toUpperCase(Locale.ROOT);
        if (!DIFFICULTIES.contains(difficulty)) throw new IllegalArgumentException("Difficulty must be Easy, Medium, or Hard.");
        if (input.marks() == null || input.marks() < 1) throw new IllegalArgumentException("Marks must be at least 1.");
        String imageUrl = cleanUrl(input.imageUrl());
        q.setCourse(catalogService.requireCourse(input.courseId()));
        q.setSubject(catalogService.requireSubject(input.subjectId()));
        q.setTopic(input.topicId() == null ? null : catalogService.requireTopic(input.topicId()));
        q.setPrompt(prompt);
        q.setImageUrl(imageUrl);
        q.setExplanation(input.explanation() == null || input.explanation().isBlank() ? null : input.explanation().trim());
        q.setCorrectOption(correct);
        q.setMarks(input.marks());
        q.setDifficulty(difficulty);
        q.setActive(true);
        q.setOptions(options);
    }

    private String cleanUrl(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            URI uri = URI.create(value.trim());
            if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null) throw new IllegalArgumentException();
            return uri.toString();
        } catch (Exception ex) {
            throw new IllegalArgumentException("Question image must be a valid HTTPS URL.");
        }
    }

    private String normalizeKey(String key) { return key == null ? "" : key.trim().toUpperCase(Locale.ROOT); }

    private QuestionView toView(Question q) {
        return new QuestionView(q.getId(), q.getCourse().getId(), q.getCourse().getName(),
                q.getSubject().getId(), q.getSubject().getName(),
                q.getTopic() == null ? null : q.getTopic().getId(),
                q.getTopic() == null ? null : q.getTopic().getName(),
                q.getPrompt(), q.getImageUrl(), q.getExplanation(), q.getCorrectOption(), q.getMarks(), q.getDifficulty(),
                q.getOptions().stream().map(o -> new OptionInput(o.getKey(), o.getContent())).toList(), q.getCreatedAt());
    }
}
