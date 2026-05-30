package com.management.products.request.dto;

import jakarta.validation.constraints.Size;

public record RequestDecisionRequest(
	@Size(max = 2000)
	String comment
) {
}
