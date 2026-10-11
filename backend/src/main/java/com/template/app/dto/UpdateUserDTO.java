package com.template.app.dto;

import com.template.app.model.UserType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateUserDTO {
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    private String password;

    @NotNull(message = "User type is required")
    private UserType userType;

    private Boolean isSuperAdmin;
    private Boolean active;
    private List<Long> groupIds;
}
