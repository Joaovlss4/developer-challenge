package com.management.products.security;

public enum UserPermission {
	PROFILE_READ("profile:read"),
	USER_MANAGE("user:manage"),
	REQUEST_CREATE("request:create"),
	REQUEST_READ_OWN("request:read:own"),
	REQUEST_CANCEL_OWN("request:cancel:own"),
	REQUEST_REVIEW("request:review"),
	REQUEST_APPROVE_LEVEL_1("request:approve:level1"),
	REQUEST_APPROVE_LEVEL_2("request:approve:level2"),
	REQUEST_APPROVE_LEVEL_3("request:approve:level3"),
	REQUEST_READ_ALL("request:read:all"),
	REQUEST_CANCEL_ANY("request:cancel:any");

	private final String authority;

	UserPermission(String authority) {
		this.authority = authority;
	}

	public String authority() {
		return authority;
	}
}
