package com.template.app.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponseDTO {
    private String token;
    private UserDTO user;
    private ResolvedPermissionsDTO permissions;
}
