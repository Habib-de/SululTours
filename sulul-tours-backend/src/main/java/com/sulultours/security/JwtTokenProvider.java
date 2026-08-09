package com.sulultours.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Slf4j
@Component
public class JwtTokenProvider {

    // ✅ HARDCODE THE SECRET (same as in application.properties)
    private static final String JWT_SECRET = "sulul_tours_super_secret_key_change_this_in_production_2026_make_it_really_long_64chars!!";
    private static final int JWT_EXPIRATION = 86400000;

    private Key key;

    @PostConstruct
    public void init() {
        log.info("🔑 Initializing JWT Token Provider");
        byte[] keyBytes = JWT_SECRET.getBytes(StandardCharsets.UTF_8);
        this.key = Keys.hmacShaKeyFor(keyBytes);
        log.info("✅ JWT Secret initialized");
    }

    public String generateToken(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        
        String userId = null;
        String name = null;
        String role = null;
        String tenantId = null;

        if (principal instanceof com.sulultours.entity.User) {
            com.sulultours.entity.User user = (com.sulultours.entity.User) principal;
            userId = user.getId();
            name = user.getName();
            role = user.getRole() != null ? user.getRole().name() : null;
            tenantId = user.getTenant() != null ? user.getTenant().getId() : null;
        }

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + JWT_EXPIRATION);

        String token = Jwts.builder()
                .setSubject(((UserDetails) principal).getUsername())
                .claim("id", userId)
                .claim("name", name)
                .claim("role", role)
                .claim("tenantId", tenantId)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(key, SignatureAlgorithm.HS512)
                .compact();

        log.info("✅ Token generated for user: {}", ((UserDetails) principal).getUsername());
        return token;
    }

    public String generateToken(String email) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + JWT_EXPIRATION);

        String token = Jwts.builder()
                .setSubject(email)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(key, SignatureAlgorithm.HS512)
                .compact();

        log.info("✅ Token generated for email: {}", email);
        return token;
    }

    public String getUsernameFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claims.getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token);
            log.debug("✅ Token is valid");
            return true;
        } catch (ExpiredJwtException ex) {
            log.error("❌ JWT token is expired: {}", ex.getMessage());
        } catch (UnsupportedJwtException ex) {
            log.error("❌ JWT token is unsupported: {}", ex.getMessage());
        } catch (MalformedJwtException ex) {
            log.error("❌ JWT token is malformed: {}", ex.getMessage());
        } catch (SignatureException ex) {
            log.error("❌ JWT token signature is invalid: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            log.error("❌ JWT token is empty or null: {}", ex.getMessage());
        }
        return false;
    }
}