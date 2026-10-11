package com.template.app.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateRoleDTO {
    @NotBlank(message = "Role name is required")
    @Size(max = 150)
    private String name;

    @NotBlank(message = "Role code is required")
    @Size(max = 100)
    private String code;

    @Size(max = 500)
    private String description;

    private List<Long> componentIds;
}
