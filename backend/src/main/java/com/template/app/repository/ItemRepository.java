package com.template.app.repository;

import com.template.app.model.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA Repository for {@link Item}.
 *
 * Extend with custom query methods as needed.
 * All basic CRUD operations (save, findById, findAll, delete…) are inherited.
 */
@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {

    /**
     * Find all active items.
     */
    List<Item> findAllByActiveTrue();

    /**
     * Check if an item with the given name already exists.
     */
    boolean existsByNameIgnoreCase(String name);

    /**
     * Custom JPQL query example: find items whose name contains the given keyword.
     */
    @Query("SELECT i FROM Item i WHERE LOWER(i.name) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Item> searchByName(String keyword);
}
