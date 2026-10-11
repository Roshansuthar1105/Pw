package com.template.app.dto;

import com.template.app.model.ComponentLevel;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComponentDTO {
    private Long id;
    private ComponentLevel level;
    private Long parentId;
    private String parentName;
    private String code;
    private String name;
    private String icon;
    private String route;
    private String helpText;
    private String elementType;
    private Integer sortOrder;
    private Boolean active;
}
