package com.management.products.user.dto;

import com.management.products.user.ApprovalLevel;
import com.management.products.user.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
	@NotBlank
	@Size(max = 120)
	String name,

	@NotBlank
	@Email
	@Size(max = 160)
	String email,

	@NotBlank
	@Size(min = 8, max = 72)
	String password,

	@NotNull
	UserRole role,

	ApprovalLevel approvalLevel
) {
}
