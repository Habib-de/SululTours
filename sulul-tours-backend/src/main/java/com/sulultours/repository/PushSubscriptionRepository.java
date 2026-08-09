package com.sulultours.repository;

import com.sulultours.entity.PushSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, String> {
    
    List<PushSubscription> findByUserId(String userId);
    
    List<PushSubscription> findByUserIdAndIsActiveTrue(String userId);
    
    Optional<PushSubscription> findByEndpoint(String endpoint);
    
    void deleteByEndpoint(String endpoint);
    
    long countByUserId(String userId);
}