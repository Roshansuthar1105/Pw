package com.template.app.repository;

import com.template.app.model.TestAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TestAttemptRepository extends JpaRepository<TestAttempt, Long> {
    Optional<TestAttempt> findByTestIdAndStudentId(Long testId, Long studentId);
    boolean existsByTestIdAndStudentId(Long testId, Long studentId);
    boolean existsByTestId(Long testId);
}
