package com.template.app.dto;

import lombok.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResolvedPermissionsDTO {
    @Builder.Default
    private Set<String> flatCodes = new HashSet<>();

    @Builder.Default
    private List<MenuTreeDTO> tree = new ArrayList<>();
}
