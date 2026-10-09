package com.template.app.service;

import com.template.app.dto.ItemRequest;
import com.template.app.dto.ItemResponse;
import com.template.app.exception.ResourceNotFoundException;
import com.template.app.model.Item;
import com.template.app.repository.ItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service layer for Item business logic.
 *
 * All database interactions go through this layer.
 * Controllers stay thin; this class owns the business rules.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ItemService {

    private final ItemRepository itemRepository;

    // ─── Read Operations ─────────────────────────────────────────────────────

    public List<ItemResponse> findAll() {
        log.debug("Fetching all items");
        return itemRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<ItemResponse> findAllActive() {
        log.debug("Fetching all active items");
        return itemRepository.findAllByActiveTrue()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ItemResponse findById(Long id) {
        log.debug("Fetching item by id: {}", id);
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item", id));
        return toResponse(item);
    }

    public List<ItemResponse> search(String keyword) {
        log.debug("Searching items with keyword: {}", keyword);
        return itemRepository.searchByName(keyword)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ─── Write Operations ────────────────────────────────────────────────────

    @Transactional
    public ItemResponse create(ItemRequest request) {
        log.info("Creating new item: {}", request.getName());

        if (itemRepository.existsByNameIgnoreCase(request.getName())) {
            throw new IllegalArgumentException(
                    "An item with name '" + request.getName() + "' already exists.");
        }

        Item item = Item.builder()
                .name(request.getName())
                .description(request.getDescription())
                .active(request.isActive())
                .build();

        Item saved = itemRepository.save(item);
        log.info("Item created with id: {}", saved.getId());
        return toResponse(saved);
    }

    @Transactional
    public ItemResponse update(Long id, ItemRequest request) {
        log.info("Updating item id: {}", id);

        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item", id));

        item.setName(request.getName());
        item.setDescription(request.getDescription());
        item.setActive(request.isActive());

        Item updated = itemRepository.save(item);
        return toResponse(updated);
    }

    @Transactional
    public void delete(Long id) {
        log.info("Deleting item id: {}", id);

        if (!itemRepository.existsById(id)) {
            throw new ResourceNotFoundException("Item", id);
        }
        itemRepository.deleteById(id);
    }

    // ─── Mapper ──────────────────────────────────────────────────────────────

    private ItemResponse toResponse(Item item) {
        return ItemResponse.builder()
                .id(item.getId())
                .name(item.getName())
                .description(item.getDescription())
                .active(item.isActive())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}
