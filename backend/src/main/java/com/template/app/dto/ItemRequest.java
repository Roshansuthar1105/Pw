package com.template.app.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating or updating an Item.
 * Keeps API contract separate from the JPA entity.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemRequest {

    @NotBlank(message = "Name must not be blank")
    @Size(min = 1, max = 255)
    private String name;

    @Size(max = 1000)
    private String description;

    @Builder.Default
    private boolean active = true;
}
