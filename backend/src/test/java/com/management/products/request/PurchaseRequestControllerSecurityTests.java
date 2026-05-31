package com.management.products.request;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.management.products.auth.AuthUserDetailsService;
import com.management.products.auth.JwtAuthenticationFilter;
import com.management.products.auth.JwtService;
import com.management.products.config.ApiExceptionHandler;
import com.management.products.config.SecurityConfig;
import com.management.products.request.dto.CreatePurchaseRequestRequest;
import com.management.products.request.dto.PageResponse;
import com.management.products.request.dto.PurchaseRequestResponse;
import com.management.products.request.dto.PurchaseRequestSummaryResponse;
import com.management.products.request.dto.RequestDecisionRequest;
import com.management.products.request.dto.RequestHistoryResponse;
import com.management.products.request.dto.RequestActorResponse;
import com.management.products.user.ApprovalLevel;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.mockito.ArgumentCaptor;
import org.springframework.web.server.ResponseStatusException;

@WebMvcTest(controllers = PurchaseRequestController.class)
@Import({
	SecurityConfig.class,
	JwtAuthenticationFilter.class,
	JwtService.class,
	AuthUserDetailsService.class,
	ApiExceptionHandler.class
})
@TestPropertySource(properties = {
	"security.jwt.secret=change-me-to-a-strong-secret-with-at-least-32-chars",
	"security.jwt.expiration-minutes=60",
	"app.cors.allowed-origins=http://localhost:3000"
})
class PurchaseRequestControllerSecurityTests {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private PurchaseRequestService purchaseRequestService;

	@MockitoBean
	private AuthenticationManager authenticationManager;

	@MockitoBean
	private com.management.products.user.UserRepository userRepository;

	@Test
	void loginPreflightRequestReturnsCorsHeaders() throws Exception {
		mockMvc.perform(options("/auth/login")
				.header("Origin", "http://localhost:3000")
				.header("Access-Control-Request-Method", "POST")
				.header("Access-Control-Request-Headers", "content-type"))
			.andExpect(status().isOk())
			.andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"))
			.andExpect(header().string("Access-Control-Allow-Credentials", "true"));
	}

	@Test
	void createRequestWithoutAuthenticationReturns401() throws Exception {
		mockMvc.perform(post("/requests")
				.with(csrf())
				.contentType("application/json")
				.content("""
					{
					  "title": "New laptops",
					  "description": "Five laptops for engineering",
					  "amount": 15000.00,
					  "category": "EQUIPMENT"
					}
					"""))
			.andExpect(status().isUnauthorized());
	}

	@Test
	@WithMockUser(roles = "ADMIN")
	void createRequestWithAdminRoleReturns403() throws Exception {
		mockMvc.perform(post("/requests")
				.with(csrf())
				.contentType("application/json")
				.content("""
					{
					  "title": "New laptops",
					  "description": "Five laptops for engineering",
					  "amount": 15000.00,
					  "category": "EQUIPMENT"
					}
					"""))
			.andExpect(status().isForbidden());
	}

