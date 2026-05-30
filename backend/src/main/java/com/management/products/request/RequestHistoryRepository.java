package com.management.products.request;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

public interface RequestHistoryRepository extends JpaRepository<RequestHistory, Long> {

	@EntityGraph(attributePaths = {"actor"})
	List<RequestHistory> findAllByRequestIdOrderByCreatedAtAscIdAsc(Long requestId);
}
