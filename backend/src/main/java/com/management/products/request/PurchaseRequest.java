package com.management.products.request;

import com.management.products.user.ApprovalLevel;
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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "purchase_requests")
public class PurchaseRequest {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 160)
	private String title;

	@Column(nullable = false, columnDefinition = "TEXT")
	private String description;

	@Column(nullable = false, precision = 12, scale = 2)
	private BigDecimal amount;

	@Column(nullable = false, length = 80)
	private String category;

	@Enumerated(EnumType.STRING)
	@JdbcTypeCode(SqlTypes.NAMED_ENUM)
	@Column(nullable = false, columnDefinition = "request_status")
	private PurchaseRequestStatus status;

	@Enumerated(EnumType.STRING)
	@JdbcTypeCode(SqlTypes.NAMED_ENUM)
	@Column(name = "required_approval_level", nullable = false, columnDefinition = "approval_level")
	private ApprovalLevel requiredApprovalLevel;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "requester_id", nullable = false)
	private User requester;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "resolved_by_id")
	private User resolvedBy;

	@Column(name = "resolved_at")
	private OffsetDateTime resolvedAt;

	@Column(name = "created_at", nullable = false, updatable = false)
	private OffsetDateTime createdAt;

	@Column(name = "updated_at", nullable = false)
	private OffsetDateTime updatedAt;

	@Version
	@Column(nullable = false)
	private long version;

	protected PurchaseRequest() {
	}

	public PurchaseRequest(
		String title,
		String description,
		BigDecimal amount,
		String category,
		PurchaseRequestStatus status,
		ApprovalLevel requiredApprovalLevel,
		User requester
	) {
		this.title = title;
		this.description = description;
		this.amount = amount;
		this.category = category;
		this.status = status;
		this.requiredApprovalLevel = requiredApprovalLevel;
		this.requester = requester;
	}

	@PrePersist
	void prePersist() {
		OffsetDateTime now = OffsetDateTime.now();
		this.createdAt = now;
		this.updatedAt = now;
	}

	@PreUpdate
	void preUpdate() {
		this.updatedAt = OffsetDateTime.now();
	}

	public Long getId() {
		return id;
	}

	public String getTitle() {
		return title;
	}

	public String getDescription() {
		return description;
	}

	public BigDecimal getAmount() {
		return amount;
	}

	public String getCategory() {
		return category;
	}

	public PurchaseRequestStatus getStatus() {
		return status;
	}

	public ApprovalLevel getRequiredApprovalLevel() {
		return requiredApprovalLevel;
	}

	public User getRequester() {
		return requester;
	}

	public User getResolvedBy() {
		return resolvedBy;
	}

	public OffsetDateTime getResolvedAt() {
		return resolvedAt;
	}

	public OffsetDateTime getCreatedAt() {
		return createdAt;
	}

	public OffsetDateTime getUpdatedAt() {
		return updatedAt;
	}

	public void markApproved(User actor, OffsetDateTime resolvedAt) {
		this.status = PurchaseRequestStatus.APPROVED;
		this.resolvedBy = actor;
		this.resolvedAt = resolvedAt;
	}

	public void markRejected(User actor, OffsetDateTime resolvedAt) {
		this.status = PurchaseRequestStatus.REJECTED;
		this.resolvedBy = actor;
		this.resolvedAt = resolvedAt;
	}

	public void markCancelled(User actor, OffsetDateTime resolvedAt) {
		this.status = PurchaseRequestStatus.CANCELLED;
		this.resolvedBy = actor;
		this.resolvedAt = resolvedAt;
	}
}
