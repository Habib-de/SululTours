package com.sulultours.service;

import com.sulultours.entity.RoleEnum;
import com.sulultours.entity.User;
import com.sulultours.exception.ResourceNotFoundException;
import com.sulultours.repository.UserRepository;
import com.sulultours.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder; 
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final com.sulultours.repository.TenantRepository tenantRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;
    private final NotificationRepository notificationRepository;
    private final com.sulultours.repository.BookingRepository bookingRepository;
    private final com.sulultours.repository.AuditLogRepository auditLogRepository;
    private final com.sulultours.repository.PushSubscriptionRepository pushSubscriptionRepository;
    private final com.sulultours.repository.ExpenseRepository expenseRepository;
    private final com.sulultours.repository.CarOwnerRepository carOwnerRepository;
    private final com.sulultours.repository.VehicleRepository vehicleRepository;

    public User getUserById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

     public User getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails) {
            String email = ((UserDetails) principal).getUsername();
            return getUserByEmail(email);
        }
        throw new RuntimeException("User not authenticated");
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<User> getUsersByTenant(String tenantId) {
        return userRepository.findByTenantId(tenantId);
    }

    public List<User> getUsersByRoleAndTenant(RoleEnum role, String tenantId) {
        return userRepository.findByRoleAndTenantId(role, tenantId);
    }

     // ==========================================
    // ✅ CREATE USER (used by FM to create brokers)
    // ==========================================
    @Transactional
    public com.sulultours.dto.UserDTO createUser(String email, String name, String phone,
                                                  String password, String roleStr, String tenantId) {
        if (email == null || name == null || password == null || roleStr == null) {
            throw new com.sulultours.exception.BadRequestException(
                "email, name, password, and role are required");
        }
        if (userRepository.existsByEmail(email)) {
            throw new com.sulultours.exception.BadRequestException(
                "Email already registered: " + email);
        }

        RoleEnum role;
        try {
            role = RoleEnum.valueOf(roleStr);
        } catch (IllegalArgumentException e) {
            throw new com.sulultours.exception.BadRequestException("Invalid role: " + roleStr);
        }

        com.sulultours.entity.Tenant tenant = null;
        if (tenantId != null && !tenantId.isEmpty()) {
            tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new com.sulultours.exception.BadRequestException(
                    "Tenant not found: " + tenantId));
        }

        User user = new User();
        user.setEmail(email);
        user.setName(name);
        user.setPhone(phone);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(role);
        user.setTenant(tenant);
        user.setStatus("active");  // ✅ FM-created accounts are active immediately

        User saved = userRepository.save(user);

        createAuditLog("USER_CREATED", "User", saved.getId(),
            "User " + saved.getEmail() + " created with role: " + saved.getRole());

        com.sulultours.dto.UserDTO dto = new com.sulultours.dto.UserDTO();
        dto.setId(saved.getId());
        dto.setEmail(saved.getEmail());
        dto.setName(saved.getName());
        dto.setPhone(saved.getPhone());
        dto.setRole(saved.getRole().name());
        dto.setStatus(saved.getStatus());
        dto.setTenantId(tenant != null ? tenant.getId() : null);
        dto.setCreatedAt(saved.getCreatedAt());
        return dto;
    }

    @Transactional
public User updateUser(String id, User userDetails) {
    User user = getUserById(id);

    String oldName = user.getName();
    String oldStatus = user.getStatus();
    
    // ✅ Only update fields that are not null
    if (userDetails.getName() != null) {
        user.setName(userDetails.getName());
    }
    if (userDetails.getPhone() != null) {
        user.setPhone(userDetails.getPhone());
    }
    if (userDetails.getAvatar() != null) {
        user.setAvatar(userDetails.getAvatar());
    }
    if (userDetails.getStatus() != null) {
        user.setStatus(userDetails.getStatus());
    }
    if (userDetails.getIdNumber() != null) {
        user.setIdNumber(userDetails.getIdNumber());
    }
    if (userDetails.getAddress() != null) {
        user.setAddress(userDetails.getAddress());
    }
    
    User updated = userRepository.save(user);  // ← This must be BEFORE audit log
    
    // Audit log goes here (AFTER save)
        createAuditLog("USER_UPDATED", "User", updated.getId(), 
        "User " + updated.getEmail() + " updated. Name: " + oldName + " → " + updated.getName() + 
        ", Status: " + oldStatus + " → " + updated.getStatus());
    
    return updated;  // ← This must be AFTER audit log
}



    @Transactional
    public User updateAvatar(String userId, String avatarData) {
        User user = getUserById(userId);
        user.setAvatar(avatarData);
        User updated = userRepository.save(user);  // ← ADD THIS LINE (declare updated)
    
    // Audit log
        createAuditLog("USER_AVATAR_UPDATED", "User", updated.getId(), 
        "User " + updated.getEmail() + " updated avatar");
    
    return updated;  // ← This should return updated
    }

    @Transactional
    public void changePassword(String id, String newPassword) {
        User user = getUserById(id);
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

            

    createAuditLog("PASSWORD_CHANGED", "User", user.getId(), 
        "Password changed for user " + user.getEmail());
    }

    @Transactional
    public void deleteUser(String id) {
        User user = getUserById(id);
        String userEmail = user.getEmail();

        // 1. Delete notifications (no business value)
        notificationRepository.deleteByUserId(id);

        // 2. Delete push subscriptions (no business value)
        pushSubscriptionRepository.deleteByUserId(id);

        // 3. Nullify bookings (keep booking, remove user link)
        bookingRepository.nullifyUser(id);

        // 4. Nullify audit logs (keep log, remove user link)
        auditLogRepository.nullifyUser(id);

        // 5. Nullify expense attributions (keep expense, remove user link)
        expenseRepository.nullifyCreatedBy(id);

        // 6. Handle car_owner profile — block if they own vehicles
        com.sulultours.entity.CarOwner carOwnerProfile =
                carOwnerRepository.findByUserId(id).orElse(null);
        if (carOwnerProfile != null) {
                        java.util.List<com.sulultours.entity.Vehicle> vehicles =
                    vehicleRepository.findByOwnerId(carOwnerProfile.getId());
            if (vehicles != null && !vehicles.isEmpty()) {
                throw new com.sulultours.exception.BadRequestException(
                    "Cannot delete this user: they own " + vehicles.size() +
                    " vehicle(s). Reassign or delete the vehicles first.");
            }
            carOwnerRepository.delete(carOwnerProfile);
        }

        // 7. Finally delete the user
        userRepository.delete(user);

            

    createAuditLog("USER_DELETED", "User", id, 
        "User " + userEmail + " deleted");
    }

    // Add this helper method at the end of UserService.java
private void createAuditLog(String action, String entity, String entityId, String details) {
    try {
        com.sulultours.entity.AuditLog auditLog = new com.sulultours.entity.AuditLog();
        auditLog.setAction(action);
        auditLog.setEntity(entity);
        auditLog.setEntityId(entityId);
        auditLog.setDetails(details);
        auditLog.setStatus("Success");
        // Set current user email - you can get from SecurityContext
        // auditLog.setUserEmail(getCurrentUserEmail());
        auditLogService.createAuditLog(auditLog);
    } catch (Exception e) {
        System.err.println("Failed to create audit log: " + e.getMessage());
    }
}
}