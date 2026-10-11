package com.template.app.dto;

import com.template.app.model.ComponentLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateComponentDTO {
    @NotNull(message = "Component level is required")
    private ComponentLevel level;

    private Long parentId;

    @NotBlank(message = "Component code is required")
    @Size(max = 100)
    private String code;

    @NotBlank(message = "Component name is required")
    @Size(max = 150)
    private String name;

    private String icon;
    private String route;
    private String helpText;
    private String elementType;
    private Integer sortOrder;
}
