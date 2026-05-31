package com.management.products.user;

import com.management.products.api.ApiSuccessResponse;
import com.management.products.auth.dto.UserResponse;
import com.management.products.user.dto.UpdateUserRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
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

	@GetMapping
	@Operation(summary = "List all users")
	public ApiSuccessResponse<List<UserResponse>> listUsers() {
		return ApiSuccessResponse.of(userService.listUsers());
	}

	@PatchMapping("/{id}")
	@Operation(summary = "Update a user")
	public ApiSuccessResponse<UserResponse> updateUser(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest request) {
		return ApiSuccessResponse.of(userService.updateUser(id, request));
	}
}
