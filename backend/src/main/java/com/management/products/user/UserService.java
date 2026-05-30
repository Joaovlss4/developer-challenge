package com.management.products.user;

import com.management.products.auth.dto.UserResponse;
import com.management.products.user.dto.CreateUserRequest;
import com.management.products.user.dto.UpdateUserRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserService {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final UserRolePolicy userRolePolicy;

	public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, UserRolePolicy userRolePolicy) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.userRolePolicy = userRolePolicy;
	}

	@Transactional
	public UserResponse createUser(CreateUserRequest request) {
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

		return UserResponse.from(saveUser(user));
	}

	@Transactional
	public UserResponse updateUser(Long id, UpdateUserRequest request) {
		User user = userRepository.findById(id)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

		if (request.name() != null) {
			user.updateName(requireNotBlank(request.name(), "name"));
		}
		if (request.email() != null) {
			updateEmail(user, request.email());
		}
		if (request.password() != null) {
			user.updatePasswordHash(passwordEncoder.encode(request.password()));
		}
		if (request.role() != null || request.approvalLevel() != null) {
			ApprovalLevel approvalLevel = userRolePolicy.resolveApprovalLevelForUpdate(
				user.getRole(),
				user.getApprovalLevel(),
				request.role(),
				request.approvalLevel()
			);
			user.updateRoleAndApprovalLevel(request.role() == null ? user.getRole() : request.role(), approvalLevel);
		}

		return UserResponse.from(user);
	}

	private void updateEmail(User user, String requestedEmail) {
		String email = normalizeEmail(requireNotBlank(requestedEmail, "email"));
		if (!user.getEmail().equals(email)) {
			validateEmailAvailability(email);
		}
		user.updateEmail(email);
	}

	private String normalizeEmail(String email) {
		return email.trim().toLowerCase();
	}

	private String requireNotBlank(String value, String field) {
		String trimmed = value.trim();
		if (trimmed.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " must not be blank");
		}
		return trimmed;
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
