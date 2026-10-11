package com.template.app.security;

import com.template.app.model.UserType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPrincipal {
    private Long id;
    private String username;
    private String email;
    private UserType userType;
    private boolean superAdmin;
}
