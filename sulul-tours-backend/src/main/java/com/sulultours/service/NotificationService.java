package com.sulultours.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sulultours.entity.Notification;
import com.sulultours.entity.User;
import com.sulultours.exception.ResourceNotFoundException;
import com.sulultours.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final PushNotificationService pushNotificationService;
    private final ObjectMapper objectMapper;

    @Transactional
    public Notification createNotification(Notification notification) {
        notification.setCreatedAt(LocalDateTime.now());
         if (notification.getTenant() == null && notification.getUser() != null) {
        notification.setTenant(notification.getUser().getTenant());
    }
        Notification saved = notificationRepository.save(notification);
        
        // Send push notification if user exists
        if (notification.getUser() != null) {
            Map<String, String> data = new HashMap<>();
            data.put("notificationId", saved.getId());
            data.put("type", notification.getType() != null ? notification.getType() : "info");
            
            pushNotificationService.sendPushToUser(
                notification.getUser(),
                notification.getTitle(),
                notification.getDescription(),
                data
            );
        }
        
        return saved;
    }

    @Transactional
    public Notification createNotification(User user, String title, String description, String type) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTenant(user.getTenant());
        notification.setTitle(title);
        notification.setDescription(description);
        notification.setType(type);
        notification.setIsRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        
        Notification saved = notificationRepository.save(notification);
        
        // Send push notification
        Map<String, String> data = new HashMap<>();
        data.put("notificationId", saved.getId());
        data.put("type", type != null ? type : "info");
        
        pushNotificationService.sendPushToUser(user, title, description, data);
        
        return saved;
    }

    public List<Notification> getNotificationsByUser(String userId) {
        return notificationRepository.findByUserId(userId);
    }

    public List<Notification> getUnreadNotifications(String userId) {
        return notificationRepository.findByUserIdAndIsReadFalse(userId);
    }

    public long countUnreadNotifications(String userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAsRead(String id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(String userId) {
        List<Notification> notifications = notificationRepository.findByUserIdAndIsReadFalse(userId);
        notifications.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(notifications);
    }

    @Transactional
    public void deleteNotification(String id) {
        notificationRepository.deleteById(id);
    }
}