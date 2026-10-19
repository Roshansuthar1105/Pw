package com.template.app.repository;

import com.template.app.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findAllByActiveTrueOrderByNameAsc();
    boolean existsByNameIgnoreCase(String name);
}
