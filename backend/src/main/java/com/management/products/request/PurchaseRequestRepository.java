package com.management.products.request;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PurchaseRequestRepository extends JpaRepository<PurchaseRequest, Long> {

	@EntityGraph(attributePaths = {"requester", "resolvedBy"})
	Page<PurchaseRequest> findAllByStatus(PurchaseRequestStatus status, Pageable pageable);

	@EntityGraph(attributePaths = {"requester", "resolvedBy"})
	Page<PurchaseRequest> findAllByRequesterId(Long requesterId, Pageable pageable);

	@EntityGraph(attributePaths = {"requester", "resolvedBy"})
	Page<PurchaseRequest> findAllByRequesterIdAndStatus(Long requesterId, PurchaseRequestStatus status, Pageable pageable);

	@EntityGraph(attributePaths = {"requester", "resolvedBy"})
	Optional<PurchaseRequest> findWithUsersById(Long id);

	@EntityGraph(attributePaths = {"requester", "resolvedBy"})
	Page<PurchaseRequest> findAll(Pageable pageable);
}
