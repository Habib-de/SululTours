package com.sulultours.controller;

import com.sulultours.dto.ApiResponse;
import com.sulultours.entity.User;
import com.sulultours.service.PushNotificationService;
import com.sulultours.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/push")  // ✅ FOLLOWS YOUR OTHER CONTROLLERS (NO /api)
@RequiredArgsConstructor
public class PushSubscriptionController {

    private final PushNotificationService pushService;
    private final UserService userService;

    @PostMapping("/subscribe")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> subscribe(
            @RequestBody Map<String, Object> request,
            HttpServletRequest httpRequest) {
        
        try {
            User user = userService.getCurrentUser();
            
            String endpoint = (String) request.get("endpoint");
            String authKey = (String) request.get("authKey");
            String p256dhKey = (String) request.get("p256dhKey");
            String deviceType = (String) request.getOrDefault("deviceType", "WEB");
            String fcmToken = (String) request.get("fcmToken");
            String userAgent = httpRequest.getHeader("User-Agent");
            
            if (endpoint == null || endpoint.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Endpoint is required"));
            }
            
            if ("WEB".equals(deviceType) && (authKey == null || p256dhKey == null)) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Auth and P256DH keys are required for web push"));
            }
            
            pushService.saveSubscription(user, endpoint, authKey, p256dhKey, deviceType, fcmToken, userAgent);
            
            return ResponseEntity.ok(ApiResponse.success("Subscribed to push notifications successfully", null));
            
        } catch (Exception e) {
            log.error("Failed to subscribe to push notifications", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to subscribe: " + e.getMessage()));
        }
    }

    @PostMapping("/unsubscribe")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> unsubscribe(@RequestBody Map<String, String> request) {
        try {
            String endpoint = request.get("endpoint");
            
            if (endpoint == null || endpoint.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Endpoint is required"));
            }
            
            pushService.deleteSubscription(endpoint);
            return ResponseEntity.ok(ApiResponse.success("Unsubscribed from push notifications successfully", null));
            
        } catch (Exception e) {
            log.error("Failed to unsubscribe from push notifications", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to unsubscribe: " + e.getMessage()));
        }
    }

    @GetMapping("/vapid-key")
    public ResponseEntity<ApiResponse<String>> getVapidKey() {
        try {
            String publicKey = pushService.getVapidPublicKey();
            if (publicKey == null || publicKey.isEmpty()) {
                return ResponseEntity.ok(ApiResponse.error("VAPID key not configured"));
            }
            return ResponseEntity.ok(ApiResponse.success(publicKey));
        } catch (Exception e) {
            log.error("Failed to get VAPID key", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to get VAPID key: " + e.getMessage()));
        }
    }
}