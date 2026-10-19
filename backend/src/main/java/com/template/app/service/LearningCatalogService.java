package com.template.app.service;

import com.template.app.dto.LearningDtos.*;
import com.template.app.exception.ResourceNotFoundException;
import com.template.app.model.Course;
import com.template.app.model.Subject;
import com.template.app.model.Topic;
import com.template.app.repository.CourseRepository;
import com.template.app.repository.SubjectRepository;
import com.template.app.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LearningCatalogService {
    private final CourseRepository courseRepository;
    private final SubjectRepository subjectRepository;
    private final TopicRepository topicRepository;

    @Transactional(readOnly = true)
    public List<CourseView> getTaxonomy() {
        return courseRepository.findAllByActiveTrueOrderByNameAsc().stream()
                .map(course -> new CourseView(
                        course.getId(), course.getName(), course.getDescription(),
                        subjectRepository.findAllByCourseIdAndActiveTrueOrderByNameAsc(course.getId()).stream()
                                .map(subject -> new SubjectView(
                                        subject.getId(), subject.getName(),
                                        topicRepository.findAllBySubjectIdAndActiveTrueOrderByNameAsc(subject.getId()).stream()
                                                .map(topic -> new TopicView(topic.getId(), topic.getName())).toList()))
                                .toList()))
                .toList();
    }

    @Transactional
    public CourseView createCourse(CourseInput input) {
        String name = clean(input.name());
        if (courseRepository.existsByNameIgnoreCase(name)) throw new IllegalArgumentException("A course with this name already exists.");
        Course course = courseRepository.save(Course.builder().name(name).description(cleanNullable(input.description())).active(true).build());
        return new CourseView(course.getId(), course.getName(), course.getDescription(), List.of());
    }

    @Transactional
    public CourseView updateCourse(Long id, CourseInput input) {
        Course course = requireCourse(id);
        String name = clean(input.name());
        boolean duplicate = courseRepository.findAll().stream().anyMatch(item -> !item.getId().equals(id) && item.getName().equalsIgnoreCase(name));
        if (duplicate) throw new IllegalArgumentException("A course with this name already exists.");
        course.setName(name);
        course.setDescription(cleanNullable(input.description()));
        return new CourseView(course.getId(), course.getName(), course.getDescription(), List.of());
    }

    @Transactional
    public void archiveCourse(Long id) { requireCourse(id).setActive(false); }

    @Transactional
    public SubjectView createSubject(SubjectInput input) {
        Course course = requireCourse(input.courseId());
        String name = clean(input.name());
        if (subjectRepository.existsByCourseIdAndNameIgnoreCase(course.getId(), name)) throw new IllegalArgumentException("A subject with this name already exists in the course.");
        Subject subject = subjectRepository.save(Subject.builder().course(course).name(name).active(true).build());
        return new SubjectView(subject.getId(), subject.getName(), List.of());
    }

    @Transactional
    public SubjectView updateSubject(Long id, SubjectInput input) {
        Subject subject = requireSubject(id);
        Course course = requireCourse(input.courseId());
        String name = clean(input.name());
        boolean duplicate = subjectRepository.findAll().stream().anyMatch(item -> !item.getId().equals(id)
                && item.getCourse().getId().equals(course.getId()) && item.getName().equalsIgnoreCase(name));
        if (duplicate) throw new IllegalArgumentException("A subject with this name already exists in the course.");
        subject.setCourse(course);
        subject.setName(name);
        return new SubjectView(subject.getId(), subject.getName(), List.of());
    }

    @Transactional
    public void archiveSubject(Long id) { requireSubject(id).setActive(false); }

    @Transactional
    public TopicView createTopic(TopicInput input) {
        Subject subject = requireSubject(input.subjectId());
        String name = clean(input.name());
        if (topicRepository.existsBySubjectIdAndNameIgnoreCase(subject.getId(), name)) throw new IllegalArgumentException("A topic with this name already exists in the subject.");
        Topic topic = topicRepository.save(Topic.builder().subject(subject).name(name).active(true).build());
        return new TopicView(topic.getId(), topic.getName());
    }

    @Transactional
    public TopicView updateTopic(Long id, TopicInput input) {
        Topic topic = requireTopic(id);
        Subject subject = requireSubject(input.subjectId());
        String name = clean(input.name());
        boolean duplicate = topicRepository.findAll().stream().anyMatch(item -> !item.getId().equals(id)
                && item.getSubject().getId().equals(subject.getId()) && item.getName().equalsIgnoreCase(name));
        if (duplicate) throw new IllegalArgumentException("A topic with this name already exists in the subject.");
        topic.setSubject(subject);
        topic.setName(name);
        return new TopicView(topic.getId(), topic.getName());
    }

    @Transactional
    public void archiveTopic(Long id) { requireTopic(id).setActive(false); }

    @Transactional(readOnly = true)
    public Course requireCourse(Long id) {
        return courseRepository.findById(id).filter(c -> Boolean.TRUE.equals(c.getActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Course not found."));
    }

    @Transactional(readOnly = true)
    public Subject requireSubject(Long id) {
        return subjectRepository.findById(id).filter(s -> Boolean.TRUE.equals(s.getActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found."));
    }

    @Transactional(readOnly = true)
    public Topic requireTopic(Long id) {
        return topicRepository.findById(id).filter(t -> Boolean.TRUE.equals(t.getActive()))
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found."));
    }

    public void validateTaxonomy(Long courseId, Long subjectId, Long topicId) {
        Subject subject = requireSubject(subjectId);
        if (!subject.getCourse().getId().equals(courseId)) throw new IllegalArgumentException("The subject must belong to the selected course.");
        requireCourse(courseId);
        if (topicId != null) {
            Topic topic = requireTopic(topicId);
            if (!topic.getSubject().getId().equals(subjectId)) throw new IllegalArgumentException("The topic must belong to the selected subject.");
        }
    }

    private String clean(String value) {
        if (value == null || value.trim().isEmpty()) throw new IllegalArgumentException("A name is required.");
        return value.trim();
    }

    private String cleanNullable(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
