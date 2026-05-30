package com.management.products.user.dto;

import com.management.products.user.ApprovalLevel;
import com.management.products.user.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
	@Size(max = 120)
	String name,

	@Email
	@Size(max = 160)
	String email,

	@Size(min = 8, max = 72)
	String password,

	UserRole role,

	ApprovalLevel approvalLevel
) {
}
