package com.sulultours.controller;

import com.sulultours.dto.*;
import com.sulultours.exception.BadRequestException;
import com.sulultours.exception.ResourceNotFoundException;
import com.sulultours.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.sulultours.entity.AuditLog;
import com.sulultours.entity.Tenant;
import com.sulultours.entity.User;
import com.sulultours.service.AuditLogService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import lombok.extern.slf4j.Slf4j;
import com.sulultours.repository.UserRepository;


import javax.validation.Valid;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;
    private final AuditLogService auditLogService;
    private final UserRepository userRepository; 

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        try {
            LoginResponse response = authService.login(request);
            return ResponseEntity.ok(ApiResponse.success("Login successful", response));
        } catch (BadRequestException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("An unexpected error occurred"));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserDTO>> register(@Valid @RequestBody RegisterRequest request) {
        try {
            // ✅ Check if Super Admin already exists
        if (request.getRole() != null && request.getRole().equals("super_admin")) {
            boolean superAdminExists = userRepository.existsByRole(com.sulultours.entity.RoleEnum.super_admin);
            if (superAdminExists) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("❌ A Super Admin already exists in the system"));
            }
            
            // ✅ Validate Admin Key
            String adminKey = request.getAdminKey();
            String ADMIN_SECRET_KEY = System.getenv().getOrDefault("ADMIN_SECRET_KEY", "sulul_admin_2026");
            
            if (adminKey == null || adminKey.isEmpty() || !adminKey.equals(ADMIN_SECRET_KEY)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("❌ Invalid admin registration key"));
            }
        }
            UserDTO response = authService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Registration successful", response));
        } catch (BadRequestException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Registration failed"));
        }
    }

    @PostMapping("/logout")
