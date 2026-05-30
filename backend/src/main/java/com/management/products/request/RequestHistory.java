package com.management.products.request;

import com.management.products.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "request_history")
public class RequestHistory {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "request_id", nullable = false)
	private PurchaseRequest request;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "actor_id", nullable = false)
	private User actor;

	@Enumerated(EnumType.STRING)
	@JdbcTypeCode(SqlTypes.NAMED_ENUM)
	@Column(nullable = false, columnDefinition = "request_action")
	private RequestAction action;

	@Enumerated(EnumType.STRING)
	@JdbcTypeCode(SqlTypes.NAMED_ENUM)
	@Column(name = "from_status", columnDefinition = "request_status")
	private PurchaseRequestStatus fromStatus;

	@Enumerated(EnumType.STRING)
	@JdbcTypeCode(SqlTypes.NAMED_ENUM)
	@Column(name = "to_status", nullable = false, columnDefinition = "request_status")
	private PurchaseRequestStatus toStatus;

	@Column(columnDefinition = "TEXT")
	private String comment;

	@Column(name = "created_at", nullable = false, updatable = false)
	private OffsetDateTime createdAt;

	protected RequestHistory() {
	}

	public RequestHistory(
		PurchaseRequest request,
		User actor,
		RequestAction action,
		PurchaseRequestStatus fromStatus,
		PurchaseRequestStatus toStatus,
		String comment
	) {
		this.request = request;
		this.actor = actor;
		this.action = action;
		this.fromStatus = fromStatus;
		this.toStatus = toStatus;
		this.comment = comment;
	}

	@PrePersist
	void prePersist() {
		this.createdAt = OffsetDateTime.now();
	}

	public Long getId() {
		return id;
	}

	public PurchaseRequest getRequest() {
		return request;
	}

	public User getActor() {
		return actor;
	}

	public RequestAction getAction() {
		return action;
	}

	public PurchaseRequestStatus getFromStatus() {
		return fromStatus;
	}

	public PurchaseRequestStatus getToStatus() {
		return toStatus;
	}

	public String getComment() {
		return comment;
	}

	public OffsetDateTime getCreatedAt() {
		return createdAt;
	}
}
