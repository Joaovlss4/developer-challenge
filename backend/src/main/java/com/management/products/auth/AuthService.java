package com.management.products.auth;

import com.management.products.auth.dto.AuthResponse;
import com.management.products.auth.dto.LoginRequest;
import com.management.products.auth.dto.RegisterRequest;
import com.management.products.auth.dto.UserResponse;
import com.management.products.user.ApprovalLevel;
import com.management.products.user.User;
import com.management.products.user.UserRepository;
import com.management.products.user.UserRole;
import com.management.products.user.UserRolePolicy;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final AuthenticationManager authenticationManager;
	private final JwtService jwtService;
	private final UserRolePolicy userRolePolicy;

	public AuthService(
		UserRepository userRepository,
		PasswordEncoder passwordEncoder,
		AuthenticationManager authenticationManager,
		JwtService jwtService,
		UserRolePolicy userRolePolicy
	) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.authenticationManager = authenticationManager;
		this.jwtService = jwtService;
		this.userRolePolicy = userRolePolicy;
	}

	@Transactional
	public UserResponse register(RegisterRequest request) {
		String email = normalizeEmail(request.email());
		validateEmailAvailability(email);

		ApprovalLevel approvalLevel = userRolePolicy.resolveApprovalLevel(request.role(), request.approvalLevel());
		User user = new User(
			request.name().trim(),
			email,
			passwordEncoder.encode(request.password()),
			request.role(),
			approvalLevel
		);

			User savedUser = saveUser(user);
			return UserResponse.from(savedUser);
	}

	@Transactional(readOnly = true)
	public AuthResponse login(LoginRequest request) {
		String email = normalizeEmail(request.email());
		try {
			authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.password()));
		} catch (BadCredentialsException exception) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
		}

		User user = userRepository.findByEmail(email)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
		AuthUserDetails userDetails = new AuthUserDetails(user);
		return AuthResponse.bearer(jwtService.generateToken(userDetails), UserResponse.from(user));
	}

	private String normalizeEmail(String email) {
		return email.trim().toLowerCase();
	}

	private void validateEmailAvailability(String email) {
		if (userRepository.existsByEmail(email)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "E-mail already registered");
		}
	}

	private User saveUser(User user) {
		try {
			return userRepository.save(user);
		} catch (DataIntegrityViolationException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "E-mail already registered", exception);
		}
	}
}
