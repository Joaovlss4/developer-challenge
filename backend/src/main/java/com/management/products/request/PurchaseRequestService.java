package com.management.products.request;

import com.management.products.auth.AuthUserDetails;
import com.management.products.request.dto.CreatePurchaseRequestRequest;
import com.management.products.request.dto.PageResponse;
import com.management.products.request.dto.PurchaseRequestResponse;
import com.management.products.request.dto.RequestDecisionRequest;
import com.management.products.request.dto.RequestHistoryResponse;
import com.management.products.request.dto.PurchaseRequestSummaryResponse;
import com.management.products.security.UserPermission;
import com.management.products.user.ApprovalLevel;
import com.management.products.user.User;
import com.management.products.user.UserRole;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PurchaseRequestService {

	private static final BigDecimal LEVEL_1_LIMIT = new BigDecimal("1000.00");
	private static final BigDecimal LEVEL_2_LIMIT = new BigDecimal("10000.00");

	private final PurchaseRequestRepository purchaseRequestRepository;
	private final RequestHistoryRepository requestHistoryRepository;

	public PurchaseRequestService(
		PurchaseRequestRepository purchaseRequestRepository,
		RequestHistoryRepository requestHistoryRepository
	) {
		this.purchaseRequestRepository = purchaseRequestRepository;
		this.requestHistoryRepository = requestHistoryRepository;
	}

	@Transactional
	public PurchaseRequestResponse createRequest(CreatePurchaseRequestRequest request, AuthUserDetails currentUser) {
		User requester = currentUser.getUser();
		requireAuthority(currentUser, UserPermission.REQUEST_CREATE);

		PurchaseRequest purchaseRequest = new PurchaseRequest(
			requireNotBlank(request.title(), "title"),
			requireNotBlank(request.description(), "description"),
			request.amount(),
			requireNotBlank(request.category(), "category"),
			PurchaseRequestStatus.PENDING,
			determineRequiredApprovalLevel(request.amount()),
			requester
		);

		PurchaseRequest savedRequest = purchaseRequestRepository.save(purchaseRequest);
		requestHistoryRepository.save(new RequestHistory(
			savedRequest,
			requester,
			RequestAction.CREATED,
			null,
			PurchaseRequestStatus.PENDING,
			null
		));

		return PurchaseRequestResponse.from(savedRequest);
	}

	@Transactional(readOnly = true)
	public PageResponse<PurchaseRequestSummaryResponse> listRequests(
		PurchaseRequestStatus status,
		Pageable pageable,
		AuthUserDetails currentUser
	) {
		Page<PurchaseRequest> requests = canReadAllRequests(currentUser)
			? findAllRequests(status, pageable)
			: findOwnRequests(status, pageable, currentUser.getUser().getId());

		return PageResponse.from(requests.map(PurchaseRequestSummaryResponse::from));
	}

	@Transactional(readOnly = true)
	public PurchaseRequestResponse getRequestById(Long id, AuthUserDetails currentUser) {
		PurchaseRequest request = loadRequest(id);
		ensureCanReadRequest(request, currentUser);
		return PurchaseRequestResponse.from(request);
	}

	@Transactional
	public PurchaseRequestResponse cancelRequest(Long id, RequestDecisionRequest requestDecision, AuthUserDetails currentUser) {
		PurchaseRequest request = loadRequest(id);
		User actor = currentUser.getUser();

		ensureCanCancelRequest(request, currentUser);
		ensurePending(request, "cancel");

		request.markCancelled(actor, OffsetDateTime.now());
		requestHistoryRepository.save(new RequestHistory(
			request,
			actor,
			RequestAction.CANCELLED,
			PurchaseRequestStatus.PENDING,
			PurchaseRequestStatus.CANCELLED,
			normalizeComment(requestDecision == null ? null : requestDecision.comment())
		));

		return PurchaseRequestResponse.from(request);
	}

	@Transactional
	public PurchaseRequestResponse approveRequest(Long id, RequestDecisionRequest request, AuthUserDetails currentUser) {
		PurchaseRequest purchaseRequest = loadRequest(id);
		User actor = currentUser.getUser();

		ensureCanReviewRequest(currentUser);
		ensurePending(purchaseRequest, "approve");
		ensureCompatibleApprovalLevel(purchaseRequest, currentUser);

		purchaseRequest.markApproved(actor, OffsetDateTime.now());
		requestHistoryRepository.save(new RequestHistory(
			purchaseRequest,
			actor,
			RequestAction.APPROVED,
			PurchaseRequestStatus.PENDING,
			PurchaseRequestStatus.APPROVED,
			normalizeComment(request == null ? null : request.comment())
		));

		return PurchaseRequestResponse.from(purchaseRequest);
	}

	@Transactional
	public PurchaseRequestResponse rejectRequest(Long id, RequestDecisionRequest request, AuthUserDetails currentUser) {
		PurchaseRequest purchaseRequest = loadRequest(id);
		User actor = currentUser.getUser();

		ensureCanReviewRequest(currentUser);
		ensurePending(purchaseRequest, "reject");
		ensureCompatibleApprovalLevel(purchaseRequest, currentUser);

		purchaseRequest.markRejected(actor, OffsetDateTime.now());
		requestHistoryRepository.save(new RequestHistory(
			purchaseRequest,
			actor,
			RequestAction.REJECTED,
			PurchaseRequestStatus.PENDING,
			PurchaseRequestStatus.REJECTED,
			normalizeComment(request == null ? null : request.comment())
		));

		return PurchaseRequestResponse.from(purchaseRequest);
	}

	@Transactional(readOnly = true)
	public List<RequestHistoryResponse> getRequestHistory(Long id, AuthUserDetails currentUser) {
		PurchaseRequest request = loadRequest(id);
		ensureCanReadRequest(request, currentUser);

		return requestHistoryRepository.findAllByRequestIdOrderByCreatedAtAscIdAsc(id).stream()
			.map(RequestHistoryResponse::from)
			.toList();
	}

	private Page<PurchaseRequest> findAllRequests(PurchaseRequestStatus status, Pageable pageable) {
		return status == null
			? purchaseRequestRepository.findAll(pageable)
			: purchaseRequestRepository.findAllByStatus(status, pageable);
	}

	private Page<PurchaseRequest> findOwnRequests(PurchaseRequestStatus status, Pageable pageable, Long requesterId) {
		return status == null
			? purchaseRequestRepository.findAllByRequesterId(requesterId, pageable)
			: purchaseRequestRepository.findAllByRequesterIdAndStatus(requesterId, status, pageable);
	}

	private PurchaseRequest loadRequest(Long id) {
		return purchaseRequestRepository.findWithUsersById(id)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Purchase request not found"));
	}

	private void ensureCanReadRequest(PurchaseRequest request, AuthUserDetails currentUser) {
		if (canReadAllRequests(currentUser)) {
			return;
		}

		if (request.getRequester().getId().equals(currentUser.getUser().getId())) {
			return;
		}

		throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have access to this request");
	}

	private void ensureCanCancelRequest(PurchaseRequest request, AuthUserDetails currentUser) {
		if (hasAuthority(currentUser, UserPermission.REQUEST_CANCEL_ANY)) {
			return;
		}

		User actor = currentUser.getUser();
		boolean isRequester = request.getRequester().getId().equals(actor.getId());
		if (actor.getRole() == UserRole.SOLICITANTE && isRequester) {
			return;
		}

		throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed to cancel this request");
	}

	private void ensureCanReviewRequest(AuthUserDetails currentUser) {
		if (!hasAuthority(currentUser, UserPermission.REQUEST_REVIEW)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed to review this request");
		}
	}

	private void ensurePending(PurchaseRequest request, String action) {
		if (request.getStatus() == PurchaseRequestStatus.PENDING) {
			return;
		}

		throw new ResponseStatusException(
			HttpStatus.UNPROCESSABLE_ENTITY,
			"Cannot " + action + " this request because it is already "
				+ request.getStatus()
				+ ". Only pending requests can be "
				+ pastParticiple(action)
				+ "."
		);
	}

	private String pastParticiple(String action) {
		return switch (action) {
			case "approve" -> "approved";
			case "reject" -> "rejected";
			case "cancel" -> "cancelled";
			default -> action + "ed";
		};
	}

	private void ensureCompatibleApprovalLevel(PurchaseRequest request, AuthUserDetails currentUser) {
		UserPermission requiredPermission = switch (request.getRequiredApprovalLevel()) {
			case LEVEL_1 -> UserPermission.REQUEST_APPROVE_LEVEL_1;
			case LEVEL_2 -> UserPermission.REQUEST_APPROVE_LEVEL_2;
			case LEVEL_3 -> UserPermission.REQUEST_APPROVE_LEVEL_3;
			case LEVEL_0 -> throw new ResponseStatusException(
				HttpStatus.UNPROCESSABLE_ENTITY,
				"Purchase requests cannot require LEVEL_0 approval"
			);
		};

		if (!hasCompatibleApprovalAuthority(currentUser, requiredPermission)) {
			throw insufficientApprovalLevel();
		}
	}

	private boolean canReadAllRequests(AuthUserDetails currentUser) {
		return hasAuthority(currentUser, UserPermission.REQUEST_READ_ALL);
	}

	private boolean hasAuthority(AuthUserDetails currentUser, UserPermission permission) {
		return currentUser.getAuthorities().stream()
			.map(GrantedAuthority::getAuthority)
			.anyMatch(permission.authority()::equals);
	}

	private boolean hasCompatibleApprovalAuthority(AuthUserDetails currentUser, UserPermission permission) {
		if (hasAuthority(currentUser, permission)) {
			return true;
		}

		return (permission == UserPermission.REQUEST_APPROVE_LEVEL_1
				|| permission == UserPermission.REQUEST_APPROVE_LEVEL_2)
			&& hasAuthority(currentUser, UserPermission.REQUEST_APPROVE_LEVEL_3);
	}

	private void requireAuthority(AuthUserDetails currentUser, UserPermission permission) {
		if (!hasAuthority(currentUser, permission)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to perform this action");
		}
	}

	private String requireNotBlank(String value, String field) {
		String trimmed = value.trim();
		if (trimmed.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " must not be blank");
		}
		return trimmed;
	}

	private String normalizeComment(String comment) {
		if (comment == null) {
			return null;
		}
		String trimmed = comment.trim();
		return trimmed.isBlank() ? null : trimmed;
	}

	private ResponseStatusException insufficientApprovalLevel() {
		return new ResponseStatusException(
			HttpStatus.FORBIDDEN,
			"You do not have the required approval level for this request"
		);
	}

	private ApprovalLevel determineRequiredApprovalLevel(BigDecimal amount) {
		if (amount.compareTo(LEVEL_1_LIMIT) <= 0) {
			return ApprovalLevel.LEVEL_1;
		}
		if (amount.compareTo(LEVEL_2_LIMIT) <= 0) {
			return ApprovalLevel.LEVEL_2;
		}
		return ApprovalLevel.LEVEL_3;
	}
}
