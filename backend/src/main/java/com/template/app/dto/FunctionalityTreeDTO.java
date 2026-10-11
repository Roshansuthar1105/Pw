package com.template.app.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FunctionalityTreeDTO {
    private Long id;
    private String code;
    private String name;
    private String elementType;
    private Integer sortOrder;
}
