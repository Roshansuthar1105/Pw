package com.template.app.controller;

import com.template.app.dto.ApiResponse;
import com.template.app.dto.ItemRequest;
import com.template.app.dto.ItemResponse;
import com.template.app.service.ItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Item CRUD operations.
 *
 * Base URL: /api/items
 *
 * Endpoints:
 *   GET    /api/items             → List all items
 *   GET    /api/items/active      → List active items only
 *   GET    /api/items/{id}        → Get item by ID
 *   GET    /api/items/search?q=.. → Search items by name
 *   POST   /api/items             → Create a new item
 *   PUT    /api/items/{id}        → Update an item
 *   DELETE /api/items/{id}        → Delete an item
 */
@RestController
@RequestMapping("/items")
@RequiredArgsConstructor
public class ItemController {

    private final ItemService itemService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ItemResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(itemService.findAll()));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<ItemResponse>>> getActive() {
        return ResponseEntity.ok(ApiResponse.success(itemService.findAllActive()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ItemResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(itemService.findById(id)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<ItemResponse>>> search(@RequestParam String q) {
        return ResponseEntity.ok(ApiResponse.success(itemService.search(q)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ItemResponse>> create(@Valid @RequestBody ItemRequest request) {
        ItemResponse created = itemService.create(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Item created successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ItemResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody ItemRequest request) {
        ItemResponse updated = itemService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Item updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        itemService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Item deleted successfully", null));
    }
}
