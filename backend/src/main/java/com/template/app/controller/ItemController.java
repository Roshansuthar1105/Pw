package com.template.app.controller;

import com.template.app.dto.ApiResponse;
import com.template.app.dto.ItemRequest;
import com.template.app.dto.ItemResponse;
import com.template.app.service.ItemService;
import com.template.app.security.RequirePermission;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Item CRUD operations guarded by component permissions.
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
    @RequirePermission("FN_ITEMS_CREATE")
    public ResponseEntity<ApiResponse<ItemResponse>> create(@Valid @RequestBody ItemRequest request) {
        ItemResponse created = itemService.create(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Item created successfully", created));
    }

    @PutMapping("/{id}")
    @RequirePermission("FN_ITEMS_EDIT")
    public ResponseEntity<ApiResponse<ItemResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody ItemRequest request) {
        ItemResponse updated = itemService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Item updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("FN_ITEMS_DELETE")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        itemService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Item deleted successfully", null));
    }
}
