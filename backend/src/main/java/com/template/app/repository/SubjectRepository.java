package com.template.app.repository;

import com.template.app.model.Subject;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SubjectRepository extends JpaRepository<Subject, Long> {
    List<Subject> findAllByCourseIdAndActiveTrueOrderByNameAsc(Long courseId);
    boolean existsByCourseIdAndNameIgnoreCase(Long courseId, String name);
}
