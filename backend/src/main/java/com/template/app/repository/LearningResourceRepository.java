package com.template.app.repository;

import com.template.app.model.LearningResource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LearningResourceRepository extends JpaRepository<LearningResource, Long> {
    List<LearningResource> findAllByPublishedTrueOrderByCreatedAtDesc();
    List<LearningResource> findAllByOrderByCreatedAtDesc();
}
