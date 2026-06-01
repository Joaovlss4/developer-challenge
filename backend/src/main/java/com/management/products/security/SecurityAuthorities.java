package com.management.products.security;

import com.management.products.user.ApprovalLevel;
import com.management.products.user.User;
import com.management.products.user.UserRole;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.Set;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

public final class SecurityAuthorities {

	public static final String ROLE_SOLICITANTE = "ROLE_SOLICITANTE";
	public static final String ROLE_APROVADOR = "ROLE_APROVADOR";
	public static final String ROLE_ADMIN = "ROLE_ADMIN";

	private SecurityAuthorities() {
	}

	public static Collection<? extends GrantedAuthority> forUser(User user) {
		Set<String> authorities = new LinkedHashSet<>();
		authorities.add(roleAuthority(user.getRole()));
		authorities.add(UserPermission.PROFILE_READ.authority());

		switch (user.getRole()) {
			case SOLICITANTE -> addSolicitanteAuthorities(authorities);
			case APROVADOR -> addAprovadorAuthorities(authorities, user.getApprovalLevel());
			case ADMIN -> addAdminAuthorities(authorities);
		}

		return authorities.stream()
			.map(SimpleGrantedAuthority::new)
			.toList();
	}

	public static String roleAuthority(UserRole role) {
		return switch (role) {
			case SOLICITANTE -> ROLE_SOLICITANTE;
			case APROVADOR -> ROLE_APROVADOR;
			case ADMIN -> ROLE_ADMIN;
		};
	}

	private static void addSolicitanteAuthorities(Set<String> authorities) {
		authorities.add(UserPermission.REQUEST_CREATE.authority());
	}

	private static void addAprovadorAuthorities(Set<String> authorities, ApprovalLevel approvalLevel) {
		authorities.add(UserPermission.REQUEST_READ_ALL.authority());
		authorities.add(UserPermission.REQUEST_REVIEW.authority());
		if (approvalLevel == ApprovalLevel.LEVEL_1) {
			authorities.add(UserPermission.REQUEST_APPROVE_LEVEL_1.authority());
		} else if (approvalLevel == ApprovalLevel.LEVEL_2) {
			authorities.add(UserPermission.REQUEST_APPROVE_LEVEL_1.authority());
			authorities.add(UserPermission.REQUEST_APPROVE_LEVEL_2.authority());
		}
	}

	private static void addAdminAuthorities(Set<String> authorities) {
		authorities.add(UserPermission.USER_MANAGE.authority());
		authorities.add(UserPermission.REQUEST_CREATE.authority());
		authorities.add(UserPermission.REQUEST_REVIEW.authority());
		authorities.add(UserPermission.REQUEST_APPROVE_LEVEL_3.authority());
		authorities.add(UserPermission.REQUEST_READ_ALL.authority());
		authorities.add(UserPermission.REQUEST_CANCEL_ANY.authority());
	}
}
