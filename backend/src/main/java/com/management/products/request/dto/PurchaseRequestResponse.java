package com.management.products.request.dto;

import com.management.products.request.PurchaseRequest;
import com.management.products.request.PurchaseRequestStatus;
import com.management.products.user.ApprovalLevel;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record PurchaseRequestResponse(
	Long id,
	String title,
	String description,
	BigDecimal amount,
	String category,
	PurchaseRequestStatus status,
	ApprovalLevel requiredApprovalLevel,
	RequestActorResponse requester,
	RequestActorResponse resolvedBy,
	OffsetDateTime resolvedAt,
	OffsetDateTime createdAt,
	OffsetDateTime updatedAt
) {
	public static PurchaseRequestResponse from(PurchaseRequest request) {
		return new PurchaseRequestResponse(
			request.getId(),
			request.getTitle(),
			request.getDescription(),
			request.getAmount(),
			request.getCategory(),
			request.getStatus(),
			request.getRequiredApprovalLevel(),
			RequestActorResponse.from(request.getRequester()),
			request.getResolvedBy() == null ? null : RequestActorResponse.from(request.getResolvedBy()),
			request.getResolvedAt(),
			request.getCreatedAt(),
			request.getUpdatedAt()
		);
	}
}
