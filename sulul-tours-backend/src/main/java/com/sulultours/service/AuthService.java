package com.sulultours.service;

import com.sulultours.dto.LoginRequest;
import com.sulultours.dto.LoginResponse;
import com.sulultours.dto.RegisterRequest;
import com.sulultours.dto.UserDTO;
import com.sulultours.entity.AuditLog;
import com.sulultours.entity.CarOwner;
import com.sulultours.entity.RoleEnum;
import com.sulultours.entity.Tenant;
import com.sulultours.entity.User;
import com.sulultours.exception.BadRequestException;
import com.sulultours.exception.ResourceNotFoundException;
import com.sulultours.repository.CarOwnerRepository;
import com.sulultours.repository.TenantRepository;
import com.sulultours.repository.UserRepository;
import com.sulultours.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import com.sulultours.service.EmailService;

import java.time.LocalDateTime;
import java.util.UUID;

import javax.servlet.http.HttpServletRequest;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final CarOwnerRepository carOwnerRepository;
    private final JwtTokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;
    private final EmailService emailService; 

    @Transactional
    public LoginResponse login(LoginRequest request) {
        try {
            // ✅ First authenticate
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = tokenProvider.generateToken(authentication);

            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            // ✅ Check user status AFTER authentication
            // ✅ Check user status AFTER authentication
if ("pending".equals(user.getStatus())) {
    if (user.getRole() == RoleEnum.fleet_manager) {
        throw new BadRequestException("Your Fleet Manager account is pending Super Admin approval. Please contact the system administrator.");
    } else if (user.getRole() == RoleEnum.car_owner) {
        throw new BadRequestException("Your Car Owner account is pending Fleet Manager approval. Please wait for approval.");
    } else {
        throw new BadRequestException("Your account is pending approval. Please wait for an administrator to activate your account.");
    }
}
            
            if ("inactive".equals(user.getStatus()) || "suspended".equals(user.getStatus())) {
                throw new BadRequestException("Your account is " + user.getStatus() + ". Please contact support.");
            }

            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);

            createAuditLog("LOGIN_SUCCESS", "Auth", user.getId(), "User " + user.getEmail() + " logged in successfully");

            Tenant tenant = user.getTenant();

            return new LoginResponse(
                    jwt,
                    null,
                    user.getId(),
                    user.getEmail(),
                    user.getName(),
                    user.getRole() != null ? user.getRole().name() : null,
                    tenant != null ? tenant.getId() : null,
                    tenant != null ? tenant.getName() : null,
                    user.getAvatar(),
                    null
            );
        } catch (BadCredentialsException e) {

            createAuditLog("LOGIN_FAILED", "Auth", null, "Failed login attempt for email: " + request.getEmail());
            throw new BadRequestException("Invalid email or password");
        }
    }

    @Transactional
    public UserDTO register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        RoleEnum role;
        try {
            role = RoleEnum.valueOf(request.getRole());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid role: " + request.getRole());
        }

        Tenant tenant = null;

        // ✅ FLEET MANAGER - Create new tenant
        if (role == RoleEnum.fleet_manager) {
            if (request.getSubdomain() == null || request.getSubdomain().isEmpty()) {
                throw new BadRequestException("Subdomain is required for Fleet Manager");
            }
            if (tenantRepository.existsBySubdomain(request.getSubdomain())) {
                throw new BadRequestException("Subdomain already exists: " + request.getSubdomain());
            }
            
            tenant = new Tenant();
            tenant.setId(UUID.randomUUID().toString());
            tenant.setName(request.getCompanyName());
            tenant.setSubdomain(request.getSubdomain());
            tenant.setStatus("active");
            tenant.setPlan("Enterprise");
            tenant = tenantRepository.save(tenant);
        }
        // ✅ CAR OWNER - Use existing tenant
        else if (role == RoleEnum.car_owner) {
            if (request.getTenantId() == null || request.getTenantId().isEmpty()) {
                throw new BadRequestException("Tenant ID is required for Car Owner");
            }
            tenant = tenantRepository.findById(request.getTenantId())
                    .orElseThrow(() -> new BadRequestException("Tenant not found: " + request.getTenantId()));
        }

        else if (role == RoleEnum.client) {
            // First try to use tenantId from request
            if (request.getTenantId() != null && !request.getTenantId().isEmpty()) {
                tenant = tenantRepository.findById(request.getTenantId())
                        .orElse(null);
            }
            
            // If no tenantId provided or tenant not found, use default tenant
            if (tenant == null) {
                // Try to find tenant by subdomain 'sulul'
                tenant = tenantRepository.findBySubdomain("sulul").orElse(null);
                
                // If not found, get the first active tenant
                if (tenant == null) {
                    List<Tenant> tenants = tenantRepository.findAll();
                    tenant = tenants.stream()
                            .filter(t -> "active".equals(t.getStatus()))
                            .findFirst()
                            .orElse(null);
                }
            }
            
            // If still no tenant, create a default one
            if (tenant == null) {
                tenant = new Tenant();
                tenant.setId(UUID.randomUUID().toString());
                tenant.setName("Sulul Tours");
                tenant.setSubdomain("sulul");
                tenant.setStatus("active");
                tenant.setPlan("Enterprise");
                tenant = tenantRepository.save(tenant);
                log.info("✅ Created default tenant: Sulul Tours");
            }
            
            log.info("✅ Client assigned to tenant: {} ({})", tenant.getName(), tenant.getId());
        }

        // ✅ Create user with tenant
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setName(request.getName());
        user.setPhone(request.getPhone());
        user.setRole(role);
        user.setTenant(tenant);
        
        // ✅ Set status based on role
        if (role == RoleEnum.car_owner) {
            user.setStatus("pending");  // ✅ Car owners need approval
        } else if (role == RoleEnum.fleet_manager) {
            user.setStatus("pending");  // ✅ Fleet Managers need Super Admin approval
        } else {
            user.setStatus("active");   // ✅ Others can login immediately
        }

        User savedUser = userRepository.save(user);

        createAuditLog("USER_REGISTERED", "User", savedUser.getId(), "User " + savedUser.getEmail() + " registered with role: " + savedUser.getRole());


        // ✅ CREATE CAR OWNER PROFILE if role is car_owner
        if (role == RoleEnum.car_owner) {
            CarOwner carOwner = new CarOwner();
            carOwner.setId(UUID.randomUUID().toString());
            carOwner.setUser(savedUser);
            carOwner.setTenant(tenant);
            carOwner.setName(request.getName());
            carOwner.setEmail(request.getEmail());
            carOwner.setPhone(request.getPhone());
            carOwner.setAddress(request.getAddress());
            carOwner.setIdNumber(request.getIdNumber());
            carOwner.setCompanyName(request.getCompanyName());
            carOwner.setStatus("pending_approval");
            carOwner.setVehicleCount(0);
            carOwner.setCreatedAt(LocalDateTime.now());
            carOwner.setUpdatedAt(LocalDateTime.now());
            
            carOwnerRepository.save(carOwner);
            log.info("✅ Car owner profile created for: {}", request.getEmail());
        }

        UserDTO dto = new UserDTO();
        dto.setId(savedUser.getId());
        dto.setEmail(savedUser.getEmail());
        dto.setName(savedUser.getName());
        dto.setPhone(savedUser.getPhone());
        dto.setRole(savedUser.getRole() != null ? savedUser.getRole().name() : null);
        dto.setStatus(savedUser.getStatus());
        dto.setTenantId(tenant != null ? tenant.getId() : null);
        dto.setCreatedAt(savedUser.getCreatedAt());

        return dto;
    }

    @Transactional
