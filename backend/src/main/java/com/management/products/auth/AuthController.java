package com.management.products.auth;

import com.management.products.api.ApiSuccessResponse;
import com.management.products.auth.dto.AuthResponse;
import com.management.products.auth.dto.LoginRequest;
import com.management.products.auth.dto.RegisterRequest;
import com.management.products.auth.dto.UserResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@Tag(name = "Authentication", description = "User registration, login and current user endpoints")
public class AuthController {

	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	@PostMapping("/register")
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasAuthority(T(com.management.products.security.UserPermission).USER_MANAGE.authority())")
	@SecurityRequirement(name = "bearerAuth")
	@Operation(summary = "Register a new user")
	public ApiSuccessResponse<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
		return ApiSuccessResponse.of(authService.register(request));
	}

	@PostMapping("/login")
	@Operation(summary = "Authenticate a user and return a JWT")
	public ApiSuccessResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
		return ApiSuccessResponse.of(authService.login(request));
	}

	@GetMapping("/me")
	@SecurityRequirement(name = "bearerAuth")
	@Operation(summary = "Return the authenticated user")
	public ApiSuccessResponse<UserResponse> me(@AuthenticationPrincipal AuthUserDetails userDetails) {
		return ApiSuccessResponse.of(UserResponse.from(userDetails.getUser()));
	}
}
