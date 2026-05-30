package com.management.products;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.management.products.auth.AuthController;
import com.management.products.auth.AuthService;
import com.management.products.auth.AuthUserDetails;
import com.management.products.auth.AuthUserDetailsService;
import com.management.products.auth.JwtAuthenticationFilter;
import com.management.products.auth.JwtService;
import com.management.products.config.ApiExceptionHandler;
import com.management.products.config.SecurityConfig;
import com.management.products.security.SecurityAuthorities;
import com.management.products.security.UserPermission;
import com.management.products.user.ApprovalLevel;
import com.management.products.user.User;
import com.management.products.user.UserController;
import com.management.products.user.UserRepository;
import com.management.products.user.UserRolePolicy;
import com.management.products.user.UserService;
import java.lang.reflect.Field;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = {AuthController.class, UserController.class})
@Import({
	ApiExceptionHandler.class,
	SecurityConfig.class,
	JwtAuthenticationFilter.class,
	JwtService.class,
	AuthUserDetailsService.class,
	AuthService.class,
	UserRolePolicy.class,
	UserService.class
})
@TestPropertySource(properties = {
	"security.jwt.secret=change-me-to-a-strong-secret-with-at-least-32-chars",
	"security.jwt.expiration-minutes=60"
})
class SecurityAndRoleValidationTests {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private UserRepository userRepository;

	@MockitoBean
	private AuthenticationManager authenticationManager;

	@Test
	void usersCreateWithoutAuthenticationReturns401() throws Exception {
		mockMvc.perform(post("/users")
				.with(csrf())
				.contentType("application/json")
				.content("""
					{
					  "name": "Admin User",
					  "email": "admin@example.com",
					  "password": "StrongPass123!",
					  "role": "ADMIN"
					}
					"""))
			.andExpect(status().isUnauthorized());
	}

	@Test
	@WithMockUser(roles = "SOLICITANTE")
	void usersCreateWithNonAdminReturns403() throws Exception {
		mockMvc.perform(post("/users")
				.with(csrf())
				.contentType("application/json")
				.content("""
					{
					  "name": "Approver User",
					  "email": "approver@example.com",
					  "password": "StrongPass123!",
					  "role": "APROVADOR",
					  "approvalLevel": "LEVEL_1"
					}
					"""))
			.andExpect(status().isForbidden());
	}

	@Test
	void publicRegisterCreatesOnlySolicitante() throws Exception {
		when(userRepository.existsByEmail("new.user@example.com")).thenReturn(false);
		when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
			User user = invocation.getArgument(0);
			setUserId(user, 10L);
			return user;
		});

		mockMvc.perform(post("/auth/register")
				.with(csrf())
				.contentType("application/json")
				.content("""
					{
					  "name": "New User",
					  "email": "new.user@example.com",
					  "password": "StrongPass123!",
					  "role": "ADMIN",
					  "approvalLevel": "LEVEL_3"
					}
					"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.user.role").value("SOLICITANTE"))
			.andExpect(jsonPath("$.user.approvalLevel").value("LEVEL_0"));

		verify(userRepository).existsByEmail("new.user@example.com");
	}

	@Test
	@WithMockUser(authorities = "user:manage")
	void usersCreateRejectsInvalidRoleApprovalLevelCombination() throws Exception {
		when(userRepository.existsByEmail("invalid.combo@example.com")).thenReturn(false);

		mockMvc.perform(post("/users")
				.with(csrf())
				.contentType("application/json")
				.content("""
					{
					  "name": "Invalid Combo",
					  "email": "invalid.combo@example.com",
					  "password": "StrongPass123!",
					  "role": "SOLICITANTE",
					  "approvalLevel": "LEVEL_2"
					}
					"""))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.detail").value("SOLICITANTE users can only use LEVEL_0"));

		verify(userRepository, never()).save(any(User.class));
	}

	@Test
	void adminUserDetailsExposeRbacAuthorities() {
		User admin = new User(
			"Admin User",
			"admin@example.com",
			"encoded-password",
			com.management.products.user.UserRole.ADMIN,
			ApprovalLevel.LEVEL_3
		);

		AuthUserDetails userDetails = new AuthUserDetails(admin);

		assertThat(userDetails.getAuthorities())
			.extracting(authority -> authority.getAuthority())
			.contains(
				SecurityAuthorities.ROLE_ADMIN,
				UserPermission.USER_MANAGE.authority(),
				UserPermission.REQUEST_APPROVE_LEVEL_3.authority()
			);
	}

	private void setUserId(User user, Long id) throws Exception {
		Field idField = User.class.getDeclaredField("id");
		idField.setAccessible(true);
		idField.set(user, id);
	}
}
