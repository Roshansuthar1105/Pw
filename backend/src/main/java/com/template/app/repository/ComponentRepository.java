package com.template.app.repository;

import com.template.app.model.Component;
import com.template.app.model.ComponentLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ComponentRepository extends JpaRepository<Component, Long> {
    Optional<Component> findByCode(String code);
    boolean existsByCode(String code);
    List<Component> findByLevelAndActiveTrueOrderBySortOrderAscNameAsc(ComponentLevel level);
    List<Component> findByActiveTrueOrderBySortOrderAscNameAsc();
    List<Component> findByParentIdAndActiveTrueOrderBySortOrderAscNameAsc(Long parentId);
    List<Component> findByLevelOrderBySortOrderAscNameAsc(ComponentLevel level);
    boolean existsByParentId(Long parentId);
}
