package com.template.app.repository;

import com.template.app.model.Group;
import com.template.app.model.UserType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {
    Optional<Group> findByCode(String code);
    Optional<Group> findByDefaultForUserTypeAndIsDefaultTrue(UserType defaultForUserType);
    boolean existsByCode(String code);
    boolean existsByName(String name);
}
