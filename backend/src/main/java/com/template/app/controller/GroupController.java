package com.template.app.controller;

import com.template.app.dto.ApiResponse;
import com.template.app.dto.CreateGroupDTO;
import com.template.app.dto.GroupDTO;
import com.template.app.dto.UpdateGroupDTO;
import com.template.app.dto.UserDTO;
import com.template.app.security.RequirePermission;
import com.template.app.service.GroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<GroupDTO>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(groupService.getAllGroups()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<GroupDTO>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(groupService.getGroupById(id)));
    }

    @GetMapping("/{id}/users")
    public ResponseEntity<ApiResponse<List<UserDTO>>> getUsersInGroup(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(groupService.getUsersByGroup(id)));
    }

    @PostMapping
    @RequirePermission("FN_GROUPS_MANAGE")
    public ResponseEntity<ApiResponse<GroupDTO>> create(@Valid @RequestBody CreateGroupDTO dto) {
        GroupDTO created = groupService.createGroup(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Group created successfully", created));
    }

    @PutMapping("/{id}")
    @RequirePermission("FN_GROUPS_MANAGE")
    public ResponseEntity<ApiResponse<GroupDTO>> update(@PathVariable Long id, @Valid @RequestBody UpdateGroupDTO dto) {
        GroupDTO updated = groupService.updateGroup(id, dto);
        return ResponseEntity.ok(ApiResponse.ok("Group updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("FN_GROUPS_MANAGE")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        groupService.deleteGroup(id);
        return ResponseEntity.ok(ApiResponse.ok("Group deleted successfully", null));
    }
}
