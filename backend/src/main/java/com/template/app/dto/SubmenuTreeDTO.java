package com.template.app.dto;

import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmenuTreeDTO {
    private Long id;
    private String code;
    private String name;
    private String route;
    private String helpText;
    private Integer sortOrder;
    @Builder.Default
    private List<FunctionalityTreeDTO> functionalities = new ArrayList<>();
}