public void forgotPassword(String email) {
    User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

    String resetToken = UUID.randomUUID().toString();
    user.setResetToken(resetToken);
    user.setResetTokenExpiry(LocalDateTime.now().plusHours(1));
    userRepository.save(user);

    createAuditLog("PASSWORD_RESET_REQUESTED", "User", user.getId(), "Password reset requested for user: " + user.getEmail());

    log.info("🔑 Password reset token generated for {}: {}", email, resetToken);
    
    // ✅ ADD THESE LINES - Send the email
    try {
        emailService.sendResetPasswordEmail(email, resetToken);
        log.info("✅ Password reset email sent to: {}", email);
    } catch (Exception e) {
        log.error("❌ Failed to send password reset email to {}: {}", email, e.getMessage());
    }
}

    @Transactional
    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByResetToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid or expired reset token"));

        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Reset token has expired");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);

        createAuditLog("PASSWORD_RESET", "User", user.getId(), "Password reset completed for user: " + user.getEmail());
    }

    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email).orElse(null);
    }

        private void createAuditLog(String action, String entity, String entityId, String details) {
    try {
        AuditLog auditLog = new AuditLog();
        auditLog.setAction(action);
        auditLog.setEntity(entity);
        auditLog.setEntityId(entityId);
        auditLog.setDetails(details);
        auditLog.setStatus("Success");
        
        // ✅ ALWAYS get user from repository using entityId
        if (entityId != null) {
            try {
                User user = userRepository.findById(entityId).orElse(null);
                if (user != null) {
                    // ✅ Set the user (this sets user_id via JPA)
                    auditLog.setUser(user);
                    // ✅ Set the tenant (this sets tenant_id via JPA)
                    auditLog.setTenant(user.getTenant());
                    // ✅ Set email and role
                    auditLog.setUserEmail(user.getEmail());
                    auditLog.setUserRole(user.getRole() != null ? user.getRole().name() : null);
                    
                    System.out.println("✅ Audit log: User found - " + user.getEmail() + 
                        ", Tenant: " + (user.getTenant() != null ? user.getTenant().getId() : "null"));
                } else {
                    System.out.println("⚠️ Audit log: No user found for ID: " + entityId);
                }
            } catch (Exception e) {
                System.err.println("❌ Failed to find user by ID: " + e.getMessage());
            }
        }
        
        // ✅ Set IP Address and User Agent
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) 
                RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                
                // Get IP
                String ip = request.getHeader("X-Forwarded-For");
                if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
                    ip = request.getHeader("X-Real-IP");
                }
                if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
                    ip = request.getRemoteAddr();
                }
                auditLog.setIpAddress(ip);
                
                // Get User Agent
                String userAgent = request.getHeader("User-Agent");
                auditLog.setUserAgent(userAgent);
            }
        } catch (Exception e) {
            log.warn("Could not get IP/UserAgent: {}", e.getMessage());
        }
        
        auditLogService.createAuditLog(auditLog);
    } catch (Exception e) {
        log.error("Failed to create audit log: {}", e.getMessage());
    }
}
}