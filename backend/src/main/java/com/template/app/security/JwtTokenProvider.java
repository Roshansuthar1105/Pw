package com.template.app.security;

import com.template.app.model.UserType;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Slf4j
@Component
public class JwtTokenProvider {

    private final SecretKey key;
    private final long expirationMs;

    public JwtTokenProvider(
            @Value("${app.jwt.secret:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}") String secret,
            @Value("${app.jwt.expiration-ms:86400000}") long expirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generateToken(UserPrincipal principal) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(String.valueOf(principal.getId()))
                .claim("username", principal.getUsername())
                .claim("email", principal.getEmail())
                .claim("userType", principal.getUserType().name())
                .claim("superAdmin", principal.isSuperAdmin())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    public UserPrincipal parseToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            Long id = Long.parseLong(claims.getSubject());
            String username = claims.get("username", String.class);
            String email = claims.get("email", String.class);
            String userTypeStr = claims.get("userType", String.class);
            Boolean superAdmin = claims.get("superAdmin", Boolean.class);

            return UserPrincipal.builder()
                    .id(id)
                    .username(username)
                    .email(email)
                    .userType(userTypeStr != null ? UserType.valueOf(userTypeStr) : UserType.STUDENT)
                    .superAdmin(Boolean.TRUE.equals(superAdmin))
                    .build();
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Invalid JWT token: {}", e.getMessage());
            return null;
        }
    }
}
