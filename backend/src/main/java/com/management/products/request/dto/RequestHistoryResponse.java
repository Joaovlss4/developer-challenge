package com.management.products.request.dto;

import com.management.products.request.RequestAction;
import com.management.products.request.RequestHistory;
import com.management.products.request.PurchaseRequestStatus;
import java.time.OffsetDateTime;

public record RequestHistoryResponse(
	Long id,
	RequestAction action,
	PurchaseRequestStatus fromStatus,
	PurchaseRequestStatus toStatus,
	String comment,
	RequestActorResponse actor,
	OffsetDateTime createdAt
) {
	public static RequestHistoryResponse from(RequestHistory history) {
		return new RequestHistoryResponse(
			history.getId(),
			history.getAction(),
			history.getFromStatus(),
			history.getToStatus(),
			history.getComment(),
			RequestActorResponse.from(history.getActor()),
			history.getCreatedAt()
		);
	}
}