	@Test
	@WithMockUser(authorities = "request:create")
	void createRequestWithSolicitantePermissionReturns201() throws Exception {
		when(purchaseRequestService.createRequest(any(CreatePurchaseRequestRequest.class), any())).thenReturn(
			new PurchaseRequestResponse(
				1L,
				"New laptops",
				"Five laptops for engineering",
				new BigDecimal("15000.00"),
				"EQUIPMENT",
				PurchaseRequestStatus.PENDING,
				ApprovalLevel.LEVEL_3,
				new RequestActorResponse(7L, "Requester", "requester@example.com"),
				null,
				null,
				OffsetDateTime.now(),
				OffsetDateTime.now()
			)
		);

		mockMvc.perform(post("/requests")
				.with(csrf())
				.contentType("application/json")
				.content("""
					{
					  "title": "New laptops",
					  "description": "Five laptops for engineering",
					  "amount": 15000.00,
					  "category": "EQUIPMENT"
					}
					"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.data.id").value(1L))
			.andExpect(jsonPath("$.data.status").value("PENDING"))
			.andExpect(jsonPath("$.data.requiredApprovalLevel").value("LEVEL_3"));
	}

	@ParameterizedTest
	@MethodSource("invalidCreateRequestPayloads")
	@WithMockUser(authorities = "request:create")
	void createRequestWithMissingRequiredFieldReturns400(String payload) throws Exception {
		mockMvc.perform(post("/requests")
				.with(csrf())
				.contentType("application/json")
				.content(payload))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.detail").value("Validation failed"))
			.andExpect(jsonPath("$.path").value("/requests"))
			.andExpect(jsonPath("$.errors").isArray())
			.andExpect(jsonPath("$.errors.length()").value(1));

		verifyNoInteractions(purchaseRequestService);
	}

	@Test
	void listRequestsWithoutAuthenticationReturns401() throws Exception {
		mockMvc.perform(get("/requests"))
			.andExpect(status().isUnauthorized());
	}

	@Test
	@WithMockUser(roles = "ADMIN")
	void listRequestsWithAdminRoleReturns200() throws Exception {
		when(purchaseRequestService.listRequests(eq(null), any(), any())).thenReturn(
			new PageResponse<>(java.util.List.<PurchaseRequestSummaryResponse>of(), 0, 20, 0, 0, true, true)
		);

		mockMvc.perform(get("/requests"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.data.content").isArray())
			.andExpect(jsonPath("$.data.page").value(0))
			.andExpect(jsonPath("$.data.size").value(20));
	}

	@Test
	@WithMockUser(roles = "ADMIN")
	void listRequestsWithStatusAndPaginationBindsRequestParameters() throws Exception {
		when(purchaseRequestService.listRequests(eq(PurchaseRequestStatus.PENDING), any(), any())).thenReturn(
			new PageResponse<>(java.util.List.<PurchaseRequestSummaryResponse>of(), 0, 5, 1, 1, true, true)
		);

		mockMvc.perform(get("/requests")
				.param("status", "PENDING")
				.param("page", "0")
				.param("size", "5")
				.param("sort", "createdAt,desc"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.data.size").value(5))
			.andExpect(jsonPath("$.data.totalElements").value(1));

		ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
		verify(purchaseRequestService).listRequests(eq(PurchaseRequestStatus.PENDING), pageableCaptor.capture(), any());
		Pageable pageable = pageableCaptor.getValue();
		org.assertj.core.api.Assertions.assertThat(pageable.getPageNumber()).isEqualTo(0);
		org.assertj.core.api.Assertions.assertThat(pageable.getPageSize()).isEqualTo(5);
		org.assertj.core.api.Assertions.assertThat(pageable.getSort().toString()).isEqualTo("createdAt: DESC");
	}

	@Test
	@WithMockUser(roles = "SOLICITANTE")
	void getRequestByIdReturns200ForAuthenticatedUser() throws Exception {
		when(purchaseRequestService.getRequestById(eq(1L), any())).thenReturn(
			new PurchaseRequestResponse(
				1L,
				"New laptops",
				"Five laptops for engineering",
				new BigDecimal("15000.00"),
				"EQUIPMENT",
				PurchaseRequestStatus.PENDING,
				ApprovalLevel.LEVEL_3,
				new RequestActorResponse(7L, "Requester", "requester@example.com"),
				null,
				null,
				OffsetDateTime.now(),
				OffsetDateTime.now()
			)
		);

		mockMvc.perform(get("/requests/1"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.data.id").value(1L))
			.andExpect(jsonPath("$.data.title").value("New laptops"));
	}

	@Test
	@WithMockUser(roles = "SOLICITANTE")
	void getRequestByIdReturns403WhenServiceDeniesAccess() throws Exception {
		when(purchaseRequestService.getRequestById(eq(1L), any()))
			.thenThrow(new ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN, "You do not have access to this request"));

		mockMvc.perform(get("/requests/1"))
			.andExpect(status().isForbidden())
			.andExpect(jsonPath("$.detail").value("You do not have access to this request"))
			.andExpect(jsonPath("$.path").value("/requests/1"));
	}

	@Test
	void getRequestByIdWithoutAuthenticationReturns401() throws Exception {
		mockMvc.perform(get("/requests/1"))
			.andExpect(status().isUnauthorized());
	}

	@Test
	@WithMockUser(roles = "ADMIN")
	void cancelRequestReturns200ForAuthorizedUser() throws Exception {
		when(purchaseRequestService.cancelRequest(eq(1L), any())).thenReturn(
			new PurchaseRequestResponse(
				1L,
				"New laptops",
				"Five laptops for engineering",
				new BigDecimal("15000.00"),
				"EQUIPMENT",
				PurchaseRequestStatus.CANCELLED,
				ApprovalLevel.LEVEL_3,
				new RequestActorResponse(7L, "Requester", "requester@example.com"),
				new RequestActorResponse(9L, "Admin", "admin@example.com"),
				OffsetDateTime.now(),
				OffsetDateTime.now(),
				OffsetDateTime.now()
			)
		);

		mockMvc.perform(patch("/requests/1/cancel").with(csrf()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.data.status").value("CANCELLED"));
	}

	@Test
	void cancelRequestWithoutAuthenticationReturns401() throws Exception {
		mockMvc.perform(patch("/requests/1/cancel").with(csrf()))
			.andExpect(status().isUnauthorized());
	}

	@Test
	@WithMockUser(roles = "SOLICITANTE")
	void cancelRequestReturns422WithDescriptiveMessageForInvalidState() throws Exception {
		when(purchaseRequestService.cancelRequest(eq(1L), any()))
			.thenThrow(new ResponseStatusException(
				org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY,
				"Cannot cancel this request because it is already APPROVED. Only pending requests can be cancelled."
			));

		mockMvc.perform(patch("/requests/1/cancel").with(csrf()))
			.andExpect(status().isUnprocessableEntity())
			.andExpect(jsonPath("$.detail").value("Cannot cancel this request because it is already APPROVED. Only pending requests can be cancelled."))
			.andExpect(jsonPath("$.path").value("/requests/1/cancel"));
	}

	@Test
	@WithMockUser(roles = "SOLICITANTE")
	void approveRequestWithSolicitanteRoleReturns403() throws Exception {
		mockMvc.perform(patch("/requests/1/approve")
				.with(csrf())
				.contentType("application/json")
				.content("""
					{
					  "comment": "approved"
					}
					"""))
			.andExpect(status().isForbidden());
	}

	@Test
	@WithMockUser(authorities = "request:review")
	void approveRequestWithReviewerPermissionReturns200() throws Exception {
		when(purchaseRequestService.approveRequest(eq(1L), any(RequestDecisionRequest.class), any())).thenReturn(
			new PurchaseRequestResponse(
				1L,
				"New laptops",
				"Five laptops for engineering",
				new BigDecimal("15000.00"),
				"EQUIPMENT",
				PurchaseRequestStatus.APPROVED,
				ApprovalLevel.LEVEL_3,
				new RequestActorResponse(7L, "Requester", "requester@example.com"),
				new RequestActorResponse(9L, "Approver", "approver@example.com"),
				OffsetDateTime.now(),
				OffsetDateTime.now(),
				OffsetDateTime.now()
			)
		);

		mockMvc.perform(patch("/requests/1/approve")
				.with(csrf())
				.contentType("application/json")
				.content("""
					{
					  "comment": "approved"
					}
					"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.data.status").value("APPROVED"));
	}

