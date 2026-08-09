package com.sulultours.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sulultours.entity.PushSubscription;
import com.sulultours.entity.User;
import com.sulultours.repository.PushSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.PostConstruct;
import java.security.Security;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PushNotificationService {

    private final PushSubscriptionRepository subscriptionRepository;
    private final ObjectMapper objectMapper;

    @Value("${vapid.public.key:}")
    private String vapidPublicKey;

    @Value("${vapid.private.key:}")
    private String vapidPrivateKey;

    private PushService pushService;

    @PostConstruct
    public void init() {
        try {
            Security.addProvider(new BouncyCastleProvider());
            pushService = new PushService(vapidPublicKey, vapidPrivateKey);
            log.info("✅ Web Push service initialized successfully");
        } catch (Exception e) {
            log.error("❌ Failed to initialize Web Push service: {}", e.getMessage());
        }
    }

    // ==========================================
    // SUBSCRIPTION MANAGEMENT
    // ==========================================
    
    @Transactional
    public void saveSubscription(User user, String endpoint, String authKey, String p256dhKey, 
                                  String deviceType, String fcmToken, String userAgent) {
        // Check if subscription already exists
        subscriptionRepository.findByEndpoint(endpoint).ifPresent(existing -> {
            subscriptionRepository.delete(existing);
        });

        PushSubscription subscription = new PushSubscription();
        subscription.setUser(user);
        subscription.setEndpoint(endpoint);
        subscription.setAuthKey(authKey);
        subscription.setP256dhKey(p256dhKey);
        subscription.setDeviceType(deviceType != null ? deviceType : "WEB");
        subscription.setFcmToken(fcmToken);
        subscription.setUserAgent(userAgent);
        subscription.setIsActive(true);
        subscription.setCreatedAt(LocalDateTime.now());
        subscription.setUpdatedAt(LocalDateTime.now());

        subscriptionRepository.save(subscription);
        log.info("✅ Push subscription saved for user: {}", user.getId());
    }

    @Transactional
    public void deleteSubscription(String endpoint) {
        subscriptionRepository.deleteByEndpoint(endpoint);
        log.info("🗑️ Push subscription deleted: {}", endpoint);
    }

    @Transactional
    public void deactivateSubscription(String endpoint) {
        subscriptionRepository.findByEndpoint(endpoint).ifPresent(sub -> {
            sub.setIsActive(false);
            subscriptionRepository.save(sub);
            log.info("🔴 Push subscription deactivated: {}", endpoint);
        });
    }

    public List<PushSubscription> getUserSubscriptions(String userId) {
        return subscriptionRepository.findByUserIdAndIsActiveTrue(userId);
    }

    public String getVapidPublicKey() {
        return vapidPublicKey;
    }

    // ==========================================
    // SEND WEB PUSH NOTIFICATION (ACTUAL SENDING)
    // ==========================================
    
    public void sendWebPush(PushSubscription subscription, String title, String body, Map<String, String> data) {
        try {
            // Prepare the payload
            Map<String, Object> payload = new HashMap<>();
            payload.put("title", title);
            payload.put("body", body);
            payload.put("data", data != null ? data : new HashMap<>());
            payload.put("icon", "/icn11.png");
            payload.put("badge", "/icn11.png");

            String payloadJson = objectMapper.writeValueAsString(payload);

            // Create notification
            Notification notification = new Notification(
                subscription.getEndpoint(),
                subscription.getP256dhKey(),
                subscription.getAuthKey(),
                payloadJson
            );

            // Send notification
            pushService.send(notification);
            log.info("📤 Web push sent successfully to: {}", subscription.getEndpoint().substring(0, Math.min(50, subscription.getEndpoint().length())) + "...");

        } catch (Exception e) {
            log.error("❌ Failed to send web push: {}", e.getMessage());
            
            // If subscription is invalid (410 Gone), deactivate it
            if (e.getMessage() != null && (e.getMessage().contains("410") || e.getMessage().contains("Gone"))) {
                deactivateSubscription(subscription.getEndpoint());
                log.info("🔴 Subscription deactivated due to 410 Gone");
            }
        }
    }

    // ==========================================
    // SEND PUSH TO USER (ALL DEVICES)
    // ==========================================
    
    public void sendPushToUser(User user, String title, String body, Map<String, String> data) {
        if (user == null) {
            log.warn("⚠️ Cannot send push: User is null");
            return;
        }

        List<PushSubscription> subscriptions = getUserSubscriptions(user.getId());
        
        if (subscriptions.isEmpty()) {
            log.info("ℹ️ No push subscriptions found for user: {}", user.getId());
            return;
        }

        log.info("📤 Sending push to {} devices for user: {}", subscriptions.size(), user.getId());

        // Send to each device
        for (PushSubscription subscription : subscriptions) {
            // For Web (Browser) subscriptions
            if ("WEB".equals(subscription.getDeviceType())) {
                sendWebPush(subscription, title, body, data);
            }
            // For Mobile (Android/iOS)
            else {
                log.info("   → Mobile device ({}), FCM token: {}", 
                         subscription.getDeviceType(), 
                         subscription.getFcmToken() != null ? "present" : "not set");
            }
        }
    }

    public void sendPushToUser(User user, String title, String body) {
        sendPushToUser(user, title, body, new HashMap<>());
    }
}