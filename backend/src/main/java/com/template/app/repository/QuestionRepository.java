package com.template.app.repository;

import com.template.app.model.Question;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findAllByActiveTrueOrderByCreatedAtDesc();
    boolean existsByIdAndActiveTrue(Long id);
}
