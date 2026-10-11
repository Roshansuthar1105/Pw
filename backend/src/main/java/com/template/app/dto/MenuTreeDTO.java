package com.template.app.dto;

import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuTreeDTO {
    private Long id;
    private String code;
    private String name;
    private String icon;
    private Integer sortOrder;
    @Builder.Default
    private List<SubmenuTreeDTO> submenus = new ArrayList<>();
}
