package com.management.products.api;

public record ApiSuccessResponse<T>(T data) {

	public static <T> ApiSuccessResponse<T> of(T data) {
		return new ApiSuccessResponse<>(data);
	}
}