public ResponseEntity<ApiResponse<Void>> logout() {
    System.out.println("🔍 ===== LOGOUT CALLED =====");
    
    User user = null;
    String userEmail = null;
    String userId = null;
    String userRole = null;
    Tenant userTenant = null;
    
    try {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        System.out.println("🔍 Authentication: " + auth);
        
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            Object principal = auth.getPrincipal();
            System.out.println("🔍 Principal: " + principal);
            System.out.println("🔍 Principal class: " + principal.getClass().getName());
            
            // ✅ Check for Spring Security's User (not your custom User)
            if (principal instanceof org.springframework.security.core.userdetails.User) {
                org.springframework.security.core.userdetails.User springUser = 
                    (org.springframework.security.core.userdetails.User) principal;
                userEmail = springUser.getUsername();
                System.out.println("✅ Spring Security User found: " + userEmail);
                
                // ✅ Get the real User from database using email
                try {
                    user = userRepository.findByEmail(userEmail).orElse(null);
                    if (user != null) {
                        userId = user.getId();
                        userRole = user.getRole() != null ? user.getRole().name() : null;
                        userTenant = user.getTenant();
                        System.out.println("✅ Found custom User by email: " + userEmail);
                    }
                } catch (Exception e) {
                    System.err.println("Error finding user: " + e.getMessage());
                }
            } 
            // ✅ Check for your custom User
            else if (principal instanceof User) {
                user = (User) principal;
                userEmail = user.getEmail();
                userId = user.getId();
                userRole = user.getRole() != null ? user.getRole().name() : null;
                userTenant = user.getTenant();
                System.out.println("✅ Custom User found: " + userEmail);
            } 
            // ✅ Fallback: if principal is just a String (email)
            else if (principal instanceof String) {
                userEmail = (String) principal;
                System.out.println("✅ Principal is email string: " + userEmail);
                
                try {
                    user = userRepository.findByEmail(userEmail).orElse(null);
                    if (user != null) {
                        userId = user.getId();
                        userRole = user.getRole() != null ? user.getRole().name() : null;
                        userTenant = user.getTenant();
                        System.out.println("✅ User found by email: " + userEmail);
                    }
                } catch (Exception e) {
                    System.err.println("Error finding user: " + e.getMessage());
                }
            }
        }
        
        // ✅ If we have email but no user, try one more time
        if (user == null && userEmail != null) {
            try {
                user = userRepository.findByEmail(userEmail).orElse(null);
                if (user != null) {
                    userId = user.getId();
                    userRole = user.getRole() != null ? user.getRole().name() : null;
                    userTenant = user.getTenant();
                    System.out.println("✅ User found by email (final attempt): " + userEmail);
                }
            } catch (Exception e) {
                System.err.println("Error finding user: " + e.getMessage());
            }
        }
        
        // ✅ ALWAYS create audit log - use what we have
        System.out.println("📝 Creating audit log...");
        AuditLog auditLog = new AuditLog();
        auditLog.setAction("LOGOUT");
        auditLog.setEntity("Auth");
        auditLog.setDetails("User " + (userEmail != null ? userEmail : "unknown") + " logged out");
        auditLog.setStatus("Success");
        
        if (user != null) {
            auditLog.setUser(user);
            auditLog.setUserEmail(user.getEmail());
            auditLog.setUserRole(user.getRole() != null ? user.getRole().name() : null);
            auditLog.setEntityId(user.getId());
            auditLog.setTenant(user.getTenant());
            System.out.println("✅ Logout: User set from user object: " + user.getEmail());
        } else if (userEmail != null) {
            auditLog.setUserEmail(userEmail);
            System.out.println("✅ Logout: User email set: " + userEmail);
        } else {
            System.out.println("⚠️ Logout: No user information available");
        }
        
        // Get IP and User-Agent
        try {
            org.springframework.web.context.request.ServletRequestAttributes attributes = 
                (org.springframework.web.context.request.ServletRequestAttributes) 
                org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                javax.servlet.http.HttpServletRequest request = attributes.getRequest();
                String ip = request.getHeader("X-Forwarded-For");
                if (ip == null || ip.isEmpty()) {
                    ip = request.getRemoteAddr();
                }
                auditLog.setIpAddress(ip);
                auditLog.setUserAgent(request.getHeader("User-Agent"));
                System.out.println("✅ IP: " + ip);
            }
        } catch (Exception e) {
            System.err.println("Could not get IP/UserAgent: " + e.getMessage());
        }
        
        // ✅ Save the audit log
        AuditLog savedLog = auditLogService.createAuditLog(auditLog);
        System.out.println("✅ LOGOUT AUDIT LOG SAVED!");
        System.out.println("   - ID: " + savedLog.getId());
        System.out.println("   - User Email: " + savedLog.getUserEmail());
        System.out.println("   - User ID: " + (savedLog.getUser() != null ? savedLog.getUser().getId() : "null"));
        System.out.println("   - Role: " + savedLog.getUserRole());
        
    } catch (Exception e) {
        System.err.println("❌ Error creating logout log: " + e.getMessage());
        e.printStackTrace();
    }
    
    SecurityContextHolder.clearContext();
    System.out.println("🔍 ===== LOGOUT COMPLETED =====");
    
    return ResponseEntity.ok(ApiResponse.success("Logout successful", null));
}

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            authService.forgotPassword(request.getEmail());
            return ResponseEntity.ok(ApiResponse.success("Password reset link sent to your email", null));
        } catch (BadRequestException | ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to send reset link"));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            authService.resetPassword(request.getToken(), request.getNewPassword());
            return ResponseEntity.ok(ApiResponse.success("Password reset successfully", null));
        } catch (BadRequestException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to reset password"));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDTO>> getCurrentUser() {
        com.sulultours.entity.User user = authService.getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("User not authenticated"));
        }
        
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setName(user.getName());
        dto.setPhone(user.getPhone());
        dto.setRole(user.getRole() != null ? user.getRole().name() : null);
        dto.setStatus(user.getStatus());
        dto.setTenantId(user.getTenant() != null ? user.getTenant().getId() : null);
        dto.setAvatar(user.getAvatar());
        dto.setCreatedAt(user.getCreatedAt());
        
        return ResponseEntity.ok(ApiResponse.success(dto));
    }
}