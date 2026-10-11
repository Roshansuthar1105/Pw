package com.template.app.repository;

import com.template.app.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u JOIN u.groups g WHERE g.id = :groupId ORDER BY u.username ASC")
    List<User> findByGroupId(@Param("groupId") Long groupId);

    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.groups WHERE u.id = :id")
    Optional<User> findByIdWithGroups(@Param("id") Long id);

    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.groups WHERE u.username = :username")
    Optional<User> findByUsernameWithGroups(@Param("username") String username);
}
