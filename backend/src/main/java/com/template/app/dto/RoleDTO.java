package com.template.app.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoleDTO {
    private Long id;
    private String name;
    private String code;
    private String description;
    private Boolean isSystem;
    private List<Long> componentIds;
    private Integer componentCount;
}
