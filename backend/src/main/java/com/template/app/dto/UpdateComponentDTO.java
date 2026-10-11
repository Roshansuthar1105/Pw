package com.template.app.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateComponentDTO {
    @NotBlank(message = "Component name is required")
    @Size(max = 150)
    private String name;

    private String icon;
    private String route;
    private String helpText;
    private String elementType;
    private Integer sortOrder;
    private Boolean active;
}
