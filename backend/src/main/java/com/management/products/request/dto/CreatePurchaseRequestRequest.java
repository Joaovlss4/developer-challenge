package com.management.products.request.dto;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record CreatePurchaseRequestRequest(
	@NotBlank
	@Size(max = 160)
	String title,

	@NotBlank
	@Size(max = 5000)
	String description,

	@NotNull
	@Positive
	@Digits(integer = 10, fraction = 2)
	BigDecimal amount,

	@NotBlank
	@Size(max = 80)
	String category
) {
}
