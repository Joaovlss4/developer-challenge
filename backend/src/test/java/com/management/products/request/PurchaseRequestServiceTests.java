package com.management.products.request;

import static com.management.products.request.PurchaseRequestTestFactory.admin;
import static com.management.products.request.PurchaseRequestTestFactory.approverLevel1;
import static com.management.products.request.PurchaseRequestTestFactory.approverLevel2;
import static com.management.products.request.PurchaseRequestTestFactory.auth;
import static com.management.products.request.PurchaseRequestTestFactory.createRequest;
import static com.management.products.request.PurchaseRequestTestFactory.history;
import static com.management.products.request.PurchaseRequestTestFactory.purchaseRequest;
import static com.management.products.request.PurchaseRequestTestFactory.requester;
import static com.management.products.request.PurchaseRequestTestFactory.setId;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.management.products.request.dto.CreatePurchaseRequestRequest;
import com.management.products.request.dto.RequestDecisionRequest;
import com.management.products.user.ApprovalLevel;
import com.management.products.user.User;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class PurchaseRequestServiceTests {

	@Mock
	private PurchaseRequestRepository purchaseRequestRepository;

	@Mock
	private RequestHistoryRepository requestHistoryRepository;

	@InjectMocks
	private PurchaseRequestService purchaseRequestService;

	@ParameterizedTest
	@MethodSource("approvalLevelScenarios")
	void createRequestDeterminesApprovalLevel(BigDecimal amount, ApprovalLevel expectedLevel) {
		User requester = requester(1L);

		when(purchaseRequestRepository.save(any(PurchaseRequest.class))).thenAnswer(invocation -> {
			PurchaseRequest saved = invocation.getArgument(0);
			setId(saved, 99L);
			return saved;
		});

		var response = purchaseRequestService.createRequest(createRequest(amount), auth(requester));

		assertThat(response.requiredApprovalLevel()).isEqualTo(expectedLevel);
		assertThat(response.status()).isEqualTo(PurchaseRequestStatus.PENDING);
		verify(requestHistoryRepository).save(any(RequestHistory.class));
	}

	@Test
	void createRequestPersistsAllFilledFields() {
		User requester = requester(1L);
		CreatePurchaseRequestRequest request = new CreatePurchaseRequestRequest(
			"Notebook replacement",
			"Replace engineering notebook",
			new BigDecimal("999.99"),
			"IT"
		);

		when(purchaseRequestRepository.save(any(PurchaseRequest.class))).thenAnswer(invocation -> {
			PurchaseRequest saved = invocation.getArgument(0);
			setId(saved, 99L);
			return saved;
		});

		var response = purchaseRequestService.createRequest(request, auth(requester));

		assertThat(response.title()).isEqualTo("Notebook replacement");
		assertThat(response.description()).isEqualTo("Replace engineering notebook");
		assertThat(response.amount()).isEqualByComparingTo("999.99");
		assertThat(response.category()).isEqualTo("IT");
	}

	@Test
	void getRequestByIdAllowsRequesterOwner() {
		User requester = requester(10L);
		PurchaseRequest request = purchaseRequest(20L, requester, PurchaseRequestStatus.PENDING, ApprovalLevel.LEVEL_1);

		when(purchaseRequestRepository.findWithUsersById(20L)).thenReturn(Optional.of(request));

		var response = purchaseRequestService.getRequestById(20L, auth(requester));

		assertThat(response.id()).isEqualTo(20L);
		assertThat(response.requester().id()).isEqualTo(10L);
	}

	@Test
	void getRequestByIdRejectsDifferentRequester() {
		User owner = requester(10L);
		User otherRequester = requester(11L);
		PurchaseRequest request = purchaseRequest(20L, owner, PurchaseRequestStatus.PENDING, ApprovalLevel.LEVEL_1);

		when(purchaseRequestRepository.findWithUsersById(20L)).thenReturn(Optional.of(request));

		assertThatThrownBy(() -> purchaseRequestService.getRequestById(20L, auth(otherRequester)))
			.isInstanceOf(ResponseStatusException.class)
			.satisfies(exception -> assertStatus(exception, HttpStatus.FORBIDDEN));
	}

	@Test
	void getRequestByIdReturns404WhenRequestDoesNotExist() {
		when(purchaseRequestRepository.findWithUsersById(99L)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> purchaseRequestService.getRequestById(99L, auth(requester(10L))))
			.isInstanceOf(ResponseStatusException.class)
			.satisfies(exception -> {
				assertStatus(exception, HttpStatus.NOT_FOUND);
				assertReason(exception, "Purchase request not found");
			});
	}

	@Test
	void listRequestsFiltersOwnRequestsByStatusAndKeepsPageMetadata() {
		User requester = requester(10L);
		PageRequest pageable = PageRequest.of(1, 2);
		PurchaseRequest request = purchaseRequest(20L, requester, PurchaseRequestStatus.PENDING, ApprovalLevel.LEVEL_1);

		when(purchaseRequestRepository.findAllByRequesterIdAndStatus(10L, PurchaseRequestStatus.PENDING, pageable))
			.thenReturn(new PageImpl<>(List.of(request), pageable, 3));

		var response = purchaseRequestService.listRequests(PurchaseRequestStatus.PENDING, pageable, auth(requester));

		assertThat(response.content()).hasSize(1);
		assertThat(response.page()).isEqualTo(1);
		assertThat(response.size()).isEqualTo(2);
		assertThat(response.totalElements()).isEqualTo(3);
		assertThat(response.content().getFirst().requester().id()).isEqualTo(10L);
		verify(purchaseRequestRepository).findAllByRequesterIdAndStatus(10L, PurchaseRequestStatus.PENDING, pageable);
	}

	@Test
	void listRequestsUsesGlobalQueryForAdmin() {
		User admin = admin(99L);
		PageRequest pageable = PageRequest.of(0, 20);

		when(purchaseRequestRepository.findAll(eq(pageable))).thenReturn(new PageImpl<>(List.of()));

		var response = purchaseRequestService.listRequests(null, pageable, auth(admin));

		assertThat(response.totalElements()).isZero();
		verify(purchaseRequestRepository).findAll(eq(pageable));
	}

	@Test
	void cancelRequestAllowsRequesterOwnerWhenPending() {
		User requester = requester(10L);
		PurchaseRequest request = purchaseRequest(20L, requester, PurchaseRequestStatus.PENDING, ApprovalLevel.LEVEL_1);

		when(purchaseRequestRepository.findWithUsersById(20L)).thenReturn(Optional.of(request));

		var response = purchaseRequestService.cancelRequest(20L, null, auth(requester));

		assertThat(response.status()).isEqualTo(PurchaseRequestStatus.CANCELLED);
		assertThat(response.resolvedBy()).isNotNull();
		assertSavedHistory(RequestAction.CANCELLED, PurchaseRequestStatus.PENDING, PurchaseRequestStatus.CANCELLED, null);
	}

	@Test
	void cancelRequestStoresCommentWhenProvided() {
		User requester = requester(10L);
		PurchaseRequest request = purchaseRequest(20L, requester, PurchaseRequestStatus.PENDING, ApprovalLevel.LEVEL_1);

		when(purchaseRequestRepository.findWithUsersById(20L)).thenReturn(Optional.of(request));

		var response = purchaseRequestService.cancelRequest(20L, new RequestDecisionRequest("No longer needed"), auth(requester));

		assertThat(response.status()).isEqualTo(PurchaseRequestStatus.CANCELLED);
		assertSavedHistory(
			RequestAction.CANCELLED,
			PurchaseRequestStatus.PENDING,
			PurchaseRequestStatus.CANCELLED,
			"No longer needed"
		);
	}

	@Test
	void cancelRequestNormalizesBlankCommentToNull() {
		User requester = requester(10L);
		PurchaseRequest request = purchaseRequest(20L, requester, PurchaseRequestStatus.PENDING, ApprovalLevel.LEVEL_1);

		when(purchaseRequestRepository.findWithUsersById(20L)).thenReturn(Optional.of(request));

		var response = purchaseRequestService.cancelRequest(20L, new RequestDecisionRequest("   "), auth(requester));

		assertThat(response.status()).isEqualTo(PurchaseRequestStatus.CANCELLED);
		assertSavedHistory(RequestAction.CANCELLED, PurchaseRequestStatus.PENDING, PurchaseRequestStatus.CANCELLED, null);
	}

	@Test
	void cancelRequestRejectsNonPendingStatusWithClearMessage() {
		User requester = requester(10L);
		PurchaseRequest request = purchaseRequest(20L, requester, PurchaseRequestStatus.APPROVED, ApprovalLevel.LEVEL_1);

		when(purchaseRequestRepository.findWithUsersById(20L)).thenReturn(Optional.of(request));

		assertThatThrownBy(() -> purchaseRequestService.cancelRequest(20L, null, auth(requester)))
			.isInstanceOf(ResponseStatusException.class)
			.satisfies(exception -> {
				assertStatus(exception, HttpStatus.UNPROCESSABLE_ENTITY);
				assertReason(
					exception,
					"Cannot cancel this request because it is already APPROVED. Only pending requests can be cancelled."
				);
			});
	}

	@Test
	void cancelRequestRejectsDifferentRequester() {
		User owner = requester(10L);
		User otherRequester = requester(11L);
		PurchaseRequest request = purchaseRequest(20L, owner, PurchaseRequestStatus.PENDING, ApprovalLevel.LEVEL_1);

		when(purchaseRequestRepository.findWithUsersById(20L)).thenReturn(Optional.of(request));

		assertThatThrownBy(() -> purchaseRequestService.cancelRequest(20L, null, auth(otherRequester)))
			.isInstanceOf(ResponseStatusException.class)
			.satisfies(exception -> assertStatus(exception, HttpStatus.FORBIDDEN));
	}

	@Test
	void cancelRequestRejectsApproverBecauseUserIsNotAllowed() {
		User owner = requester(10L);
		User approver = approverLevel1(30L);
		PurchaseRequest request = purchaseRequest(20L, owner, PurchaseRequestStatus.APPROVED, ApprovalLevel.LEVEL_1);

		when(purchaseRequestRepository.findWithUsersById(20L)).thenReturn(Optional.of(request));

		assertThatThrownBy(() -> purchaseRequestService.cancelRequest(20L, null, auth(approver)))
			.isInstanceOf(ResponseStatusException.class)
			.satisfies(exception -> assertStatus(exception, HttpStatus.FORBIDDEN));
	}

	@Test
	void cancelRequestReturns404WhenRequestDoesNotExist() {
		when(purchaseRequestRepository.findWithUsersById(99L)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> purchaseRequestService.cancelRequest(99L, null, auth(requester(10L))))
			.isInstanceOf(ResponseStatusException.class)
			.satisfies(exception -> {
				assertStatus(exception, HttpStatus.NOT_FOUND);
				assertReason(exception, "Purchase request not found");
			});
	}

	@Test
	void approveRequestAllowsLevel1ApproverForLevel1RequestWithComment() {
		User approver = approverLevel1(30L);
		User requester = requester(10L);
		PurchaseRequest request = purchaseRequest(20L, requester, PurchaseRequestStatus.PENDING, ApprovalLevel.LEVEL_1);

		when(purchaseRequestRepository.findWithUsersById(20L)).thenReturn(Optional.of(request));

		var response = purchaseRequestService.approveRequest(20L, new RequestDecisionRequest("Looks good"), auth(approver));

		assertThat(response.status()).isEqualTo(PurchaseRequestStatus.APPROVED);
		assertSavedHistory(RequestAction.APPROVED, PurchaseRequestStatus.PENDING, PurchaseRequestStatus.APPROVED, "Looks good");
	}

	@Test
	void approveRequestAllowsLevel1ApproverForLevel1RequestWithoutComment() {
		User approver = approverLevel1(30L);
		User requester = requester(10L);
		PurchaseRequest request = purchaseRequest(20L, requester, PurchaseRequestStatus.PENDING, ApprovalLevel.LEVEL_1);

		when(purchaseRequestRepository.findWithUsersById(20L)).thenReturn(Optional.of(request));

		var response = purchaseRequestService.approveRequest(20L, null, auth(approver));

		assertThat(response.status()).isEqualTo(PurchaseRequestStatus.APPROVED);
		assertSavedHistory(RequestAction.APPROVED, PurchaseRequestStatus.PENDING, PurchaseRequestStatus.APPROVED, null);
	}

	@Test
	void approveRequestNormalizesBlankCommentToNull() {
		User approver = approverLevel1(30L);
		User requester = requester(10L);
		PurchaseRequest request = purchaseRequest(20L, requester, PurchaseRequestStatus.PENDING, ApprovalLevel.LEVEL_1);

		when(purchaseRequestRepository.findWithUsersById(20L)).thenReturn(Optional.of(request));

		var response = purchaseRequestService.approveRequest(20L, new RequestDecisionRequest("   "), auth(approver));

		assertThat(response.status()).isEqualTo(PurchaseRequestStatus.APPROVED);
		assertSavedHistory(RequestAction.APPROVED, PurchaseRequestStatus.PENDING, PurchaseRequestStatus.APPROVED, null);
	}

	@Test
	void approveRequestRejectsLevel1ApproverForLevel2Request() {
		User approver = approverLevel1(30L);
		User requester = requester(10L);
		PurchaseRequest request = purchaseRequest(20L, requester, PurchaseRequestStatus.PENDING, ApprovalLevel.LEVEL_2);

		when(purchaseRequestRepository.findWithUsersById(20L)).thenReturn(Optional.of(request));

		assertThatThrownBy(() -> purchaseRequestService.approveRequest(20L, null, auth(approver)))
			.isInstanceOf(ResponseStatusException.class)
			.satisfies(exception -> assertStatus(exception, HttpStatus.FORBIDDEN));
	}

	@Test
	void rejectRequestRejectsLevel1ApproverForLevel2Request() {
		User approver = approverLevel1(30L);
		User requester = requester(10L);
		PurchaseRequest request = purchaseRequest(20L, requester, PurchaseRequestStatus.PENDING, ApprovalLevel.LEVEL_2);

		when(purchaseRequestRepository.findWithUsersById(20L)).thenReturn(Optional.of(request));

		assertThatThrownBy(() -> purchaseRequestService.rejectRequest(20L, null, auth(approver)))
			.isInstanceOf(ResponseStatusException.class)
			.satisfies(exception -> assertStatus(exception, HttpStatus.FORBIDDEN));
	}

	@Test
	void approveRequestReturns404WhenRequestDoesNotExist() {
		when(purchaseRequestRepository.findWithUsersById(99L)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> purchaseRequestService.approveRequest(99L, null, auth(approverLevel1(30L))))
			.isInstanceOf(ResponseStatusException.class)
			.satisfies(exception -> {
				assertStatus(exception, HttpStatus.NOT_FOUND);
				assertReason(exception, "Purchase request not found");
			});
	}

	@Test
	void rejectRequestReturns404WhenRequestDoesNotExist() {
		when(purchaseRequestRepository.findWithUsersById(99L)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> purchaseRequestService.rejectRequest(99L, null, auth(approverLevel1(30L))))
			.isInstanceOf(ResponseStatusException.class)
			.satisfies(exception -> {
				assertStatus(exception, HttpStatus.NOT_FOUND);
				assertReason(exception, "Purchase request not found");
			});
	}

	@Test
	void approveRequestRejectsLevel1ApproverWhenRequestIsNotPending() {
		User approver = approverLevel1(30L);
		User requester = requester(10L);
		PurchaseRequest request = purchaseRequest(20L, requester, PurchaseRequestStatus.APPROVED, ApprovalLevel.LEVEL_1);

		when(purchaseRequestRepository.findWithUsersById(20L)).thenReturn(Optional.of(request));

		assertThatThrownBy(() -> purchaseRequestService.approveRequest(20L, null, auth(approver)))
			.isInstanceOf(ResponseStatusException.class)
			.satisfies(exception -> assertStatus(exception, HttpStatus.UNPROCESSABLE_ENTITY));
	}

	@Test
	void rejectRequestRejectsLevel1ApproverWhenRequestIsNotPending() {
		User approver = approverLevel1(30L);
		User requester = requester(10L);
		PurchaseRequest request = purchaseRequest(20L, requester, PurchaseRequestStatus.REJECTED, ApprovalLevel.LEVEL_1);

		when(purchaseRequestRepository.findWithUsersById(20L)).thenReturn(Optional.of(request));

		assertThatThrownBy(() -> purchaseRequestService.rejectRequest(20L, null, auth(approver)))
			.isInstanceOf(ResponseStatusException.class)
			.satisfies(exception -> {
				assertStatus(exception, HttpStatus.UNPROCESSABLE_ENTITY);
				assertReason(
					exception,
					"Cannot reject this request because it is already REJECTED. Only pending requests can be rejected."
				);
			});
	}

	@Test
	void getRequestHistoryAllowsLevel1Approver() {
		User approver = approverLevel1(30L);
		User requester = requester(10L);
		PurchaseRequest request = purchaseRequest(20L, requester, PurchaseRequestStatus.PENDING, ApprovalLevel.LEVEL_1);
		RequestHistory created = history(1L, request, requester, RequestAction.CREATED, null, PurchaseRequestStatus.PENDING, null);

		when(purchaseRequestRepository.findWithUsersById(20L)).thenReturn(Optional.of(request));
		when(requestHistoryRepository.findAllByRequestIdOrderByCreatedAtAscIdAsc(20L)).thenReturn(List.of(created));

		var response = purchaseRequestService.getRequestHistory(20L, auth(approver));

		assertThat(response).hasSize(1);
		assertThat(response.getFirst().action()).isEqualTo(RequestAction.CREATED);
	}

	@Test
	void getRequestHistoryReturns404WhenRequestDoesNotExist() {
		when(purchaseRequestRepository.findWithUsersById(99L)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> purchaseRequestService.getRequestHistory(99L, auth(admin(99L))))
			.isInstanceOf(ResponseStatusException.class)
			.satisfies(exception -> {
				assertStatus(exception, HttpStatus.NOT_FOUND);
				assertReason(exception, "Purchase request not found");
			});
	}

	@Test
	void approveRequestAllowsLevel2ApproverForLevel2RequestWithComment() {
		User approver = approverLevel2(30L);
		User requester = requester(10L);
		PurchaseRequest request = purchaseRequest(20L, requester, PurchaseRequestStatus.PENDING, ApprovalLevel.LEVEL_2);

		when(purchaseRequestRepository.findWithUsersById(20L)).thenReturn(Optional.of(request));

		var response = purchaseRequestService.approveRequest(20L, new RequestDecisionRequest("Senior approval"), auth(approver));

		assertThat(response.status()).isEqualTo(PurchaseRequestStatus.APPROVED);
		assertSavedHistory(RequestAction.APPROVED, PurchaseRequestStatus.PENDING, PurchaseRequestStatus.APPROVED, "Senior approval");
	}

	@Test
	void approveRequestAllowsLevel2ApproverForLevel2RequestWithoutComment() {
		User approver = approverLevel2(30L);
		User requester = requester(10L);
		PurchaseRequest request = purchaseRequest(20L, requester, PurchaseRequestStatus.PENDING, ApprovalLevel.LEVEL_2);

		when(purchaseRequestRepository.findWithUsersById(20L)).thenReturn(Optional.of(request));

		var response = purchaseRequestService.approveRequest(20L, null, auth(approver));

		assertThat(response.status()).isEqualTo(PurchaseRequestStatus.APPROVED);
		assertSavedHistory(RequestAction.APPROVED, PurchaseRequestStatus.PENDING, PurchaseRequestStatus.APPROVED, null);
	}

	@Test
	void approveRequestAllowsLevel2ApproverForLevel1Request() {
		User approver = approverLevel2(30L);
		User requester = requester(10L);
		PurchaseRequest request = purchaseRequest(20L, requester, PurchaseRequestStatus.PENDING, ApprovalLevel.LEVEL_1);

		when(purchaseRequestRepository.findWithUsersById(20L)).thenReturn(Optional.of(request));

		var response = purchaseRequestService.approveRequest(20L, null, auth(approver));

		assertThat(response.status()).isEqualTo(PurchaseRequestStatus.APPROVED);
	}

	@Test
	void rejectRequestAllowsLevel2ApproverForLevel1Request() {
		User approver = approverLevel2(30L);
		User requester = requester(10L);
		PurchaseRequest request = purchaseRequest(20L, requester, PurchaseRequestStatus.PENDING, ApprovalLevel.LEVEL_1);

		when(purchaseRequestRepository.findWithUsersById(20L)).thenReturn(Optional.of(request));

		var response = purchaseRequestService.rejectRequest(20L, new RequestDecisionRequest("Rejected"), auth(approver));

		assertThat(response.status()).isEqualTo(PurchaseRequestStatus.REJECTED);
	}

	@Test
	void approveRequestRejectsLevel2ApproverForLevel3Request() {
		User approver = approverLevel2(30L);
		User requester = requester(10L);
		PurchaseRequest request = purchaseRequest(20L, requester, PurchaseRequestStatus.PENDING, ApprovalLevel.LEVEL_3);

		when(purchaseRequestRepository.findWithUsersById(20L)).thenReturn(Optional.of(request));

		assertThatThrownBy(() -> purchaseRequestService.approveRequest(20L, null, auth(approver)))
			.isInstanceOf(ResponseStatusException.class)
			.satisfies(exception -> assertStatus(exception, HttpStatus.FORBIDDEN));
	}

	@Test
	void rejectRequestRejectsLevel2ApproverForLevel3Request() {
		User approver = approverLevel2(30L);
		User requester = requester(10L);
		PurchaseRequest request = purchaseRequest(20L, requester, PurchaseRequestStatus.PENDING, ApprovalLevel.LEVEL_3);

		when(purchaseRequestRepository.findWithUsersById(20L)).thenReturn(Optional.of(request));

		assertThatThrownBy(() -> purchaseRequestService.rejectRequest(20L, null, auth(approver)))
			.isInstanceOf(ResponseStatusException.class)
			.satisfies(exception -> assertStatus(exception, HttpStatus.FORBIDDEN));
	}

	@Test
	void approveRequestRejectsLevel0ApprovalRequirementAsInvalidState() {
		User approver = approverLevel1(30L);
		User requester = requester(10L);
		PurchaseRequest request = purchaseRequest(20L, requester, PurchaseRequestStatus.PENDING, ApprovalLevel.LEVEL_0);

		when(purchaseRequestRepository.findWithUsersById(20L)).thenReturn(Optional.of(request));

		assertThatThrownBy(() -> purchaseRequestService.approveRequest(20L, null, auth(approver)))
			.isInstanceOf(ResponseStatusException.class)
			.satisfies(exception -> {
				assertStatus(exception, HttpStatus.UNPROCESSABLE_ENTITY);
				assertReason(exception, "Purchase requests cannot require LEVEL_0 approval");
			});
	}

	@Test
	void approveRequestRejectsLevel2ApproverWhenRequestIsNotPending() {
		User approver = approverLevel2(30L);
		User requester = requester(10L);
		PurchaseRequest request = purchaseRequest(20L, requester, PurchaseRequestStatus.CANCELLED, ApprovalLevel.LEVEL_2);

		when(purchaseRequestRepository.findWithUsersById(20L)).thenReturn(Optional.of(request));

		assertThatThrownBy(() -> purchaseRequestService.approveRequest(20L, null, auth(approver)))
			.isInstanceOf(ResponseStatusException.class)
			.satisfies(exception -> assertStatus(exception, HttpStatus.UNPROCESSABLE_ENTITY));
	}

	@Test
	void rejectRequestRejectsLevel2ApproverWhenRequestIsNotPending() {
		User approver = approverLevel2(30L);
		User requester = requester(10L);
		PurchaseRequest request = purchaseRequest(20L, requester, PurchaseRequestStatus.APPROVED, ApprovalLevel.LEVEL_2);

		when(purchaseRequestRepository.findWithUsersById(20L)).thenReturn(Optional.of(request));

		assertThatThrownBy(() -> purchaseRequestService.rejectRequest(20L, null, auth(approver)))
			.isInstanceOf(ResponseStatusException.class)
			.satisfies(exception -> assertStatus(exception, HttpStatus.UNPROCESSABLE_ENTITY));
	}

	@Test
	void cancelRequestRejectsLevel2ApproverWhenRequestIsNotPending() {
		User approver = approverLevel2(30L);
		User requester = requester(10L);
		PurchaseRequest request = purchaseRequest(20L, requester, PurchaseRequestStatus.APPROVED, ApprovalLevel.LEVEL_2);

		when(purchaseRequestRepository.findWithUsersById(20L)).thenReturn(Optional.of(request));

		assertThatThrownBy(() -> purchaseRequestService.cancelRequest(20L, null, auth(approver)))
			.isInstanceOf(ResponseStatusException.class)
			.satisfies(exception -> assertStatus(exception, HttpStatus.FORBIDDEN));
	}

	@Test
	void getRequestHistoryAllowsLevel2Approver() {
		User approver = approverLevel2(30L);
		User requester = requester(10L);
		PurchaseRequest request = purchaseRequest(20L, requester, PurchaseRequestStatus.PENDING, ApprovalLevel.LEVEL_2);

		when(purchaseRequestRepository.findWithUsersById(20L)).thenReturn(Optional.of(request));
		when(requestHistoryRepository.findAllByRequestIdOrderByCreatedAtAscIdAsc(20L)).thenReturn(List.of());

		var response = purchaseRequestService.getRequestHistory(20L, auth(approver));

		assertThat(response).isEmpty();
	}

	@Test
	void approveRequestAllowsAdminForLevel3RequestWithComment() {
		User admin = admin(99L);
		User requester = requester(10L);
		PurchaseRequest request = purchaseRequest(20L, requester, PurchaseRequestStatus.PENDING, ApprovalLevel.LEVEL_3);

		when(purchaseRequestRepository.findWithUsersById(20L)).thenReturn(Optional.of(request));

		var response = purchaseRequestService.approveRequest(20L, new RequestDecisionRequest("Approved by admin"), auth(admin));

		assertThat(response.status()).isEqualTo(PurchaseRequestStatus.APPROVED);
		assertSavedHistory(RequestAction.APPROVED, PurchaseRequestStatus.PENDING, PurchaseRequestStatus.APPROVED, "Approved by admin");
	}

	@Test
	void approveRequestAllowsAdminForLevel3RequestWithoutComment() {
		User admin = admin(99L);
		User requester = requester(10L);
		PurchaseRequest request = purchaseRequest(20L, requester, PurchaseRequestStatus.PENDING, ApprovalLevel.LEVEL_3);

		when(purchaseRequestRepository.findWithUsersById(20L)).thenReturn(Optional.of(request));

		var response = purchaseRequestService.approveRequest(20L, null, auth(admin));

		assertThat(response.status()).isEqualTo(PurchaseRequestStatus.APPROVED);
		assertSavedHistory(RequestAction.APPROVED, PurchaseRequestStatus.PENDING, PurchaseRequestStatus.APPROVED, null);
	}

	@Test
	void approveRequestAllowsAdminForLevel2Request() {
		User admin = admin(99L);
		User requester = requester(10L);
		PurchaseRequest request = purchaseRequest(20L, requester, PurchaseRequestStatus.PENDING, ApprovalLevel.LEVEL_2);

		when(purchaseRequestRepository.findWithUsersById(20L)).thenReturn(Optional.of(request));

		var response = purchaseRequestService.approveRequest(20L, null, auth(admin));

		assertThat(response.status()).isEqualTo(PurchaseRequestStatus.APPROVED);
	}

	@Test
	void rejectRequestAllowsAdminForLevel2Request() {
		User admin = admin(99L);
		User requester = requester(10L);
		PurchaseRequest request = purchaseRequest(20L, requester, PurchaseRequestStatus.PENDING, ApprovalLevel.LEVEL_2);

		when(purchaseRequestRepository.findWithUsersById(20L)).thenReturn(Optional.of(request));

		var response = purchaseRequestService.rejectRequest(20L, null, auth(admin));

		assertThat(response.status()).isEqualTo(PurchaseRequestStatus.REJECTED);
	}

	@Test
	void approveRequestAllowsAdminForLevel1Request() {
		User admin = admin(99L);
		User requester = requester(10L);
		PurchaseRequest request = purchaseRequest(20L, requester, PurchaseRequestStatus.PENDING, ApprovalLevel.LEVEL_1);

		when(purchaseRequestRepository.findWithUsersById(20L)).thenReturn(Optional.of(request));

		var response = purchaseRequestService.approveRequest(20L, null, auth(admin));

		assertThat(response.status()).isEqualTo(PurchaseRequestStatus.APPROVED);
	}

	@Test
	void rejectRequestAllowsAdminForLevel1Request() {
		User admin = admin(99L);
		User requester = requester(10L);
		PurchaseRequest request = purchaseRequest(20L, requester, PurchaseRequestStatus.PENDING, ApprovalLevel.LEVEL_1);

		when(purchaseRequestRepository.findWithUsersById(20L)).thenReturn(Optional.of(request));

		var response = purchaseRequestService.rejectRequest(20L, null, auth(admin));

		assertThat(response.status()).isEqualTo(PurchaseRequestStatus.REJECTED);
	}

	@Test
	void approveRequestRejectsAdminWhenRequestIsNotPending() {
		User admin = admin(99L);
		User requester = requester(10L);
		PurchaseRequest request = purchaseRequest(20L, requester, PurchaseRequestStatus.CANCELLED, ApprovalLevel.LEVEL_3);

		when(purchaseRequestRepository.findWithUsersById(20L)).thenReturn(Optional.of(request));

		assertThatThrownBy(() -> purchaseRequestService.approveRequest(20L, null, auth(admin)))
			.isInstanceOf(ResponseStatusException.class)
			.satisfies(exception -> {
				assertStatus(exception, HttpStatus.UNPROCESSABLE_ENTITY);
				assertReason(
					exception,
					"Cannot approve this request because it is already CANCELLED. Only pending requests can be approved."
				);
			});
	}

	@Test
	void rejectRequestRejectsAdminWhenRequestIsNotPending() {
		User admin = admin(99L);
		User requester = requester(10L);
		PurchaseRequest request = purchaseRequest(20L, requester, PurchaseRequestStatus.APPROVED, ApprovalLevel.LEVEL_3);

		when(purchaseRequestRepository.findWithUsersById(20L)).thenReturn(Optional.of(request));

		assertThatThrownBy(() -> purchaseRequestService.rejectRequest(20L, null, auth(admin)))
			.isInstanceOf(ResponseStatusException.class)
			.satisfies(exception -> assertStatus(exception, HttpStatus.UNPROCESSABLE_ENTITY));
	}

	@Test
	void cancelRequestRejectsAdminWhenRequestIsNotPending() {
		User admin = admin(99L);
		User requester = requester(10L);
		PurchaseRequest request = purchaseRequest(20L, requester, PurchaseRequestStatus.REJECTED, ApprovalLevel.LEVEL_2);

		when(purchaseRequestRepository.findWithUsersById(20L)).thenReturn(Optional.of(request));

		assertThatThrownBy(() -> purchaseRequestService.cancelRequest(20L, null, auth(admin)))
			.isInstanceOf(ResponseStatusException.class)
			.satisfies(exception -> assertStatus(exception, HttpStatus.UNPROCESSABLE_ENTITY));
	}

	@Test
	void getRequestHistoryAllowsAdmin() {
		User admin = admin(99L);
		User requester = requester(10L);
		PurchaseRequest request = purchaseRequest(20L, requester, PurchaseRequestStatus.PENDING, ApprovalLevel.LEVEL_2);

		when(purchaseRequestRepository.findWithUsersById(20L)).thenReturn(Optional.of(request));
		when(requestHistoryRepository.findAllByRequestIdOrderByCreatedAtAscIdAsc(20L)).thenReturn(List.of());

		var response = purchaseRequestService.getRequestHistory(20L, auth(admin));

		assertThat(response).isEmpty();
	}

	private static Stream<Arguments> approvalLevelScenarios() {
		return Stream.of(
			Arguments.of(new BigDecimal("999.99"), ApprovalLevel.LEVEL_1),
			Arguments.of(new BigDecimal("1000.00"), ApprovalLevel.LEVEL_1),
			Arguments.of(new BigDecimal("1000.01"), ApprovalLevel.LEVEL_2),
			Arguments.of(new BigDecimal("10000.00"), ApprovalLevel.LEVEL_2),
			Arguments.of(new BigDecimal("10000.01"), ApprovalLevel.LEVEL_3)
		);
	}

	private void assertSavedHistory(
		RequestAction expectedAction,
		PurchaseRequestStatus expectedFromStatus,
		PurchaseRequestStatus expectedToStatus,
		String expectedComment
	) {
		ArgumentCaptor<RequestHistory> historyCaptor = ArgumentCaptor.forClass(RequestHistory.class);
		verify(requestHistoryRepository).save(historyCaptor.capture());

		RequestHistory savedHistory = historyCaptor.getValue();
		assertThat(savedHistory.getAction()).isEqualTo(expectedAction);
		assertThat(savedHistory.getFromStatus()).isEqualTo(expectedFromStatus);
		assertThat(savedHistory.getToStatus()).isEqualTo(expectedToStatus);
		assertThat(savedHistory.getComment()).isEqualTo(expectedComment);
	}

	private void assertStatus(Throwable exception, HttpStatus status) {
		ResponseStatusException responseStatusException = (ResponseStatusException) exception;
		assertThat(responseStatusException.getStatusCode()).isEqualTo(status);
	}

	private void assertReason(Throwable exception, String reason) {
		ResponseStatusException responseStatusException = (ResponseStatusException) exception;
		assertThat(responseStatusException.getReason()).isEqualTo(reason);
	}
}
