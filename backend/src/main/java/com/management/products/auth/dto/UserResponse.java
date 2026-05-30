package com.management.products.auth.dto;

import com.management.products.user.ApprovalLevel;
import com.management.products.user.User;
import com.management.products.user.UserRole;

public record UserResponse(
	Long id,
	String name,
	String email,
	UserRole role,
	ApprovalLevel approvalLevel
) {
	public static UserResponse from(User user) {
		return new UserResponse(
			user.getId(),
			user.getName(),
			user.getEmail(),
			user.getRole(),
			user.getApprovalLevel()
		);
	}
}
