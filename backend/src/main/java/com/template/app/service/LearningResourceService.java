package com.template.app.service;

import com.template.app.dto.LearningDtos.*;
import com.template.app.exception.ResourceNotFoundException;
import com.template.app.model.*;
import com.template.app.repository.LearningResourceRepository;
import com.template.app.security.UserContextHolder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class LearningResourceService {
    private final LearningResourceRepository resourceRepository;
    private final LearningCatalogService catalogService;

    @Transactional(readOnly = true)
    public List<ResourceView> list(String type, Long courseId, Long subjectId, String query) {
        boolean student = UserContextHolder.get() != null && UserContextHolder.get().getUserType() == UserType.STUDENT;
        String normalizedType = type == null || type.isBlank() ? null : type.trim().toUpperCase(Locale.ROOT);
        String search = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        List<LearningResource> resources = student
                ? resourceRepository.findAllByPublishedTrueOrderByCreatedAtDesc()
                : resourceRepository.findAllByOrderByCreatedAtDesc();
        return resources.stream()
                .filter(r -> normalizedType == null || r.getType().name().equals(normalizedType))
                .filter(r -> courseId == null || r.getCourse().getId().equals(courseId))
                .filter(r -> subjectId == null || r.getSubject().getId().equals(subjectId))
                .filter(r -> search.isEmpty() || r.getTitle().toLowerCase(Locale.ROOT).contains(search)
                        || (r.getDescription() != null && r.getDescription().toLowerCase(Locale.ROOT).contains(search)))
                .map(this::toView).toList();
    }

    @Transactional
    public ResourceView create(ResourceInput input) {
        LearningResource resource = new LearningResource();
        apply(resource, input);
        resource.setCreatedBy(UserContextHolder.getCurrentUserId());
        return toView(resourceRepository.save(resource));
    }

    @Transactional
    public ResourceView update(Long id, ResourceInput input) {
        LearningResource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Learning resource not found."));
        apply(resource, input);
        return toView(resource);
    }

    @Transactional
    public void delete(Long id) {
        LearningResource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Learning resource not found."));
        resourceRepository.delete(resource);
    }

    private void apply(LearningResource resource, ResourceInput input) {
        catalogService.validateTaxonomy(input.courseId(), input.subjectId(), input.topicId());
        ResourceType type;
        try { type = ResourceType.valueOf(input.type().trim().toUpperCase(Locale.ROOT)); }
        catch (Exception ex) { throw new IllegalArgumentException("Resource type must be Notes or Video."); }
        String url = validateUrl(input.url(), type);
        resource.setCourse(catalogService.requireCourse(input.courseId()));
        resource.setSubject(catalogService.requireSubject(input.subjectId()));
        resource.setTopic(input.topicId() == null ? null : catalogService.requireTopic(input.topicId()));
        resource.setType(type);
        resource.setTitle(input.title().trim());
        resource.setDescription(input.description() == null || input.description().isBlank() ? null : input.description().trim());
        resource.setUrl(url);
        resource.setPublished(input.published() == null || input.published());
    }

    private String validateUrl(String raw, ResourceType type) {
        try {
            URI uri = URI.create(raw.trim());
            if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null) throw new IllegalArgumentException();
            if (type == ResourceType.VIDEO) {
                String host = uri.getHost().toLowerCase(Locale.ROOT);
                if (!host.equals("youtube.com") && !host.endsWith(".youtube.com") && !host.equals("youtu.be")) {
                    throw new IllegalArgumentException();
                }
            }
            return uri.toString();
        } catch (Exception ex) {
            throw new IllegalArgumentException(type == ResourceType.VIDEO
                    ? "Add a valid HTTPS YouTube URL." : "Add a valid HTTPS notes URL.");
        }
    }

    private ResourceView toView(LearningResource r) {
        return new ResourceView(r.getId(), r.getCourse().getId(), r.getCourse().getName(),
                r.getSubject().getId(), r.getSubject().getName(),
                r.getTopic() == null ? null : r.getTopic().getId(), r.getTopic() == null ? null : r.getTopic().getName(),
                r.getType().name(), r.getTitle(), r.getDescription(), r.getUrl(), r.getPublished(), r.getCreatedAt());
    }
}
