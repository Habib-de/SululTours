package com.sulultours.service;

import com.sulultours.entity.RoleEnum;
import com.sulultours.entity.User;
import com.sulultours.exception.ResourceNotFoundException;
import com.sulultours.repository.UserRepository;
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
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

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