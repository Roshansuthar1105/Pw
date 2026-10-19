package com.template.app.repository;

import com.template.app.model.Topic;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TopicRepository extends JpaRepository<Topic, Long> {
    List<Topic> findAllBySubjectIdAndActiveTrueOrderByNameAsc(Long subjectId);
    boolean existsBySubjectIdAndNameIgnoreCase(Long subjectId, String name);
}
