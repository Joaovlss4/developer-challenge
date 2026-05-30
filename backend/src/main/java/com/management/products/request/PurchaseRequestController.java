package com.management.products.request;

import com.management.products.api.ApiSuccessResponse;
import com.management.products.auth.AuthUserDetails;
import com.management.products.request.dto.CreatePurchaseRequestRequest;
import com.management.products.request.dto.PageResponse;
import com.management.products.request.dto.PurchaseRequestResponse;
import com.management.products.request.dto.PurchaseRequestSummaryResponse;
import com.management.products.request.dto.RequestDecisionRequest;
import com.management.products.request.dto.RequestHistoryResponse;
import com.management.products.security.UserPermission;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/requests")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Purchase Requests", description = "Purchase request management endpoints")
public class PurchaseRequestController {

	private final PurchaseRequestService purchaseRequestService;

	public PurchaseRequestController(PurchaseRequestService purchaseRequestService) {
		this.purchaseRequestService = purchaseRequestService;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasAuthority(T(com.management.products.security.UserPermission).REQUEST_CREATE.authority())")
	@Operation(summary = "Create a purchase request")
	public ApiSuccessResponse<PurchaseRequestResponse> createRequest(
		@Valid @RequestBody CreatePurchaseRequestRequest request,
		@AuthenticationPrincipal AuthUserDetails currentUser
	) {
		return ApiSuccessResponse.of(purchaseRequestService.createRequest(request, currentUser));
	}

	@GetMapping
	@Operation(summary = "List purchase requests with optional status filter and pagination")
	public ApiSuccessResponse<PageResponse<PurchaseRequestSummaryResponse>> listRequests(
		@Parameter(description = "Optional request status filter")
		@RequestParam(required = false) PurchaseRequestStatus status,
		@PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
		@AuthenticationPrincipal AuthUserDetails currentUser
	) {
		return ApiSuccessResponse.of(purchaseRequestService.listRequests(status, pageable, currentUser));
	}

	@GetMapping("/{id}")
	@Operation(summary = "Get purchase request details by id")
	public ApiSuccessResponse<PurchaseRequestResponse> getRequestById(
		@PathVariable Long id,
		@AuthenticationPrincipal AuthUserDetails currentUser
	) {
		return ApiSuccessResponse.of(purchaseRequestService.getRequestById(id, currentUser));
	}

	@PatchMapping("/{id}/cancel")
	@Operation(summary = "Cancel a purchase request")
	public ApiSuccessResponse<PurchaseRequestResponse> cancelRequest(
		@PathVariable Long id,
		@AuthenticationPrincipal AuthUserDetails currentUser
	) {
		return ApiSuccessResponse.of(purchaseRequestService.cancelRequest(id, currentUser));
	}

	@PatchMapping("/{id}/approve")
	@PreAuthorize("hasAuthority(T(com.management.products.security.UserPermission).REQUEST_REVIEW.authority())")
	@Operation(summary = "Approve a purchase request")
	public ApiSuccessResponse<PurchaseRequestResponse> approveRequest(
		@PathVariable Long id,
		@Valid @RequestBody(required = false) RequestDecisionRequest request,
		@AuthenticationPrincipal AuthUserDetails currentUser
	) {
		return ApiSuccessResponse.of(purchaseRequestService.approveRequest(id, request, currentUser));
	}

	@PatchMapping("/{id}/reject")
	@PreAuthorize("hasAuthority(T(com.management.products.security.UserPermission).REQUEST_REVIEW.authority())")
	@Operation(summary = "Reject a purchase request")
	public ApiSuccessResponse<PurchaseRequestResponse> rejectRequest(
		@PathVariable Long id,
		@Valid @RequestBody(required = false) RequestDecisionRequest request,
		@AuthenticationPrincipal AuthUserDetails currentUser
	) {
		return ApiSuccessResponse.of(purchaseRequestService.rejectRequest(id, request, currentUser));
	}

	@GetMapping("/{id}/history")
	@Operation(summary = "Get purchase request history")
	public ApiSuccessResponse<List<RequestHistoryResponse>> getRequestHistory(
		@PathVariable Long id,
		@AuthenticationPrincipal AuthUserDetails currentUser
	) {
		return ApiSuccessResponse.of(purchaseRequestService.getRequestHistory(id, currentUser));
	}
}
