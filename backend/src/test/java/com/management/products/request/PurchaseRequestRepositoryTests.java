package com.management.products.request;

import static org.assertj.core.api.Assertions.assertThat;

import com.management.products.user.ApprovalLevel;
import com.management.products.user.User;
import com.management.products.user.UserRepository;
import com.management.products.user.UserRole;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class PurchaseRequestRepositoryTests {

	@DynamicPropertySource
	static void configureProperties(DynamicPropertyRegistry registry) {
		registry.add("spring.datasource.url", () -> "jdbc:postgresql://localhost:5432/purchase_requests");
		registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
		registry.add("spring.datasource.username", () -> "purchase_user");
		registry.add("spring.datasource.password", () -> "purchase_password");
		registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
		registry.add("spring.jpa.show-sql", () -> "false");
	}

	@Autowired
	private PurchaseRequestRepository purchaseRequestRepository;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private EntityManager entityManager;

	@Autowired
	private EntityManagerFactory entityManagerFactory;

	@Test
	void findAllByRequesterIdAndStatusReturnsOnlyMatchingRequests() {
		User requester = userRepository.save(user(uniqueEmail("requester"), UserRole.SOLICITANTE, ApprovalLevel.LEVEL_0));
		User otherRequester = userRepository.save(user(uniqueEmail("other"), UserRole.SOLICITANTE, ApprovalLevel.LEVEL_0));
		User approver = userRepository.save(user(uniqueEmail("approver"), UserRole.APROVADOR, ApprovalLevel.LEVEL_1));

		purchaseRequestRepository.save(request("Pending A", requester, PurchaseRequestStatus.PENDING, ApprovalLevel.LEVEL_1));
		PurchaseRequest approvedRequest = request("Approved A", requester, PurchaseRequestStatus.PENDING, ApprovalLevel.LEVEL_1);
		approvedRequest.markApproved(approver, OffsetDateTime.now());
		purchaseRequestRepository.save(approvedRequest);
		purchaseRequestRepository.save(request("Pending B", otherRequester, PurchaseRequestStatus.PENDING, ApprovalLevel.LEVEL_1));

		entityManager.flush();
		entityManager.clear();

		var page = purchaseRequestRepository.findAllByRequesterIdAndStatus(
			requester.getId(),
			PurchaseRequestStatus.PENDING,
			PageRequest.of(0, 10)
		);

		assertThat(page.getContent()).hasSize(1);
		assertThat(page.getContent().getFirst().getTitle()).isEqualTo("Pending A");
		assertThat(page.getContent().getFirst().getRequester().getId()).isEqualTo(requester.getId());
	}

	@Test
	void findAllByRequesterIdAppliesPagination() {
		User requester = userRepository.save(user(uniqueEmail("requester"), UserRole.SOLICITANTE, ApprovalLevel.LEVEL_0));

		purchaseRequestRepository.save(request("Request 1", requester, PurchaseRequestStatus.PENDING, ApprovalLevel.LEVEL_1));
		purchaseRequestRepository.save(request("Request 2", requester, PurchaseRequestStatus.PENDING, ApprovalLevel.LEVEL_2));
		purchaseRequestRepository.save(request("Request 3", requester, PurchaseRequestStatus.PENDING, ApprovalLevel.LEVEL_3));

		entityManager.flush();
		entityManager.clear();

		var page = purchaseRequestRepository.findAllByRequesterId(requester.getId(), PageRequest.of(0, 2));

		assertThat(page.getContent()).hasSize(2);
		assertThat(page.getTotalElements()).isEqualTo(3);
		assertThat(page.getTotalPages()).isEqualTo(2);
	}

	@Test
	void findWithUsersByIdLoadsRequesterAndResolvedBy() {
		String requesterEmail = uniqueEmail("requester");
		String adminEmail = uniqueEmail("admin");
		User requester = userRepository.save(user(requesterEmail, UserRole.SOLICITANTE, ApprovalLevel.LEVEL_0));
		User admin = userRepository.save(user(adminEmail, UserRole.ADMIN, ApprovalLevel.LEVEL_3));

		PurchaseRequest purchaseRequest = request("Resolved Request", requester, PurchaseRequestStatus.PENDING, ApprovalLevel.LEVEL_2);
		purchaseRequest.markApproved(admin, java.time.OffsetDateTime.now());
		PurchaseRequest savedRequest = purchaseRequestRepository.save(purchaseRequest);

		entityManager.flush();
		entityManager.clear();

		Optional<PurchaseRequest> loadedRequest = purchaseRequestRepository.findWithUsersById(savedRequest.getId());

		assertThat(loadedRequest).isPresent();
		assertThat(entityManagerFactory.getPersistenceUnitUtil().isLoaded(loadedRequest.get().getRequester())).isTrue();
		assertThat(entityManagerFactory.getPersistenceUnitUtil().isLoaded(loadedRequest.get().getResolvedBy())).isTrue();
		assertThat(loadedRequest.get().getRequester().getEmail()).isEqualTo(requesterEmail);
		assertThat(loadedRequest.get().getResolvedBy().getEmail()).isEqualTo(adminEmail);
	}

	private User user(String email, UserRole role, ApprovalLevel approvalLevel) {
		return new User("Test User", email, "encoded-password", role, approvalLevel);
	}

	private String uniqueEmail(String prefix) {
		return prefix + "." + UUID.randomUUID() + "@example.com";
	}

	private PurchaseRequest request(
		String title,
		User requester,
		PurchaseRequestStatus status,
		ApprovalLevel approvalLevel
	) {
		return new PurchaseRequest(
			title,
			"Description for " + title,
			new BigDecimal("1500.00"),
			"EQUIPMENT",
			status,
			approvalLevel,
			requester
		);
	}
}
