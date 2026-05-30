package com.management.products.user;

import com.management.products.api.ApiSuccessResponse;
import com.management.products.auth.dto.UserResponse;
import com.management.products.user.dto.UpdateUserRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users")
@Tag(name = "Users", description = "Administrative user management")
public class UserController {

	private final UserService userService;

	public UserController(UserService userService) {
		this.userService = userService;
	}

	@PatchMapping("/{id}")
	@PreAuthorize("hasAuthority(T(com.management.products.security.UserPermission).USER_MANAGE.authority())")
	@SecurityRequirement(name = "bearerAuth")
	@Operation(summary = "Update a user")
	public ApiSuccessResponse<UserResponse> updateUser(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest request) {
		return ApiSuccessResponse.of(userService.updateUser(id, request));
	}
}
