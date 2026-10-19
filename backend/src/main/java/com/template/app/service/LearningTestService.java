package com.template.app.service;

import com.template.app.dto.LearningDtos.*;
import com.template.app.exception.AccessDeniedException;
import com.template.app.exception.ResourceNotFoundException;
import com.template.app.model.*;
import com.template.app.repository.LearningTestRepository;
import com.template.app.repository.QuestionRepository;
import com.template.app.repository.TestAttemptRepository;
import com.template.app.security.UserContextHolder;
import com.template.app.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LearningTestService {
    private final LearningTestRepository testRepository;
    private final QuestionRepository questionRepository;
    private final TestAttemptRepository attemptRepository;
    private final LearningCatalogService catalogService;

    @Transactional(readOnly = true)
    public List<TestSummary> list() {
        UserPrincipal principal = requirePrincipal();
        boolean student = principal.getUserType() == UserType.STUDENT;
        List<LearningTest> tests = student
                ? testRepository.findAllByPublishedTrueOrderByAvailableFromAsc()
                : testRepository.findAllByOrderByCreatedAtDesc();
        return tests.stream().map(t -> toSummary(t, student ? principal.getId() : null)).toList();
    }

    @Transactional(readOnly = true)
    public TestDetail get(Long id) {
        LearningTest test = requireTest(id);
        return toDetail(test);
    }

    @Transactional
    public TestDetail create(TestInput input) {
        LearningTest test = new LearningTest();
        test.setCreatedBy(UserContextHolder.getCurrentUserId());
        apply(test, input);
        test.setPublished(false);
        return toDetail(testRepository.save(test));
    }

    @Transactional
    public TestDetail update(Long id, TestInput input) {
        LearningTest test = requireTest(id);
        if (attemptRepository.existsByTestId(id)) throw new IllegalArgumentException("A test cannot be edited after a learner has started it.");
        apply(test, input);
        return toDetail(test);
    }

    @Transactional
    public TestSummary publish(Long id) {
        LearningTest test = requireTest(id);
        if (test.getQuestions().isEmpty()) throw new IllegalArgumentException("Add at least one question before publishing.");
        validateQuestionSet(test.getCourse().getId(), test.getSubject().getId(), test.getQuestions());
        if (test.getAvailableFrom() != null && test.getAvailableUntil() != null && !test.getAvailableUntil().isAfter(test.getAvailableFrom())) {
            throw new IllegalArgumentException("The end time must be after the start time.");
        }
        test.setPublished(true);
        return toSummary(testRepository.save(test), null);
    }

    @Transactional
    public void delete(Long id) {
        LearningTest test = requireTest(id);
        if (attemptRepository.existsByTestId(id)) throw new IllegalArgumentException("A test with learner attempts cannot be deleted.");
        testRepository.delete(test);
    }

    @Transactional
    public AttemptStart startAttempt(Long testId) {
        UserPrincipal principal = requireStudent();
        LearningTest test = requireTest(testId);
        Optional<TestAttempt> existing = attemptRepository.findByTestIdAndStudentId(testId, principal.getId());
        if (existing.isPresent()) {
            TestAttempt attempt = existing.get();
            if (attempt.getStatus() == AttemptStatus.SUBMITTED) throw new IllegalArgumentException("This test attempt has already been submitted.");
            return toAttemptStart(attempt);
        }
        if (!Boolean.TRUE.equals(test.getPublished())) throw new ResourceNotFoundException("Published test not found.");
        ensureAvailable(test, LocalDateTime.now());
        TestAttempt attempt = TestAttempt.builder()
                .test(test).studentId(principal.getId()).status(AttemptStatus.IN_PROGRESS)
                .startedAt(LocalDateTime.now()).answers(new HashMap<>()).build();
        return toAttemptStart(attemptRepository.save(attempt));
    }

    @Transactional
    public AttemptResult saveAnswers(Long testId, Long attemptId, Map<Long, String> answers) {
        TestAttempt attempt = requireOwnedAttempt(testId, attemptId);
        if (attempt.getStatus() == AttemptStatus.SUBMITTED) return toResult(attempt);
        if (isExpired(attempt, LocalDateTime.now())) return submit(attempt);
        Set<Long> allowedQuestionIds = attempt.getTest().getQuestions().stream().map(Question::getId).collect(Collectors.toSet());
        for (Map.Entry<Long, String> entry : answers.entrySet()) {
            if (!allowedQuestionIds.contains(entry.getKey())) throw new IllegalArgumentException("An answer refers to a question outside this test.");
            if (entry.getValue() == null || entry.getValue().isBlank()) {
                attempt.getAnswers().remove(entry.getKey());
                continue;
            }
            String key = entry.getValue().trim().toUpperCase(Locale.ROOT);
            Question question = attempt.getTest().getQuestions().stream().filter(q -> q.getId().equals(entry.getKey())).findFirst().orElseThrow();
            if (question.getOptions().stream().noneMatch(o -> o.getKey().equals(key))) throw new IllegalArgumentException("Choose one of the available answer options.");
            attempt.getAnswers().put(entry.getKey(), key);
        }
        return toResult(attemptRepository.save(attempt));
    }

    @Transactional
    public AttemptResult submitAttempt(Long testId, Long attemptId) {
        TestAttempt attempt = requireOwnedAttempt(testId, attemptId);
        if (attempt.getStatus() == AttemptStatus.SUBMITTED) return toResult(attempt);
        return submit(attempt);
    }

    private void apply(LearningTest test, TestInput input) {
        catalogService.validateTaxonomy(input.courseId(), input.subjectId(), null);
        if (input.questionIds() == null || input.questionIds().isEmpty()) throw new IllegalArgumentException("Select at least one question.");
        if (new HashSet<>(input.questionIds()).size() != input.questionIds().size()) throw new IllegalArgumentException("A question can only be added once to a test.");
        List<Question> foundQuestions = questionRepository.findAllById(input.questionIds());
        if (foundQuestions.size() != input.questionIds().size()) throw new IllegalArgumentException("One or more selected questions no longer exist.");
        Map<Long, Question> questionsById = foundQuestions.stream().collect(Collectors.toMap(Question::getId, q -> q));
        List<Question> questions = input.questionIds().stream().map(questionsById::get).toList();
        validateQuestionSet(input.courseId(), input.subjectId(), questions);
        if (input.availableFrom() != null && input.availableUntil() != null && !input.availableUntil().isAfter(input.availableFrom())) {
            throw new IllegalArgumentException("The end time must be after the start time.");
        }
        test.setCourse(catalogService.requireCourse(input.courseId()));
        test.setSubject(catalogService.requireSubject(input.subjectId()));
        test.setTitle(input.title().trim());
        test.setInstructions(input.instructions() == null || input.instructions().isBlank() ? null : input.instructions().trim());
        test.setDurationMinutes(input.durationMinutes());
        test.setAvailableFrom(input.availableFrom());
        test.setAvailableUntil(input.availableUntil());
        test.setQuestions(new ArrayList<>(questions));
    }

    private void validateQuestionSet(Long courseId, Long subjectId, List<Question> questions) {
        for (Question q : questions) {
            if (!Boolean.TRUE.equals(q.getActive())) throw new IllegalArgumentException("Archived questions cannot be added to a test.");
            if (!q.getCourse().getId().equals(courseId) || !q.getSubject().getId().equals(subjectId)) {
                throw new IllegalArgumentException("All test questions must match the test course and subject.");
            }
        }
    }

    private TestAttempt requireOwnedAttempt(Long testId, Long attemptId) {
        UserPrincipal principal = requireStudent();
        TestAttempt attempt = attemptRepository.findById(attemptId)
                .filter(a -> a.getTest().getId().equals(testId) && a.getStudentId().equals(principal.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Test attempt not found."));
        return attempt;
    }

    private UserPrincipal requirePrincipal() {
        UserPrincipal principal = UserContextHolder.get();
        if (principal == null) throw new AccessDeniedException("Sign in to access tests.");
        return principal;
    }

    private UserPrincipal requireStudent() {
        UserPrincipal principal = requirePrincipal();
        if (principal.getUserType() != UserType.STUDENT && !principal.isSuperAdmin()) {
            throw new AccessDeniedException("Only student accounts can take tests.");
        }
        if (principal.isSuperAdmin()) throw new AccessDeniedException("Use a student account to take a test.");
        return principal;
    }

    private void ensureAvailable(LearningTest test, LocalDateTime now) {
        if (!Boolean.TRUE.equals(test.getPublished())) throw new ResourceNotFoundException("Published test not found.");
        if (test.getAvailableFrom() != null && now.isBefore(test.getAvailableFrom())) throw new IllegalArgumentException("This test is not available yet.");
        if (test.getAvailableUntil() != null && now.isAfter(test.getAvailableUntil())) throw new IllegalArgumentException("The test availability window has closed.");
    }

    private boolean isExpired(TestAttempt attempt, LocalDateTime now) {
        return !now.isBefore(attempt.getStartedAt().plusMinutes(attempt.getTest().getDurationMinutes()));
    }

    private AttemptResult submit(TestAttempt attempt) {
        int score = 0;
        for (Question question : attempt.getTest().getQuestions()) {
            if (question.getCorrectOption().equals(attempt.getAnswers().get(question.getId()))) score += question.getMarks();
        }
        attempt.setScore(score);
        attempt.setStatus(AttemptStatus.SUBMITTED);
        attempt.setSubmittedAt(LocalDateTime.now());
        return toResult(attemptRepository.save(attempt));
    }

    private LearningTest requireTest(Long id) {
        return testRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Test not found."));
    }

    private TestSummary toSummary(LearningTest test, Long studentId) {
        int totalMarks = test.getQuestions().stream().mapToInt(Question::getMarks).sum();
        TestAttempt attempt = studentId == null ? null : attemptRepository.findByTestIdAndStudentId(test.getId(), studentId).orElse(null);
        return new TestSummary(test.getId(), test.getCourse().getId(), test.getCourse().getName(),
                test.getSubject().getId(), test.getSubject().getName(), test.getTitle(), test.getInstructions(),
                test.getDurationMinutes(), test.getAvailableFrom(), test.getAvailableUntil(), test.getPublished(),
                test.getQuestions().size(), totalMarks, attempt == null ? null : attempt.getStatus().name(),
                attempt == null ? null : attempt.getScore());
    }

    private TestDetail toDetail(LearningTest test) {
        return new TestDetail(test.getId(), test.getCourse().getId(), test.getSubject().getId(), test.getTitle(),
                test.getInstructions(), test.getDurationMinutes(), test.getAvailableFrom(), test.getAvailableUntil(),
                test.getPublished(), test.getQuestions().stream().map(Question::getId).toList());
    }

    private AttemptStart toAttemptStart(TestAttempt attempt) {
        LearningTest test = attempt.getTest();
        List<AttemptQuestion> questions = test.getQuestions().stream().map(q -> new AttemptQuestion(q.getId(), q.getPrompt(), q.getImageUrl(),
                q.getMarks(), q.getOptions().stream().map(o -> new OptionInput(o.getKey(), o.getContent())).toList())).toList();
        return new AttemptStart(attempt.getId(), test.getId(), test.getTitle(), test.getInstructions(),
                test.getDurationMinutes(), attempt.getStartedAt(), questions, Map.copyOf(attempt.getAnswers()));
    }

    private AttemptResult toResult(TestAttempt attempt) {
        int total = attempt.getTest().getQuestions().stream().mapToInt(Question::getMarks).sum();
        return new AttemptResult(attempt.getId(), attempt.getStatus().name(), attempt.getScore(), total, attempt.getSubmittedAt());
    }
}
