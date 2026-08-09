package com.sulultours.repository;

import com.sulultours.entity.RoleEnum;
import com.sulultours.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByTenantId(String tenantId);
    List<User> findByRoleAndTenantId(RoleEnum role, String tenantId);
    Optional<User> findByResetToken(String resetToken);

    boolean existsByRole(RoleEnum role);
}