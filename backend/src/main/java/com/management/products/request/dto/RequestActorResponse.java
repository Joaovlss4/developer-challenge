package com.management.products.request.dto;

import com.management.products.user.User;

public record RequestActorResponse(
	Long id,
	String name,
	String email
) {
	public static RequestActorResponse from(User user) {
		return new RequestActorResponse(user.getId(), user.getName(), user.getEmail());
	}
}
