package com.management.products.request;

import com.management.products.auth.AuthUserDetails;
import com.management.products.request.dto.CreatePurchaseRequestRequest;
import com.management.products.user.ApprovalLevel;
import com.management.products.user.User;
import com.management.products.user.UserRole;
import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

final class PurchaseRequestTestFactory {

	private PurchaseRequestTestFactory() {
	}

	static User requester(Long id) {
		return user(id, "Requester " + id, "requester" + id + "@example.com", UserRole.SOLICITANTE, ApprovalLevel.LEVEL_0);
	}

	static User approverLevel1(Long id) {
		return user(id, "Approver " + id, "approver" + id + "@example.com", UserRole.APROVADOR, ApprovalLevel.LEVEL_1);
	}

	static User approverLevel2(Long id) {
		return user(id, "Senior Approver " + id, "senior" + id + "@example.com", UserRole.APROVADOR, ApprovalLevel.LEVEL_2);
	}

	static User admin(Long id) {
		return user(id, "Admin " + id, "admin" + id + "@example.com", UserRole.ADMIN, ApprovalLevel.LEVEL_3);
	}

	static AuthUserDetails auth(User user) {
		return new AuthUserDetails(user);
	}

	static CreatePurchaseRequestRequest createRequest(BigDecimal amount) {
		return new CreatePurchaseRequestRequest(
			"Purchase",
			"Purchase description",
			amount,
			"EQUIPMENT"
		);
	}

	static PurchaseRequest purchaseRequest(
		Long id,
		User requester,
		PurchaseRequestStatus status,
		ApprovalLevel requiredApprovalLevel
	) {
		PurchaseRequest request = new PurchaseRequest(
			"Purchase",
			"Description",
			new BigDecimal("100.00"),
			"EQUIPMENT",
			status,
			requiredApprovalLevel,
			requester
		);
		setField(PurchaseRequest.class, request, "id", id);
		setField(PurchaseRequest.class, request, "createdAt", OffsetDateTime.now());
		setField(PurchaseRequest.class, request, "updatedAt", OffsetDateTime.now());
		return request;
	}

	static RequestHistory history(
		Long id,
		PurchaseRequest request,
		User actor,
		RequestAction action,
		PurchaseRequestStatus fromStatus,
		PurchaseRequestStatus toStatus,
		String comment
	) {
		RequestHistory history = new RequestHistory(request, actor, action, fromStatus, toStatus, comment);
		setField(RequestHistory.class, history, "id", id);
		setField(RequestHistory.class, history, "createdAt", OffsetDateTime.now());
		return history;
	}

	static void setId(PurchaseRequest request, Long id) {
		setField(PurchaseRequest.class, request, "id", id);
	}

	private static User user(Long id, String name, String email, UserRole role, ApprovalLevel approvalLevel) {
		User user = new User(name, email, "encoded-password", role, approvalLevel);
		setField(User.class, user, "id", id);
		return user;
	}

	private static void setField(Class<?> type, Object target, String fieldName, Object value) {
		try {
			Field field = type.getDeclaredField(fieldName);
			field.setAccessible(true);
			field.set(target, value);
		} catch (ReflectiveOperationException exception) {
			throw new IllegalStateException("Unable to set test field " + fieldName, exception);
		}
	}
}
