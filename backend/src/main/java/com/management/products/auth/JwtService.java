package com.management.products.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

	private final SecretKey secretKey;
	private final long expirationMinutes;

	public JwtService(
		@Value("${security.jwt.secret}") String secret,
		@Value("${security.jwt.expiration-minutes}") long expirationMinutes
	) {
		if (secret == null || secret.length() < 32) {
			throw new IllegalStateException("JWT_SECRET must contain at least 32 characters");
		}
		this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
		this.expirationMinutes = expirationMinutes;
	}

	public String generateToken(AuthUserDetails userDetails) {
		Instant now = Instant.now();
		Instant expiresAt = now.plusSeconds(expirationMinutes * 60);

		return Jwts.builder()
			.subject(userDetails.getUsername())
			.claim("userId", userDetails.getUser().getId())
			.claim("role", userDetails.getUser().getRole().name())
			.claim("approvalLevel", userDetails.getUser().getApprovalLevel().name())
			.issuedAt(java.util.Date.from(now))
			.expiration(java.util.Date.from(expiresAt))
			.signWith(secretKey)
			.compact();
	}

	public String extractSubject(String token) {
		return extractClaims(token).getSubject();
	}

	public boolean isValid(String token, AuthUserDetails userDetails) {
		Claims claims = extractClaims(token);
		return userDetails.getUsername().equals(claims.getSubject())
			&& claims.getExpiration().toInstant().isAfter(Instant.now());
	}

	private Claims extractClaims(String token) {
		return Jwts.parser()
			.verifyWith(secretKey)
			.build()
			.parseSignedClaims(token)
			.getPayload();
	}
}