	@Test
	void approveRequestWithoutAuthenticationReturns401() throws Exception {
		mockMvc.perform(patch("/requests/1/approve")
				.with(csrf())
				.contentType("application/json")
				.content("""
					{
					  "comment": "approved"
					}
					"""))
			.andExpect(status().isUnauthorized());
	}

	@Test
	@WithMockUser(authorities = "request:review")
	void rejectRequestWithReviewerPermissionReturns200() throws Exception {
		when(purchaseRequestService.rejectRequest(eq(1L), any(RequestDecisionRequest.class), any())).thenReturn(
			new PurchaseRequestResponse(
				1L,
				"New laptops",
				"Five laptops for engineering",
				new BigDecimal("15000.00"),
				"EQUIPMENT",
				PurchaseRequestStatus.REJECTED,
				ApprovalLevel.LEVEL_3,
				new RequestActorResponse(7L, "Requester", "requester@example.com"),
				new RequestActorResponse(9L, "Approver", "approver@example.com"),
				OffsetDateTime.now(),
				OffsetDateTime.now(),
				OffsetDateTime.now()
			)
		);

		mockMvc.perform(patch("/requests/1/reject")
				.with(csrf())
				.contentType("application/json")
				.content("""
					{
					  "comment": "rejected"
					}
					"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.data.status").value("REJECTED"));
	}

	@Test
	void rejectRequestWithoutAuthenticationReturns401() throws Exception {
		mockMvc.perform(patch("/requests/1/reject")
				.with(csrf())
				.contentType("application/json")
				.content("""
					{
					  "comment": "rejected"
					}
					"""))
			.andExpect(status().isUnauthorized());
	}

	@Test
	@WithMockUser(roles = "SOLICITANTE")
	void rejectRequestWithSolicitanteRoleReturns403() throws Exception {
		mockMvc.perform(patch("/requests/1/reject")
				.with(csrf())
				.contentType("application/json")
				.content("""
					{
					  "comment": "rejected"
					}
					"""))
			.andExpect(status().isForbidden());
	}

	@Test
	@WithMockUser(roles = "ADMIN")
	void getRequestHistoryWithAdminRoleReturns200() throws Exception {
		when(purchaseRequestService.getRequestHistory(eq(1L), any())).thenReturn(
			List.of(new RequestHistoryResponse(
				1L,
				RequestAction.CREATED,
				null,
				PurchaseRequestStatus.PENDING,
				null,
				new RequestActorResponse(7L, "Requester", "requester@example.com"),
				OffsetDateTime.now()
			))
		);

		mockMvc.perform(get("/requests/1/history"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.data[0].action").value("CREATED"));
	}

	@Test
	void getRequestHistoryWithoutAuthenticationReturns401() throws Exception {
		mockMvc.perform(get("/requests/1/history"))
			.andExpect(status().isUnauthorized());
	}

	private static Stream<String> invalidCreateRequestPayloads() {
		return Stream.of(
			"""
			{
			  "title": "",
			  "description": "Five laptops for engineering",
			  "amount": 15000.00,
			  "category": "EQUIPMENT"
			}
			""",
			"""
			{
			  "title": null,
			  "description": "Five laptops for engineering",
			  "amount": 15000.00,
			  "category": "EQUIPMENT"
			}
			""",
			"""
			{
			  "title": "New laptops",
			  "description": "",
			  "amount": 15000.00,
			  "category": "EQUIPMENT"
			}
			""",
			"""
			{
			  "title": "New laptops",
			  "description": null,
			  "amount": 15000.00,
			  "category": "EQUIPMENT"
			}
			""",
			"""
			{
			  "title": "New laptops",
			  "description": "Five laptops for engineering",
			  "category": "EQUIPMENT"
			}
			""",
			"""
			{
			  "title": "New laptops",
			  "description": "Five laptops for engineering",
			  "amount": 15000.00,
			  "category": ""
			}
			""",
			"""
			{
			  "title": "New laptops",
			  "description": "Five laptops for engineering",
			  "amount": 15000.00,
			  "category": null
			}
			"""
		);
	}
}
