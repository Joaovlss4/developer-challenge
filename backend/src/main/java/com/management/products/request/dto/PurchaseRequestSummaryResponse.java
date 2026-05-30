package com.management.products.request.dto;

import com.management.products.request.PurchaseRequest;
import com.management.products.request.PurchaseRequestStatus;
import com.management.products.user.ApprovalLevel;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record PurchaseRequestSummaryResponse(
	Long id,
	String title,
	BigDecimal amount,
	String category,
	PurchaseRequestStatus status,
	ApprovalLevel requiredApprovalLevel,
	RequestActorResponse requester,
	OffsetDateTime createdAt
) {
	public static PurchaseRequestSummaryResponse from(PurchaseRequest request) {
		return new PurchaseRequestSummaryResponse(
			request.getId(),
			request.getTitle(),
			request.getAmount(),
			request.getCategory(),
			request.getStatus(),
			request.getRequiredApprovalLevel(),
			RequestActorResponse.from(request.getRequester()),
			request.getCreatedAt()
		);
	}
}
