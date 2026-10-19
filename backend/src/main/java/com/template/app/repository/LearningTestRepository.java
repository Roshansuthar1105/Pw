package com.template.app.repository;

import com.template.app.model.LearningTest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LearningTestRepository extends JpaRepository<LearningTest, Long> {
    List<LearningTest> findAllByOrderByCreatedAtDesc();
    List<LearningTest> findAllByPublishedTrueOrderByAvailableFromAsc();
    boolean existsByQuestions_IdAndPublishedTrue(Long questionId);
    boolean existsByQuestions_Id(Long questionId);
}
