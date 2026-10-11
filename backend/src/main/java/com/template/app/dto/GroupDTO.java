package com.template.app.dto;

import com.template.app.model.UserType;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupDTO {
    private Long id;
    private String name;
    private String code;
    private String description;
    private Boolean isSystem;
    private Boolean isDefault;
    private UserType defaultForUserType;
    private List<Long> roleIds;
    private List<String> roleNames;
    private Integer userCount;
}
