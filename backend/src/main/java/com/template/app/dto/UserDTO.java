package com.template.app.dto;

import com.template.app.model.UserType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {
    private Long id;
    private String username;
    private String email;
    private UserType userType;
    private Boolean isSuperAdmin;
    private Boolean active;
    private List<Long> groupIds;
    private List<String> groupNames;
    private LocalDateTime createdAt;
}
