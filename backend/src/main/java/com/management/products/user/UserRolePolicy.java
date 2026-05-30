package com.management.products.user;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class UserRolePolicy {

	public ApprovalLevel resolveApprovalLevel(UserRole role, ApprovalLevel requestedLevel) {
		return switch (role) {
			case SOLICITANTE -> {
				if (requestedLevel != null && requestedLevel != ApprovalLevel.LEVEL_0) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "SOLICITANTE users can only use LEVEL_0");
				}
				yield ApprovalLevel.LEVEL_0;
			}
			case APROVADOR -> {
				if (requestedLevel == null) {
					yield ApprovalLevel.LEVEL_1;
				}
				if (requestedLevel != ApprovalLevel.LEVEL_1 && requestedLevel != ApprovalLevel.LEVEL_2) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "APROVADOR users can only use LEVEL_1 or LEVEL_2");
				}
				yield requestedLevel;
			}
			case ADMIN -> {
				if (requestedLevel != null && requestedLevel != ApprovalLevel.LEVEL_3) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ADMIN users can only use LEVEL_3");
				}
				yield ApprovalLevel.LEVEL_3;
			}
		};
	}

	public ApprovalLevel resolveApprovalLevelForUpdate(
		UserRole currentRole,
		ApprovalLevel currentLevel,
		UserRole requestedRole,
		ApprovalLevel requestedLevel
	) {
		UserRole targetRole = requestedRole == null ? currentRole : requestedRole;
		if (requestedRole == null && requestedLevel == null) {
			return currentLevel;
		}
		if (requestedRole == null) {
			return resolveApprovalLevel(targetRole, requestedLevel);
		}

		return resolveApprovalLevel(targetRole, requestedLevel);
	}
}
